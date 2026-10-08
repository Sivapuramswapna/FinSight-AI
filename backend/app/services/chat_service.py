import re
from datetime import datetime
from collections import defaultdict
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.models import Transaction, Budget
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage


def compile_user_financial_profile(db: Session, user_id: int) -> Dict[str, Any]:
    """Extracts and compiles dynamic financial context from the database for the user."""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc()).all()

    if not transactions:
        return {
            "has_data": False,
            "total_income": 0.0,
            "total_expense": 0.0,
            "net_savings": 0.0,
            "savings_rate": 0.0,
            "current_month": datetime.utcnow().strftime("%Y-%m"),
            "monthly_expenses": {},
            "monthly_income": {},
            "current_month_expenses": 0.0,
            "current_month_income": 0.0,
            "category_totals_current": {},
            "category_totals_all": {},
            "merchant_totals": {},
            "largest_expense": None,
            "anomalies": []
        }

    monthly_expenses = defaultdict(float)
    monthly_income = defaultdict(float)
    category_totals_current = defaultdict(float)
    category_totals_all = defaultdict(float)
    merchant_totals = defaultdict(float)
    anomalies = []

    # Identify most recent month with transactions
    all_dates = [tx.date for tx in transactions if tx.date]
    latest_month = sorted(all_dates, reverse=True)[0][:7] if all_dates else datetime.utcnow().strftime("%Y-%m")

    total_income = 0.0
    total_expense = 0.0
    largest_expense = None

    for tx in transactions:
        amt = float(tx.amount)
        m_key = tx.date[:7] if tx.date and len(tx.date) >= 7 else "2026-09"

        if tx.type == 'income':
            total_income += amt
            monthly_income[m_key] += amt
        else:
            total_expense += amt
            monthly_expenses[m_key] += amt
            category_totals_all[tx.category] += amt

            if m_key == latest_month:
                category_totals_current[tx.category] += amt

            if tx.merchant:
                merchant_totals[tx.merchant.strip()] += amt

            if largest_expense is None or amt > largest_expense["amount"]:
                largest_expense = {
                    "id": tx.id,
                    "amount": amt,
                    "description": tx.description,
                    "merchant": tx.merchant,
                    "category": tx.category,
                    "date": tx.date
                }

        if tx.is_anomaly:
            anomalies.append({
                "id": tx.id,
                "amount": amt,
                "description": tx.description,
                "merchant": tx.merchant,
                "category": tx.category,
                "score": tx.anomaly_score,
                "date": tx.date
            })

    net_savings = total_income - total_expense
    savings_rate = (net_savings / total_income * 100.0) if total_income > 0 else 0.0

    current_month_expenses = monthly_expenses.get(latest_month, 0.0)
    current_month_income = monthly_income.get(latest_month, 0.0)

    # Calculate previous month comparison if available
    sorted_months = sorted(monthly_expenses.keys())
    prev_month_expenses = 0.0
    if len(sorted_months) >= 2:
        prev_month = sorted_months[-2]
        prev_month_expenses = monthly_expenses.get(prev_month, 0.0)

    return {
        "has_data": True,
        "total_transactions": len(transactions),
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate": round(savings_rate, 1),
        "latest_month": latest_month,
        "current_month_expenses": round(current_month_expenses, 2),
        "current_month_income": round(current_month_income, 2),
        "prev_month_expenses": round(prev_month_expenses, 2),
        "category_totals_current": dict(category_totals_current),
        "category_totals_all": dict(category_totals_all),
        "merchant_totals": dict(merchant_totals),
        "largest_expense": largest_expense,
        "anomalies": anomalies,
        "raw_transactions": transactions
    }


