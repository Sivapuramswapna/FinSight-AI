from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount, must be greater than 0")
    type: str = Field(..., description="'income' or 'expense'")
    category: str = Field(..., min_length=1, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    date: str = Field(..., description="Transaction date in YYYY-MM-DD format")
    payment_method: Optional[str] = Field(None, max_length=100)
    merchant: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    payment_method: Optional[str] = None
    merchant: Optional[str] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    is_anomaly: bool
    anomaly_score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    size: int
    pages: int


class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366F1"
    is_default: bool

    class Config:
        from_attributes = True
