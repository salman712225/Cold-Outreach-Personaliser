from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.eval.langsmith_eval import run_langsmith_evaluation_suite
from app.db.models import UserResponse
from app.api.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])

@router.post("/run-suite")
async def run_evaluation_suite(current_user: UserResponse = Depends(get_current_user)) -> Dict[str, Any]:
    """Runs the LangSmith Evaluation Suite across benchmark prospect profiles."""
    results = await run_langsmith_evaluation_suite()
    return results

@router.get("/status")
async def get_eval_status():
    """Returns the current LangSmith integration status and active project settings."""
    has_api_key = bool(settings.LANGCHAIN_API_KEY and not settings.LANGCHAIN_API_KEY.startswith("your_"))
    return {
        "langsmith_tracing": settings.LANGCHAIN_TRACING_V2 == "true",
        "has_api_key": has_api_key,
        "project": settings.LANGCHAIN_PROJECT,
        "endpoint": settings.LANGCHAIN_ENDPOINT,
        "model": settings.ANTHROPIC_MODEL
    }
