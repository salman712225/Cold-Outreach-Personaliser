import asyncio
import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from app.agents.state import OutreachState
from app.agents.tools import search_company_or_prospect, extract_profile_details
from app.agents.copywriter import generate_cold_outreach_claude
from app.agents.critic import evaluate_cold_email
from app.rag.knowledge_base import rag_engine

logger = logging.getLogger("cold_outreach.graph")

async def supervisor_research_node(state: OutreachState) -> Dict[str, Any]:
    """Extracts profile metadata and executes live web search if requested."""
    profile_text = state.get("profile_text", "")
    extracted = extract_profile_details(profile_text)
    
    name = state.get("prospect_name") or extracted.get("name", "")
    role = state.get("prospect_role") or extracted.get("role", "")
    company = state.get("prospect_company") or extracted.get("company", "")
    
    research_summary = ""
    if state.get("enable_web_research", True) and (company or name):
        query = f"{company} {name} news announcements funding" if company else f"{name} {role}"
        # Run search in background thread
        loop = asyncio.get_event_loop()
        research_summary = await loop.run_in_executor(None, search_company_or_prospect, query)

    return {
        "prospect_name": name,
        "prospect_role": role,
        "prospect_company": company,
        "research_summary": research_summary,
        "prospect_insights": extracted
    }

async def rag_agent_node(state: OutreachState) -> Dict[str, Any]:
    """Retrieves relevant company value props, case studies, and winning email templates."""
    rag_context = []
    if state.get("enable_rag", True):
        query = f"{state.get('goal', '')} {state.get('value_proposition', '')} {state.get('prospect_company', '')}"
        docs = await rag_engine.search(query, top_k=2)
        rag_context = [f"[{d.get('title')}]: {d.get('content')}" for d in docs]

    return {
        "rag_context": rag_context
    }

async def copywriter_agent_node(state: OutreachState) -> Dict[str, Any]:
    """Generates the Anti-AI cold email and follow-up sequence with Mistral AI / dynamic engine."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        generate_cold_outreach_claude,
        state.get("prospect_name", ""),
        state.get("prospect_company", ""),
        state.get("prospect_role", ""),
        state.get("profile_text", ""),
        state.get("tone", "Casual & Direct"),
        state.get("goal", "Book a 15-min discovery call"),
        state.get("value_proposition", ""),
        state.get("research_summary", ""),
        state.get("rag_context", []),
        state.get("custom_instructions", ""),
        state.get("sender_name", ""),
        state.get("sender_role", ""),
        state.get("sender_company", ""),
        state.get("recipient_name", "") or state.get("prospect_name", ""),
        state.get("recipient_company", "") or state.get("prospect_company", ""),
        state.get("recipient_role", "") or state.get("prospect_role", ""),
        state.get("variation_count", 1)
    )

    return {
        "subject_lines": result.get("subject_lines", []),
        "selected_subject": result.get("selected_subject", ""),
        "email_body": result.get("email_body", ""),
        "followup_1": result.get("followup_1", ""),
        "followup_2": result.get("followup_2", "")
    }

async def critic_evaluator_node(state: OutreachState) -> Dict[str, Any]:
    """Scans for AI clichés, spam words, readability and generates Anti-AI Score."""
    email_body = state.get("email_body", "")
    selected_subject = state.get("selected_subject", "")
    name = state.get("prospect_name", "")
    company = state.get("prospect_company", "")

    eval_result = evaluate_cold_email(email_body, selected_subject, name, company)

    return {
        "anti_ai_score": eval_result.get("anti_ai_score", 95),
        "critic_notes": eval_result,
        "is_approved": eval_result.get("anti_ai_score", 95) >= 80,
        "iteration_count": state.get("iteration_count", 0) + 1
    }

# Build and compile LangGraph
def create_outreach_graph():
    workflow = StateGraph(OutreachState)

    workflow.add_node("supervisor_research", supervisor_research_node)
    workflow.add_node("rag_agent", rag_agent_node)
    workflow.add_node("copywriter_agent", copywriter_agent_node)
    workflow.add_node("critic_evaluator", critic_evaluator_node)

    workflow.set_entry_point("supervisor_research")
    workflow.add_edge("supervisor_research", "rag_agent")
    workflow.add_edge("rag_agent", "copywriter_agent")
    workflow.add_edge("copywriter_agent", "critic_evaluator")
    workflow.add_edge("critic_evaluator", END)

    return workflow.compile()

outreach_graph = create_outreach_graph()
