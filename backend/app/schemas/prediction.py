from typing import List, Optional
from pydantic import BaseModel


class ConfidenceInterval(BaseModel):
    lower: float
    upper: float


class CategoryPrediction(BaseModel):
    category: str
    predicted_amount: float
    historical_avg: float
    change_percent: float
    percentage_of_total: float
    risk_level: str  # 'High' | 'Moderate' | 'Stable'
    color: str


class ForecastDataPoint(BaseModel):
    period: str
    actual: Optional[float] = None
    predicted: Optional[float] = None
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None


class ModelMetadata(BaseModel):
    model_name: str
    algorithm: str
    samples_trained: int
    confidence_score: float
    last_trained: str


class PredictionResponse(BaseModel):
    predicted_total_expense: float
    current_month_expense: float
    predicted_change_percent: float
    trend_direction: str  # 'increasing' | 'decreasing' | 'stable'
    confidence_interval: ConfidenceInterval
    category_predictions: List[CategoryPrediction]
    forecast_timeline: List[ForecastDataPoint]
    model_metadata: ModelMetadata
