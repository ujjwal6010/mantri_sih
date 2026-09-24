"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.projects import router as projects_router
from app.api.risk import router as risk_router
from app.api.audit import router as audit_router
from app.api.v3 import router as v3_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(projects_router, prefix="/projects", tags=["Projects"])
app.include_router(risk_router, tags=["Risk & Overview"])
app.include_router(audit_router, tags=["Audit & Evidence"])
app.include_router(v3_router, tags=["V3 Intelligence"])

@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "message": "AI Flags. AI Explains. Humans Verify.",
    }
