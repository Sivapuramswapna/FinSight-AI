from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.init_db import init_db
from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router
from app.api.analytics import router as analytics_router
from app.api.predictions import router as predictions_router
from app.api.anomalies import router as anomalies_router
from app.api.categorization import router as categorization_router
from app.api.chat import router as chat_router
from app.api.receipts import router as receipts_router
from app.api.budgets import router as budgets_router
from app.api.goals import router as goals_router
from app.api.reports import router as reports_router
from app.api.notifications import router as notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and default seed data is ready
    init_db()
    yield


app = FastAPI(
    title="FinSight-AI API",
    description="Production Financial Intelligence and Analytics Platform API",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/auth")
app.include_router(auth_router, prefix="/api/auth")
app.include_router(transactions_router, prefix="/transactions")
app.include_router(transactions_router, prefix="/api/transactions")
app.include_router(analytics_router, prefix="/analytics")
app.include_router(analytics_router, prefix="/api/analytics")
app.include_router(predictions_router, prefix="/predictions")
app.include_router(predictions_router, prefix="/api/predictions")
app.include_router(anomalies_router, prefix="/anomalies")
app.include_router(anomalies_router, prefix="/api/anomalies")
app.include_router(categorization_router, prefix="/ai")
app.include_router(categorization_router, prefix="/api/ai")
app.include_router(chat_router, prefix="/chat")
app.include_router(chat_router, prefix="/api/chat")
app.include_router(chat_router, prefix="/ai/chat")
app.include_router(receipts_router, prefix="/receipts")
app.include_router(receipts_router, prefix="/api/receipts")
app.include_router(budgets_router, prefix="/budgets")
app.include_router(budgets_router, prefix="/api/budgets")
app.include_router(goals_router, prefix="/goals")
app.include_router(goals_router, prefix="/api/goals")
app.include_router(reports_router, prefix="/reports")
app.include_router(reports_router, prefix="/api/reports")
app.include_router(notifications_router, prefix="/notifications")
app.include_router(notifications_router, prefix="/api/notifications")


@app.get("/")
def read_root():
    return {
        "message": "Welcome to FinSight-AI API",
        "status": "online",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FinSight-AI Backend",
        "database": "connected"
    }