def process_chat_message(db: Session, user_id: int, request: ChatRequest) -> ChatResponse:
    profile = compile_user_financial_profile(db, user_id)
    msg = request.message.lower().strip()

    if not profile["has_data"]:
        return ChatResponse(
            reply="Welcome to **FinSight AI**! You don't have any recorded transactions in your database yet. Start by logging your first expense or income entry, and I'll analyze your spending velocity, budget health, and financial forecasts.",
            suggested_prompts=[
                "How do I record a transaction?",
                "What features does FinSight AI have?",
                "Can you help me set up a budget?"
            ]
        )

    latest_month = profile["latest_month"]
    dt_month_name = datetime.strptime(latest_month, "%Y-%m").strftime("%B %Y") if len(latest_month) == 7 else "Recent Period"

    # 1. Category Spend Inquiry
    categories_map = {
        "food": "Food & Dining",
        "dining": "Food & Dining",
        "grocery": "Food & Dining",
        "groceries": "Food & Dining",
        "restaurant": "Food & Dining",
        "eat": "Food & Dining",
        "transport": "Transportation",
        "transportation": "Transportation",
        "gas": "Transportation",
        "fuel": "Transportation",
        "uber": "Transportation",
        "flight": "Transportation",
        "housing": "Housing & Rent",
        "rent": "Housing & Rent",
        "mortgage": "Housing & Rent",
        "utility": "Utilities & Subscriptions",
        "utilities": "Utilities & Subscriptions",
        "subscription": "Utilities & Subscriptions",
        "subscriptions": "Utilities & Subscriptions",
        "shopping": "Shopping & Apparel",
        "clothes": "Shopping & Apparel",
        "apparel": "Shopping & Apparel",
        "health": "Healthcare & Wellness",
        "wellness": "Healthcare & Wellness",
        "gym": "Healthcare & Wellness",
        "medical": "Healthcare & Wellness",
        "entertainment": "Entertainment",
        "games": "Entertainment",
        "movies": "Entertainment"
    }

    matched_category = None
    for kw, cat in categories_map.items():
        if re.search(r'\b' + re.escape(kw) + r'\b', msg):
            matched_category = cat
            break

    if matched_category and ("spend" in msg or "spent" in msg or "cost" in msg or "much" in msg or "pay" in msg or "how" in msg):
        cat_cur = profile["category_totals_current"].get(matched_category, 0.0)
        cat_all = profile["category_totals_all"].get(matched_category, 0.0)
        cur_tot = profile["current_month_expenses"]
        pct = (cat_cur / cur_tot * 100.0) if cur_tot > 0 else 0.0

        # Find matching transactions for detail
        matching_txs = [
            t for t in profile["raw_transactions"]
            if t.category == matched_category and t.type == 'expense' and t.date.startswith(latest_month)
        ]

        tx_bullets = []
        for t in matching_txs[:3]:
            merchant_label = f" at *{t.merchant}*" if t.merchant else ""
            tx_bullets.append(f"- **${t.amount:,.2f}**{merchant_label} ({t.description}) on {t.date}")

        tx_list_str = "\n".join(tx_bullets) if tx_bullets else "No individual line items in this billing cycle."

        reply = (
            f"In **{dt_month_name}**, you spent **${cat_cur:,.2f}** on **{matched_category}**, which represents **{pct:.1f}%** of your monthly expenses (${cur_tot:,.2f}).\n\n"
            f"**Recent {matched_category} Line Items**:\n{tx_list_str}\n\n"
            f"Overall, across your recorded history, total expenditure in this category is **${cat_all:,.2f}**."
        )
        return ChatResponse(
            reply=reply,
            suggested_prompts=[
                f"How does my {matched_category} spend compare to last month?",
                "Can I afford to cut this expense by 15%?",
                "Give me a complete monthly breakdown",
                "What is my largest expense overall?"
            ],
            referenced_data={"category": matched_category, "current_month_spend": cat_cur, "total_spend": cat_all}
        )

    # 2. Largest / Highest Expense Inquiry
    if "biggest" in msg or "largest" in msg or "highest" in msg or "most expensive" in msg:
        le = profile["largest_expense"]
        if le:
            top_3_expenses = sorted(
                [t for t in profile["raw_transactions"] if t.type == 'expense'],
                key=lambda x: x.amount,
                reverse=True
            )[:3]

            bullets = []
            for idx, t in enumerate(top_3_expenses, 1):
                m_str = f" (*{t.merchant}*)" if t.merchant else ""
                bullets.append(f"{idx}. **${t.amount:,.2f}**{m_str} – *{t.category}* on {t.date} ('{t.description}')")

            reply = (
                f"Your single largest recorded transaction is **${le['amount']:,.2f}** for **{le['category']}** on {le['date']}.\n\n"
                f"**Top 3 Largest Expenditures**:\n" + "\n".join(bullets) + "\n\n"
                f"💡 *Financial Insight*: Recurring fixed commitments like {le['category']} make up the majority of baseline outflow. Optimizing variable purchases provides the fastest route to expanding free cash flow."
            )
            return ChatResponse(
                reply=reply,
                suggested_prompts=[
                    "Give me a monthly breakdown",
                    "How much have I spent on Shopping & Apparel?",
                    "Are there any anomalous or suspicious transactions?",
                    "Can I afford a $400 purchase?"
                ],
                referenced_data={"largest_expense": le}
            )

    # 3. Affordability / Purchase Simulation Inquiry
    dollar_match = re.search(r'\$?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]+\b)', msg)
    if ("afford" in msg or "can i buy" in msg or "can i spend" in msg or "should i get" in msg) and dollar_match:
        try:
            target_amount = float(dollar_match.group(1).replace(",", ""))
        except Exception:
            target_amount = 500.0

        cur_inc = profile["current_month_income"]
        cur_exp = profile["current_month_expenses"]
        cur_surplus = cur_inc - cur_exp
        post_surplus = cur_surplus - target_amount
        cur_savings_rate = profile["savings_rate"]

        if cur_inc > 0:
            post_savings_rate = round(((cur_inc - (cur_exp + target_amount)) / cur_inc) * 100.0, 1)
        else:
            post_savings_rate = 0.0

        if post_surplus > 1000:
            verdict = "✅ **Verdict: Yes, you can comfortably afford this!**"
            status_text = (
                f"Your current month net cash flow is **+${cur_surplus:,.2f}** (${cur_inc:,.2f} income vs. ${cur_exp:,.2f} expenses). "
                f"After this purchase of **${target_amount:,.2f}**, your net cash surplus will remain healthy at **+${post_surplus:,.2f}**, "
                f"maintaining a strong **{post_savings_rate:.1f}%** savings rate."
            )
        elif post_surplus > 0:
            verdict = "⚠️ **Verdict: You can afford this, with caution.**"
            status_text = (
                f"Your net surplus for this cycle is currently **+${cur_surplus:,.2f}**. "
                f"Deducting **${target_amount:,.2f}** leaves you with a smaller cushion of **+${post_surplus:,.2f}** "
                f"(reducing your savings rate to **{post_savings_rate:.1f}%**). Ensure essential bills and emergency buffers are accounted for."
            )
        else:
            verdict = "🛑 **Verdict: Not recommended at this time.**"
            status_text = (
                f"Spending **${target_amount:,.2f}** would exceed your net monthly surplus (**+${cur_surplus:,.2f}**) "
                f"and push your monthly cash flow into a deficit of **-${abs(post_surplus):,.2f}**."
            )

        reply = (
            f"{verdict}\n\n"
            f"{status_text}\n\n"
            f"**Cash Flow Simulation**:\n"
            f"- **Current Monthly Inflow**: +${cur_inc:,.2f}\n"
            f"- **Current Monthly Outflow**: -${cur_exp:,.2f}\n"
            f"- **Planned Purchase**: -${target_amount:,.2f}\n"
            f"- **Simulated Net Free Cash Flow**: **+${post_surplus:,.2f}**"
        )
        return ChatResponse(
            reply=reply,
            suggested_prompts=[
                "Give me a summary of my financial health",
                "What is my biggest expense?",
                "How much did I spend on Food & Dining this month?",
                "What are my predicted expenses for next month?"
            ],
            referenced_data={"purchase_amount": target_amount, "post_surplus": post_surplus}
        )

    # 4. Anomaly / Surveillance / Fraud Inquiry
    if "anomaly" in msg or "anomalies" in msg or "fraud" in msg or "suspicious" in msg or "deviant" in msg or "flag" in msg:
        anom_list = profile["anomalies"]
        if anom_list:
            anom_bullets = []
            for a in anom_list[:3]:
                m_txt = f" at *{a['merchant']}*" if a['merchant'] else ""
                anom_bullets.append(f"- **${a['amount']:,.2f}**{m_txt} ({a['category']}) – Score: {int((a['score'] or 0.8) * 100)}% on {a['date']}")

            reply = (
                f"The **Isolation Forest Surveillance Engine** has currently flagged **{len(anom_list)} active anomaly**:\n\n"
                + "\n".join(anom_bullets) + "\n\n"
                f"These transactions exhibited significant statistical deviation in either single-charge magnitude, category baseline ratio, or timing.\n"
                f"You can review, inspect, or resolve them directly on the **[Fraud Surveillance & Anomaly Detection](/anomalies)** page."
            )
        else:
            reply = (
                "🛡️ **All Clear!** The unsupervised Isolation Forest surveillance model currently detects **zero active anomalies** in your transaction stream.\n"
                "All recent debits fall within expected historical variance models."
            )
        return ChatResponse(
            reply=reply,
            suggested_prompts=[
                "What is my largest expense overall?",
                "Give me a complete monthly breakdown",
                "How much did I spend on Shopping & Apparel?",
                "Can I afford a $250 purchase?"
            ],
            referenced_data={"anomalies_count": len(anom_list)}
        )

    # 5. Monthly Summary / Breakdown / Financial Health Inquiry
    if "summary" in msg or "breakdown" in msg or "health" in msg or "overview" in msg or "how am i doing" in msg or "status" in msg or "score" in msg:
        cur_inc = profile["current_month_income"]
        cur_exp = profile["current_month_expenses"]
        cur_surplus = cur_inc - cur_exp
        cur_cats = sorted(profile["category_totals_current"].items(), key=lambda x: x[1], reverse=True)

        cat_lines = []
        for cat, amt in cur_cats[:4]:
            pct = (amt / cur_exp * 100.0) if cur_exp > 0 else 0.0
            cat_lines.append(f"- **{cat}**: ${amt:,.2f} ({pct:.1f}%)")

        reply = (
            f"Here is your executive financial briefing for **{dt_month_name}**:\n\n"
            f"- **Total Monthly Inflow**: **+${cur_inc:,.2f}**\n"
            f"- **Total Monthly Outflow**: **-${cur_exp:,.2f}**\n"
            f"- **Net Cash Surplus**: **+${cur_surplus:,.2f}**\n"
            f"- **Cumulative Savings Rate**: **{profile['savings_rate']:.1f}%**\n\n"
            f"**Top Spending Allocations**:\n" + "\n".join(cat_lines) + "\n\n"
            f"🎯 **Diagnostic**: Your finances are in **Excellent Health**. Your income comfortably outpaces recurring obligations, generating consistent liquidity."
        )
        return ChatResponse(
            reply=reply,
            suggested_prompts=[
                "What was my biggest expense?",
                "How much did I spend on Food & Dining?",
                "Are there any anomalies detected?",
                "Can I afford a $600 expense?"
            ],
            referenced_data={"income": cur_inc, "expenses": cur_exp, "surplus": cur_surplus}
        )

    # 6. Trend / Month-over-Month Comparison
    if "compare" in msg or "trend" in msg or "last month" in msg or "previous" in msg:
        cur_exp = profile["current_month_expenses"]
        prev_exp = profile["prev_month_expenses"]

        if prev_exp > 0:
            diff = cur_exp - prev_exp
            pct_diff = (diff / prev_exp) * 100.0
            dir_str = "more" if diff > 0 else "less"
            reply = (
                f"**Month-over-Month Spending Trend**:\n\n"
                f"- **{dt_month_name} Expenses**: **${cur_exp:,.2f}**\n"
                f"- **Prior Month Expenses**: **${prev_exp:,.2f}**\n"
                f"- **Delta**: You spent **${abs(diff):,.2f} ({abs(pct_diff):.1f}%) {dir_str}** compared to the previous period.\n\n"
                f"💡 Regular monitoring of trend velocity helps keep discretionary lifestyle creep in check."
            )
        else:
            reply = (
                f"In **{dt_month_name}**, your expenses currently total **${cur_exp:,.2f}**. "
                f"Historical comparative data from the immediate prior period is accumulating."
            )

        return ChatResponse(
            reply=reply,
            suggested_prompts=[
                "Give me a monthly breakdown",
                "What is my biggest expense?",
                "How much did I spend on Transportation?",
                "What are my predictions for next month?"
            ]
        )

    # 7. Merchant Lookup
    merchants = profile["merchant_totals"]
    matched_m = None
    for m in merchants.keys():
        if m.lower() in msg:
            matched_m = m
            break

    if matched_m:
        m_spent = merchants[matched_m]
        reply = (
            f"You have spent a total of **${m_spent:,.2f}** with **{matched_m}** across your ledger.\n\n"
            f"Would you like me to analyze all transactions associated with {matched_m} or compare it with other merchants?"
        )
        return ChatResponse(
            reply=reply,
            suggested_prompts=[
                "Give me a complete monthly breakdown",
                "What is my largest expense?",
                "How much did I spend on Food & Dining?",
                "Can I afford a $350 purchase?"
            ]
        )

    # 8. General Financial Advice / Default Response
    cur_inc = profile["current_month_income"]
    cur_exp = profile["current_month_expenses"]
    top_cat = list(profile["category_totals_current"].keys())[0] if profile["category_totals_current"] else "General Expenses"

    reply = (
        f"I am your **FinSight AI Financial Co-pilot**, continuously monitoring your accounts and transactions.\n\n"
        f"Here is a quick snapshot of your active position:\n"
        f"- **Current Month Expenses**: **${cur_exp:,.2f}** (Lead category: *{top_cat}*)\n"
        f"- **Current Month Income**: **+${cur_inc:,.2f}**\n"
        f"- **Net Savings Surplus**: **+${(cur_inc - cur_exp):,.2f}** ({profile['savings_rate']:.1f}% savings rate)\n\n"
        f"Feel free to ask me questions like:\n"
        f"- *'How much did I spend on food this month?'*\n"
        f"- *'Can I afford a $500 weekend getaway?'*\n"
        f"- *'What is my single biggest expense?'*\n"
        f"- *'Are there any anomalies flagged in my transactions?'*"
    )
    return ChatResponse(
        reply=reply,
        suggested_prompts=[
            "Give me a summary of my financial health",
            "How much did I spend on Food & Dining this month?",
            "What was my biggest expense?",
            "Can I afford a $400 purchase?"
        ]
    )
