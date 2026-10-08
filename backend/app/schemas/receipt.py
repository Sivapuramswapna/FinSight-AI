from typing import List, Optional
from pydantic import BaseModel


class ReceiptItem(BaseModel):
    description: str
    amount: float


class ReceiptScanResponse(BaseModel):
    merchant: str
    date: str
    total_amount: float
    tax_amount: Optional[float] = None
    category: str
    confidence: float
    line_items: List[ReceiptItem] = []
    raw_text: str
    ocr_engine: str
