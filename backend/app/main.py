from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.teams import router as teams_router
from app.api.work_items import router as work_items_router
from app.api.activities import router as activities_router
from app.api.comments import router as comments_router
from app.api.approvals import router as approvals_router

app = FastAPI(
    title="Newtonite Operations API",
    description="Backend for the Newtonite Operations Under Pressure challenge.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(teams_router)
app.include_router(work_items_router)
app.include_router(comments_router)
app.include_router(activities_router)
app.include_router(approvals_router)


@app.get("/")
def root():
    return {
        "message": "Newtonite Operations API is running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "newtonite-backend",
    }
