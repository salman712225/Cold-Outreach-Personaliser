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
    description="Multi-Agent Anti-AI Cold Email Generation Engine powered by Mistral AI & LangGraph",
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

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Determine frontend dist directory
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "static"))

def get_dist_path():
    if os.path.isdir(FRONTEND_DIST):
        return FRONTEND_DIST
    if os.path.isdir(STATIC_DIR):
        return STATIC_DIR
    return None

# Mount assets if available at startup
initial_dist = get_dist_path()
if initial_dist:
    assets_dir = os.path.join(initial_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_spa_or_static(full_path: str):
    # Pass through API and docs endpoints
    if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    
    current_dist = get_dist_path()
    if current_dist:
        candidate = os.path.join(current_dist, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        index_file = os.path.join(current_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
    
    return {
        "message": "Cold Outreach Personaliser API is running",
        "tagline": "Paste a profile, get an email that does not sound AI-generated.",
        "docs": "/docs",
        "status": "Frontend not built yet. Run 'npm run build' in frontend/ to serve the UI here."
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model": settings.MISTRAL_MODEL,
        "mistral_configured": bool(settings.MISTRAL_API_KEY and not settings.MISTRAL_API_KEY.startswith("your_")),
        "langsmith_tracing": settings.LANGCHAIN_TRACING_V2 == "true",
        "langsmith_project": settings.LANGCHAIN_PROJECT,
        "database": "mongodb_connected" if db_manager.is_connected else "in_memory_fallback_active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

