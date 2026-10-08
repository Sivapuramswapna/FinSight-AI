from typing import List, Optional
from pydantic import BaseModel


class CategorizeRequest(BaseModel):
    description: str
    amount: Optional[float] = None
    merchant: Optional[str] = None
    type: Optional[str] = None  # 'income' or 'expense'


class CategoryCandidate(BaseModel):
    category: str
    confidence: float
    explanation: str


class CategorizeResponse(BaseModel):
    predicted_category: str
    confidence: float
    is_high_confidence: bool
    explanation: str
    candidates: List[CategoryCandidate]
    model_used: str
