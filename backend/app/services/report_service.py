import io
import csv
import json
from datetime import datetime
from collections import defaultdict
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.models import Transaction, Budget, User, FinancialReport
from app.schemas.report import (
    CategoryShare,
    MerchantSpend,
    BudgetComplianceItem,
    ReportSummaryResponse
)


def get_report_period(db: Session, user_id: int, year: Optional[int], month: Optional[int]) -> tuple[int, int]:
    if year and month:
        return year, month

    latest_tx = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc()).first()

    if latest_tx and latest_tx.date and len(latest_tx.date) >= 7:
        try:
            parts = latest_tx.date[:7].split('-')
            return int(parts[0]), int(parts[1])
        except Exception:
            pass

    now = datetime.utcnow()
    return now.year, now.month


def generate_monthly_report(
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> ReportSummaryResponse:
    target_year, target_month = get_report_period(db, user_id, year, month)
    period_prefix = f"{target_year}-{target_month:02d}"
    dt_period_name = datetime.strptime(period_prefix, "%Y-%m").strftime("%B %Y")

    # Fetch period transactions
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date.startswith(period_prefix)
    ).order_by(Transaction.date.asc()).all()

    total_income = 0.0
    total_expenses = 0.0
    category_totals = defaultdict(float)
    merchant_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})

    for tx in transactions:
        amt = float(tx.amount)
        if tx.type == 'income':
            total_income += amt
        else:
            total_expenses += amt
            category_totals[tx.category] += amt
            if tx.merchant:
                m = tx.merchant.strip()
                merchant_totals[m]["amount"] += amt
                merchant_totals[m]["count"] += 1

    net_savings = round(total_income - total_expenses, 2)
    savings_rate = round((net_savings / total_income * 100.0) if total_income > 0 else 0.0, 1)

    # Category breakdown
    category_breakdown: List[CategoryShare] = []
    for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        pct = round((amt / total_expenses * 100.0) if total_expenses > 0 else 0.0, 1)
        category_breakdown.append(CategoryShare(
            category=cat,
            amount=round(amt, 2),
            percentage=pct
        ))

    # Top merchants
    top_merchants: List[MerchantSpend] = []
    for m, data in sorted(merchant_totals.items(), key=lambda x: x[1]["amount"], reverse=True)[:5]:
        top_merchants.append(MerchantSpend(
            merchant=m,
            amount=round(data["amount"], 2),
            transaction_count=data["count"]
        ))

    # Budget compliance
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.year == target_year,
        Budget.month == target_month
    ).all()

    budget_compliance: List[BudgetComplianceItem] = []
    for b in budgets:
        spent = category_totals.get(b.category, 0.0)
        limit = float(b.monthly_limit)
        pct = (spent / limit * 100.0) if limit > 0 else 0.0
        status = "Exceeded" if pct >= 100.0 else "Warning" if pct >= (b.alert_threshold or 80.0) else "Safe"
        budget_compliance.append(BudgetComplianceItem(
            category=b.category,
            limit=limit,
            spent=round(spent, 2),
            status=status
        ))

    # Executive Summary & AI Recommendations
    top_cat_str = category_breakdown[0].category if category_breakdown else "Operating Expenses"
    top_cat_amt = category_breakdown[0].amount if category_breakdown else 0.0

    exec_summary = (
        f"For {dt_period_name}, total cash inflow stood at ${total_income:,.2f} against ${total_expenses:,.2f} in operating expenses, "
        f"yielding a robust net surplus of +${net_savings:,.2f} and an exceptional savings rate of {savings_rate}%. "
        f"Primary expenditure was concentrated in {top_cat_str} (${top_cat_amt:,.2f}), representing "
        f"{(top_cat_amt / total_expenses * 100.0) if total_expenses > 0 else 0:.1f}% of monthly outflow."
    )

    recs = [
        f"Maintain current discretionary spending velocity in {top_cat_str} to preserve capital accumulation.",
        f"Deploy excess monthly surplus (+${net_savings:,.2f}) into high-yield liquidity reserves or active savings goals.",
        f"Review category caps for categories near threshold limits to prevent end-of-month budget overruns."
    ]

    # Save / Update FinancialReport in DB
    existing_rep = db.query(FinancialReport).filter(
        FinancialReport.user_id == user_id,
        FinancialReport.year == target_year,
        FinancialReport.month == target_month
    ).first()

    report_payload = {
        "period": dt_period_name,
        "executive_summary": exec_summary,
        "recommendations": recs
    }

    if existing_rep:
        existing_rep.total_income = total_income
        existing_rep.total_expenses = total_expenses
        existing_rep.net_savings = net_savings
        existing_rep.report_data = json.dumps(report_payload)
    else:
        new_rep = FinancialReport(
            user_id=user_id,
            month=target_month,
            year=target_year,
            total_income=total_income,
            total_expenses=total_expenses,
            net_savings=net_savings,
            report_data=json.dumps(report_payload)
        )
        db.add(new_rep)

    db.commit()

    return ReportSummaryResponse(
        period=dt_period_name,
        year=target_year,
        month=target_month,
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_savings=net_savings,
        savings_rate=savings_rate,
        total_transactions=len(transactions),
        category_breakdown=category_breakdown,
        top_merchants=top_merchants,
        budget_compliance=budget_compliance,
        executive_summary=exec_summary,
        recommendations=recs
    )


