from typing import List, Optional
from pydantic import BaseModel


class AnomalyItem(BaseModel):
    id: int
    amount: float
    type: str
    category: str
    description: str
    date: str
    merchant: Optional[str] = None
    payment_method: Optional[str] = None
    anomaly_score: float
    severity: str  # 'High Risk' | 'Moderate Risk' | 'Low Risk'
    ai_reason: str
    is_anomaly: bool


class AnomalySummary(BaseModel):
    total_anomalies: int
    high_risk_count: int
    moderate_risk_count: int
    flagged_amount: float
    surveillance_status: str  # 'Active • Isolation Forest (100 Trees)'
    model_contamination: float


class AnomalyResponse(BaseModel):
    summary: AnomalySummary
    anomalies: List[AnomalyItem]
