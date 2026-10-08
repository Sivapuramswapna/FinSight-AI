from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.receipt import ReceiptScanResponse
from app.services.ocr_service import process_receipt_document

router = APIRouter(tags=["Receipt OCR Scanner"])


@router.post("/scan", response_model=ReceiptScanResponse)
@router.post("", response_model=ReceiptScanResponse)
async def scan_receipt(
    file: Optional[UploadFile] = File(None),
    sample_type: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scans a receipt image or processes a structured invoice document,
    extracting merchant, date, total amount, sales tax, line items,
    and automatically classifying the financial category via AI.
    """
    file_bytes = None
    filename = None
    if file:
        file_bytes = await file.read()
        filename = file.filename

    return process_receipt_document(
        db=db,
        user_id=current_user.id,
        file_bytes=file_bytes,
        filename=filename,
        sample_type=sample_type,
        raw_text_override=raw_text
    )
