import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.db.models import ProspectInput, SingleEmailResult, CriticEvaluation, UserResponse
from app.api.auth import get_current_user
from app.agents.graph import outreach_graph
from app.db.mongodb import save_item

router = APIRouter(prefix="/api/outreach", tags=["outreach"])

@router.post("/generate", response_model=SingleEmailResult)
async def generate_outreach(
    input_data: ProspectInput,
    current_user: UserResponse = Depends(get_current_user)
):
    """Executes the multi-agent LangGraph workflow to generate an anti-AI cold email and follow-up sequence."""
    try:
        initial_state = {
            "sender_name": input_data.sender_name or "",
            "sender_role": input_data.sender_role or "",
            "sender_company": input_data.sender_company or "",
            "recipient_name": input_data.recipient_name or input_data.prospect_name or "",
            "recipient_company": input_data.recipient_company or input_data.prospect_company or "",
            "recipient_role": input_data.recipient_role or input_data.prospect_role or "",
            "profile_text": input_data.profile_text,
            "prospect_name": input_data.recipient_name or input_data.prospect_name or "",
            "prospect_company": input_data.recipient_company or input_data.prospect_company or "",
            "prospect_role": input_data.recipient_role or input_data.prospect_role or "",
            "tone": input_data.tone,
            "goal": input_data.goal,
            "value_proposition": input_data.value_proposition or "",
            "custom_instructions": input_data.custom_instructions or "",
            "variation_count": input_data.variation_count or 1,
            "enable_web_research": input_data.enable_web_research,
            "enable_rag": input_data.enable_rag,
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

        # Run through multi-agent graph
        final_state = await outreach_graph.ainvoke(initial_state)

        result_id = f"email-{uuid.uuid4().hex[:8]}"
        critic_data = final_state.get("critic_notes", {})
        critic_eval = CriticEvaluation(
            anti_ai_score=final_state.get("anti_ai_score", 95),
            ai_cliches_detected=critic_data.get("ai_cliches_detected", []),
            spam_triggers_detected=critic_data.get("spam_triggers_detected", []),
            reading_grade_level=critic_data.get("reading_grade_level", "6th - 8th grade"),
            strengths=critic_data.get("strengths", []),
            improvements_made=critic_data.get("improvements_made", [])
        )

        result = SingleEmailResult(
            id=result_id,
            user_id=current_user.id,
            created_at=datetime.utcnow(),
            sender_name=input_data.sender_name or "",
            sender_role=input_data.sender_role or "",
            sender_company=input_data.sender_company or "",
            recipient_name=final_state.get("recipient_name") or input_data.recipient_name or input_data.prospect_name or "",
            recipient_company=final_state.get("recipient_company") or input_data.recipient_company or input_data.prospect_company or "",
            recipient_role=final_state.get("recipient_role") or input_data.recipient_role or input_data.prospect_role or "",
            prospect_name=final_state.get("prospect_name", input_data.prospect_name or ""),
            prospect_company=final_state.get("prospect_company", input_data.prospect_company or ""),
            prospect_role=final_state.get("prospect_role", input_data.prospect_role or ""),
            subject_lines=final_state.get("subject_lines", []),
            selected_subject=final_state.get("selected_subject", ""),
            email_body=final_state.get("email_body", ""),
            followup_1=final_state.get("followup_1", ""),
            followup_2=final_state.get("followup_2", ""),
            anti_ai_score=final_state.get("anti_ai_score", 95),
            critic_evaluation=critic_eval,
            research_summary=final_state.get("research_summary"),
            rag_context_used=final_state.get("rag_context"),
            tone=input_data.tone,
            goal=input_data.goal
        )

        # Save to database/history
        await save_item("history", result_id, result.dict())

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating outreach: {str(e)}")