def export_transactions_csv(
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> str:
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if year and month:
        query = query.filter(Transaction.date.startswith(f"{year}-{month:02d}"))

    txs = query.order_by(Transaction.date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Transaction ID",
        "Date",
        "Type",
        "Category",
        "Subcategory",
        "Description",
        "Merchant",
        "Amount ($)",
        "Payment Method",
        "Is Anomaly",
        "Notes"
    ])

    for t in txs:
        writer.writerow([
            t.id,
            t.date,
            t.type.upper(),
            t.category,
            t.subcategory or "",
            t.description,
            t.merchant or "",
            f"{t.amount:.2f}",
            t.payment_method or "",
            "YES" if t.is_anomaly else "NO",
            t.notes or ""
        ])

    return output.getvalue()


def generate_statement_html(
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None
) -> str:
    report = generate_monthly_report(db, user_id, year, month)
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.full_name if user else "Account Holder"
    user_email = user.email if user else ""

    period_prefix = f"{report.year}-{report.month:02d}"
    txs = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.date.startswith(period_prefix)
    ).order_by(Transaction.date.asc()).all()

    tx_rows = []
    for t in txs:
        is_inc = t.type == 'income'
        amt_str = f"+${t.amount:,.2f}" if is_inc else f"-${t.amount:,.2f}"
        color_class = "color: #10B981;" if is_inc else "color: #E11D48;"
        tx_rows.append(f"""
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">{t.date}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">{t.description}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">{t.merchant or '-'}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">{t.category}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">{t.payment_method or '-'}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: bold; {color_class}">{amt_str}</td>
            </tr>
        """)

    cat_rows = []
    for c in report.category_breakdown:
        cat_rows.append(f"""
            <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #F1F5F9;">{c.category}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #F1F5F9; text-align: right; font-weight: 600;">${c.amount:,.2f}</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #F1F5F9; text-align: right;">{c.percentage:.1f}%</td>
            </tr>
        """)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FinSight AI - Financial Statement ({report.period})</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1E293B;
            background: #FFFFFF;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #6366F1;
            padding-bottom: 24px;
            margin-bottom: 30px;
        }}
        .logo {{
            font-size: 24px;
            font-weight: 900;
            color: #6366F1;
            letter-spacing: -0.5px;
        }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
        }}
        .kpi-card {{
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 16px;
        }}
        .kpi-title {{
            font-size: 11px;
            text-transform: uppercase;
            color: #64748B;
            font-weight: 700;
            letter-spacing: 0.5px;
        }}
        .kpi-value {{
            font-size: 20px;
            font-weight: 800;
            margin-top: 4px;
        }}
        .summary-box {{
            background: #EEF2FF;
            border: 1px solid #C7D2FE;
            border-radius: 12px;
            padding: 18px 20px;
            margin-bottom: 30px;
            font-size: 13px;
            line-height: 1.6;
            color: #3730A3;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 30px;
        }}
        th {{
            background: #F1F5F9;
            color: #475569;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            border-bottom: 2px solid #CBD5E1;
        }}
        .print-btn {{
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #6366F1;
            color: #FFFFFF;
            padding: 12px 24px;
            font-weight: 700;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
            font-size: 14px;
        }}
        @media print {{
            .print-btn {{ display: none; }}
            body {{ padding: 0; }}
        }}
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>

    <div class="header">
        <div>
            <div class="logo">FinSight AI</div>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">Intelligence Platform Financial Statement</p>
        </div>
        <div style="text-align: right; font-size: 12px; color: #475569;">
            <strong style="font-size: 14px; color: #0F172A;">{user_name}</strong><br>
            {user_email}<br>
            Statement Period: <strong>{report.period}</strong><br>
            Generated: {datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")}
        </div>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-title">Total Inflow</div>
            <div class="kpi-value" style="color: #10B981;">+${report.total_income:,.2f}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Total Outflow</div>
            <div class="kpi-value" style="color: #E11D48;">-${report.total_expenses:,.2f}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Net Cash Surplus</div>
            <div class="kpi-value" style="color: #6366F1;">+${report.net_savings:,.2f}</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-title">Savings Rate</div>
            <div class="kpi-value" style="color: #0F172A;">{report.savings_rate:.1f}%</div>
        </div>
    </div>

    <div class="summary-box">
        <strong>Executive Financial Audit Observation:</strong><br>
        {report.executive_summary}
    </div>

    <h3 style="font-size: 14px; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
        Category Allocations ({report.period})
    </h3>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: right;">Percentage Share</th>
            </tr>
        </thead>
        <tbody>
            {"".join(cat_rows)}
        </tbody>
    </table>

    <h3 style="font-size: 14px; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
        Itemized Transaction Ledger ({report.total_transactions} Records)
    </h3>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th style="text-align: right;">Amount ($)</th>
            </tr>
        </thead>
        <tbody>
            {"".join(tx_rows)}
        </tbody>
    </table>

    <div style="font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px;">
        FinSight AI Platform &bull; End of Certified Financial Statement &bull; Version 1.0.0
    </div>
</body>
</html>"""
    return html_content
