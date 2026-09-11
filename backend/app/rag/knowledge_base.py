import math
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from app.db.mongodb import save_item, find_items, delete_item
from app.db.models import KnowledgeDoc

# Default seeded knowledge items so users have instant rich context
DEFAULT_KNOWLEDGE = [
    {
        "id": "kb-seed-1",
        "title": "B2B SaaS Growth Engine - Case Study",
        "category": "case_study",
        "content": "Helped Acme Analytics reduce sales cycle from 42 days to 18 days and boosted demo-to-close rate by 34% by automating prospect intelligence research before every SDR call.",
        "tags": ["saas", "case_study", "sales_cycle", "roi"]
    },
    {
        "id": "kb-seed-2",
        "title": "Core Value Proposition - Anti-AI Cold Outreach",
        "category": "value_prop",
        "content": "We replace robotic, templated cold emails with hyper-specific 3-sentence hooks that mention the prospect's actual tech stack, hiring announcements, and current challenges. Result: 4.8x higher reply rates.",
        "tags": ["value_prop", "cold_email", "reply_rate", "personalization"]
    },
    {
        "id": "kb-seed-3",
        "title": "Winning Cold Email Template (Founder to Founder)",
        "category": "winning_template",
        "content": "Subject: quick question regarding {{company}}'s recent launch\n\nHey {{first_name}},\n\nSaw your recent update on scaling {{initiative}}. Most founders I talk to at this stage hit a bottleneck with outbound conversion.\n\nWe built a lightweight workflow that doubled replies for team X without hiring more SDRs.\n\nOpen to taking a peek at a 2-min loom breakdown?",
        "tags": ["template", "founder", "short", "loom"]
    }
]

class SimpleVectorEngine:
    """Lightweight vector and keyword similarity engine for zero-dependency high speed RAG."""
    def __init__(self):
        self._docs: List[Dict[str, Any]] = []
        self._initialized = False

    async def init_defaults(self):
        if self._initialized:
            return
        existing = await find_items("knowledge_docs", limit=100)
        if not existing:
            for doc in DEFAULT_KNOWLEDGE:
                await save_item("knowledge_docs", doc["id"], {**doc, "created_at": datetime.utcnow().isoformat()})
        self._initialized = True

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text)]

    def _calculate_bm25_score(self, query_tokens: List[str], doc_tokens: List[str]) -> float:
        score = 0.0
        doc_len = len(doc_tokens)
        if doc_len == 0:
            return 0.0
        
        for q in query_tokens:
            count = doc_tokens.count(q)
            if count > 0:
                # Term frequency weighted
                tf = count / (count + 1.2 * (0.25 + 0.75 * (doc_len / 50.0)))
                score += tf * 2.0
                
        # Tag bonus
        return score

    async def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        await self.init_defaults()
        all_docs = await find_items("knowledge_docs", limit=100)
        if not all_docs:
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return all_docs[:top_k]

        scored_docs = []
        for doc in all_docs:
            text = f"{doc.get('title', '')} {doc.get('content', '')} {' '.join(doc.get('tags', []))}"
            doc_tokens = self._tokenize(text)
            score = self._calculate_bm25_score(q_tokens, doc_tokens)
            if score > 0.01:
                scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        results = [doc for score, doc in scored_docs[:top_k]]
        
        # If no specific match, return top relevant docs
        if not results and all_docs:
            return all_docs[:top_k]
        return results

    async def add_doc(self, title: str, category: str, content: str, tags: List[str] = None) -> Dict[str, Any]:
        doc_id = f"kb-{uuid.uuid4().hex[:8]}"
        doc = {
            "id": doc_id,
            "title": title,
            "category": category,
            "content": content,
            "tags": tags or [],
            "created_at": datetime.utcnow().isoformat()
        }
        await save_item("knowledge_docs", doc_id, doc)
        return doc

    async def delete_doc(self, doc_id: str) -> bool:
        return await delete_item("knowledge_docs", doc_id)

rag_engine = SimpleVectorEngine()
