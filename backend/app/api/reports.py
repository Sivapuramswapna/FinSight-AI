from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.report import ReportSummaryResponse
from app.services.report_service import (
    generate_monthly_report,
    export_transactions_csv,
    generate_statement_html
)

router = APIRouter(tags=["Reports & Exports"])


@router.get("/monthly", response_model=ReportSummaryResponse)
def get_monthly_report(
    year: Optional[int] = Query(None, description="Report year, e.g. 2026"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Report month 1-12"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a structured monthly financial intelligence report with
    income, expense shares, budget compliance, and AI executive summaries.
    """
    return generate_monthly_report(db=db, user_id=current_user.id, year=year, month=month)


@router.get("/export/csv")
def download_transactions_csv(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exports user transactions into a downloadable RFC 4180 CSV file."""
    csv_data = export_transactions_csv(db=db, user_id=current_user.id, year=year, month=month)
    filename = f"finsight_transactions_{year or 'all'}_{month or 'all'}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/export/statement", response_class=HTMLResponse)
def print_statement_pdf_view(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a high-resolution, print-ready HTML financial statement
    that can be saved directly as PDF via the browser.
    """
    return generate_statement_html(db=db, user_id=current_user.id, year=year, month=month)
