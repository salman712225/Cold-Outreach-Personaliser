import app  # Triggers pure-python bootstrap
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db_manager
from app.rag.knowledge_base import rag_engine
from app.api.auth import router as auth_router
from app.api.outreach import router as outreach_router
from app.api.batch import router as batch_router
from app.api.rag import router as rag_router
from app.api.evaluation import router as eval_router
from app.api.history import router as history_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cold_outreach.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Cold Outreach Personaliser Backend...")
    await connect_to_mongo()
    await rag_engine.init_defaults()
    logger.info("Cold Outreach Personaliser Backend Ready.")
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Cold Outreach Personaliser API",
    description="Multi-Agent Anti-AI Cold Email Generation Engine powered by Claude & LangGraph",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(outreach_router)
app.include_router(batch_router)
app.include_router(rag_router)
app.include_router(eval_router)
app.include_router(history_router)

@app.get("/")
async def root():
    return {
        "message": "Cold Outreach Personaliser API is running",
        "tagline": "Paste a profile, get an email that does not sound AI-generated.",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model": settings.ANTHROPIC_MODEL,
        "anthropic_configured": bool(settings.ANTHROPIC_API_KEY and not settings.ANTHROPIC_API_KEY.startswith("your_")),
        "langsmith_tracing": settings.LANGCHAIN_TRACING_V2 == "true",
        "langsmith_project": settings.LANGCHAIN_PROJECT,
        "database": "mongodb_connected" if db_manager.is_connected else "in_memory_fallback_active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
