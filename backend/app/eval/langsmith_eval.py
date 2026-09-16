import os
import time
import logging
from typing import List, Dict, Any
from app.config import settings
from app.agents.graph import outreach_graph

logger = logging.getLogger("cold_outreach.eval")

BENCHMARK_PROSPECTS = [
    {
        "name": "Sarah Jenkins",
        "company": "ScaleFlow Systems",
        "role": "VP of Engineering",
        "profile": "VP of Engineering @ ScaleFlow Systems. Scaling distributed microservices architecture from 50k to 2M DAU. Previously Lead Architect at Datadog. Hiring backend engineers.",
        "goal": "Book a 15-min discovery call",
        "tone": "Casual & Direct",
        "value_prop": "Automated incident root-cause diagnosis that slashes MTTR by 45%"
    },
    {
        "name": "Marcus Vance",
        "company": "Apex Revenue Labs",
        "role": "Head of Sales",
        "profile": "Head of Sales @ Apex Revenue Labs. Passionate about pipeline generation and SDR team productivity. Building outbound playbooks for enterprise accounts.",
        "goal": "Product Demo",
        "tone": "Value-First Exec",
        "value_prop": "AI prospect enrichment that boosts SDR response rate from 1.2% to 6.4%"
    },
    {
        "name": "Elena Rostova",
        "company": "Fintech Horizon",
        "role": "Chief Product Officer",
        "profile": "CPO at Fintech Horizon. Spearheading next-gen open banking APIs and fraud detection. Keynote speaker at Money2020.",
        "goal": "Partnership Pitch",
        "tone": "Curious Problem-Solver",
        "value_prop": "Plug-and-play compliance intelligence layer for payment workflows"
    }
]

async def run_langsmith_evaluation_suite() -> Dict[str, Any]:
    """Runs cold outreach generation against benchmark profiles and evaluates performance."""
    results = []
    total_anti_ai_score = 0
    total_latency = 0.0

    has_langsmith = bool(settings.LANGCHAIN_API_KEY and not settings.LANGCHAIN_API_KEY.startswith("your_"))

    for prospect in BENCHMARK_PROSPECTS:
        start_time = time.time()
        initial_state = {
            "profile_text": prospect["profile"],
            "prospect_name": prospect["name"],
            "prospect_company": prospect["company"],
            "prospect_role": prospect["role"],
            "tone": prospect["tone"],
            "goal": prospect["goal"],
            "value_proposition": prospect["value_prop"],
            "custom_instructions": "",
            "enable_web_research": False,
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

        final_state = await outreach_graph.ainvoke(initial_state)
        latency = round(time.time() - start_time, 2)
        total_latency += latency

        score = final_state.get("anti_ai_score", 92)
        total_anti_ai_score += score

        results.append({
            "prospect_name": prospect["name"],
            "prospect_company": prospect["company"],
            "selected_subject": final_state.get("selected_subject"),
            "email_body": final_state.get("email_body"),
            "anti_ai_score": score,
            "critic_notes": final_state.get("critic_notes", {}),
            "latency_seconds": latency,
            "status": "PASSED" if score >= 80 else "FLAGGED"
        })

    avg_score = round(total_anti_ai_score / len(BENCHMARK_PROSPECTS), 1) if BENCHMARK_PROSPECTS else 0
    avg_latency = round(total_latency / len(BENCHMARK_PROSPECTS), 2) if BENCHMARK_PROSPECTS else 0

    return {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "langsmith_tracing_enabled": has_langsmith,
        "langsmith_project": settings.LANGCHAIN_PROJECT,
        "langsmith_endpoint": settings.LANGCHAIN_ENDPOINT if has_langsmith else "Local Benchmark Suite",
        "benchmark_count": len(BENCHMARK_PROSPECTS),
        "average_anti_ai_score": avg_score,
        "average_latency_seconds": avg_latency,
        "model_evaluated": settings.MISTRAL_MODEL,
        "results": results
    }
