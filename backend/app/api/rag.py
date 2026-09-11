from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.db.models import KnowledgeDoc, UserResponse
from app.api.auth import get_current_user
from app.rag.knowledge_base import rag_engine
from app.db.mongodb import find_items

router = APIRouter(prefix="/api/rag", tags=["rag"])

class KnowledgeDocCreate(BaseModel):
    title: str
    category: str # "company_offer", "case_study", "winning_template", "value_prop"
    content: str
    tags: List[str] = []

@router.get("/docs", response_model=List[KnowledgeDoc])
async def list_knowledge_docs(current_user: UserResponse = Depends(get_current_user)):
    await rag_engine.init_defaults()
    docs = await find_items("knowledge_docs", limit=100)
    return [
        KnowledgeDoc(
            id=d.get("id", str(d.get("_id"))),
            user_id=d.get("user_id", "default"),
            title=d.get("title", ""),
            category=d.get("category", "value_prop"),
            content=d.get("content", ""),
            tags=d.get("tags", [])
        )
        for d in docs
    ]

@router.post("/docs", response_model=KnowledgeDoc)
async def create_knowledge_doc(
    doc_in: KnowledgeDocCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    doc = await rag_engine.add_doc(
        title=doc_in.title,
        category=doc_in.category,
        content=doc_in.content,
        tags=doc_in.tags
    )
    return KnowledgeDoc(**doc)

@router.delete("/docs/{doc_id}")
async def delete_knowledge_doc(
    doc_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    success = await rag_engine.delete_doc(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge doc not found")
    return {"status": "success", "message": f"Document {doc_id} deleted"}

@router.get("/search")
async def test_search(query: str):
    results = await rag_engine.search(query, top_k=3)
    return {"query": query, "results": results}
