import io
import csv
import uuid
import asyncio
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from fastapi.responses import StreamingResponse, PlainTextResponse
import pandas as pd
from app.db.models import BatchJob, BatchProspectRow, UserResponse
from app.api.auth import get_current_user
from app.db.mongodb import save_item, get_item, find_items
from app.agents.graph import outreach_graph

router = APIRouter(prefix="/api/batch", tags=["batch"])

async def process_batch_job_in_background(job_id: str):
    job_data = await get_item("batch_jobs", job_id)
    if not job_data:
        return

    job = BatchJob(**job_data)
    
    for row in job.rows:
        try:
            row.status = "processing"
            # Update status in DB
            await save_item("batch_jobs", job_id, job.dict())

            state_input = {
                "profile_text": row.profile or f"{row.name} {row.role} at {row.company} {row.custom_notes}",
                "prospect_name": row.name,
                "prospect_company": row.company or "",
                "prospect_role": row.role or "",
                "tone": job.tone,
                "goal": job.goal,
                "value_proposition": job.value_proposition,
                "custom_instructions": "",
                "enable_web_research": False, # Faster batch processing
                "enable_rag": True,
                "research_summary": "",
                "rag_context": [],
                "prospect_insights": {},
                "subject_lines": [],
                "selected_subject": "",
                "email_body": "",
                "followup_1": "",
                "followup_2": "",
                "anti_ai_score": 0,
                "critic_notes": {},
                "iteration_count": 0,
                "is_approved": False,
                "error": None
            }

            final_state = await outreach_graph.ainvoke(state_input)
            row.generated_subject = final_state.get("selected_subject", "")
            row.generated_email = final_state.get("email_body", "")
            row.generated_followup_1 = final_state.get("followup_1", "")
            row.generated_followup_2 = final_state.get("followup_2", "")
            row.anti_ai_score = final_state.get("anti_ai_score", 95)
            row.status = "completed"
            job.completed_rows += 1
        except Exception as e:
            row.status = "failed"
            row.error_message = str(e)
            job.failed_rows += 1

        # Periodic update
        await save_item("batch_jobs", job_id, job.dict())

    job.status = "completed"
    await save_item("batch_jobs", job_id, job.dict())

@router.post("/upload", response_model=BatchJob)
async def upload_batch_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tone: str = Form("Casual & Direct"),
    goal: str = Form("Book a 15-min discovery call"),
    value_proposition: str = Form(""),
    current_user: UserResponse = Depends(get_current_user)
):
    """Uploads a CSV file of prospects and starts background personalization."""
    if not file.filename.endswith(('.csv', '.CSV')):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="ignore")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty")

    # Normalize column names
    col_map = {str(c).lower().strip(): c for c in df.columns}
    name_col = next((col_map[c] for c in ['name', 'full_name', 'first_name', 'prospect_name', 'contact'] if c in col_map), df.columns[0])
    company_col = next((col_map[c] for c in ['company', 'organization', 'account', 'company_name'] if c in col_map), None)
    role_col = next((col_map[c] for c in ['role', 'title', 'job_title', 'position'] if c in col_map), None)
    profile_col = next((col_map[c] for c in ['profile', 'bio', 'linkedin_bio', 'notes', 'description', 'summary'] if c in col_map), None)
    notes_col = next((col_map[c] for c in ['custom_notes', 'notes', 'extra'] if c in col_map and c != profile_col), None)

    rows = []
    for idx, r in df.iterrows():
        name = str(r[name_col]).strip() if pd.notna(r.get(name_col)) else f"Prospect {idx+1}"
        company = str(r[company_col]).strip() if company_col and pd.notna(r.get(company_col)) else ""
        role = str(r[role_col]).strip() if role_col and pd.notna(r.get(role_col)) else ""
        profile = str(r[profile_col]).strip() if profile_col and pd.notna(r.get(profile_col)) else f"{name} - {role} at {company}"
        notes = str(r[notes_col]).strip() if notes_col and pd.notna(r.get(notes_col)) else ""

        rows.append(BatchProspectRow(
            row_index=idx,
            name=name,
            company=company,
            role=role,
            profile=profile,
            custom_notes=notes,
            status="pending"
        ))

    job_id = f"batch-{uuid.uuid4().hex[:8]}"
    job = BatchJob(
        id=job_id,
        user_id=current_user.id,
        filename=file.filename,
        total_rows=len(rows),
        tone=tone,
        goal=goal,
        value_proposition=value_proposition,
        rows=rows
    )

    await save_item("batch_jobs", job_id, job.dict())
    
    # Launch processing in background
    background_tasks.add_task(process_batch_job_in_background, job_id)

    return job

@router.get("/status/{job_id}", response_model=BatchJob)
async def get_batch_status(job_id: str):
    job_data = await get_item("batch_jobs", job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Batch job not found")
    return BatchJob(**job_data)

@router.get("/download/{job_id}")
async def download_enriched_csv(job_id: str):
    job_data = await get_item("batch_jobs", job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Batch job not found")

    job = BatchJob(**job_data)
    
    # Generate CSV in-memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Name", "Company", "Role", "Profile_Notes",
        "Generated_Subject", "Generated_Email", "Generated_Followup_1", "Generated_Followup_2",
        "Anti_AI_Score", "Status"
    ])

    for row in job.rows:
        writer.writerow([
            row.name,
            row.company,
            row.role,
            row.profile,
            row.generated_subject or "",
            row.generated_email or "",
            row.generated_followup_1 or "",
            row.generated_followup_2 or "",
            row.anti_ai_score or 0,
            row.status
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename=enriched_outreach_{job.id}.csv"
    return response

@router.get("/sample-template")
async def get_sample_csv_template():
    sample_csv = """Name,Company,Role,Profile,Custom_Notes
Sarah Connor,Cyberdyne Dynamics,VP of Engineering,"Leading infrastructure scaling from 10k to 500k RPS. Tech stack: Go, Kubernetes, Kafka.","Interested in reliability automation"
David Miller,Apex Growth Partners,Head of Outbound,"Overseeing SDR team of 15 reps. Focus on enterprise pipeline generation and CRM hygiene.","Looking for higher conversion hooks"
Elena Rostova,FinTech Horizon,Chief Product Officer,"Building developer-first payment APIs and fraud prevention systems. Spoke at Fintech2025.","Recently expanded to EU market"
"""
    return PlainTextResponse(
        content=sample_csv,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cold_outreach_prospects_template.csv"}
    )
