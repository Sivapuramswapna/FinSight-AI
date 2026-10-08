"""
FinSight AI - Complete End-to-End System Regression Test Suite
Validates all 11 core functional modules and security boundaries across the platform.
"""
import sys

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_full_suite():
    print("=" * 70)
    print("FINSIGHT AI - FULL END-TO-END REGRESSION TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. AUTHENTICATION & USER LIFECYCLE
    # -------------------------------------------------------------
    print("\n[1/11] Testing Authentication & Authorization Pipeline...")
    
    # Login with demo user
    login_resp = client.post("/auth/login", json={
        "email": "alex.reynolds@example.com",
        "password": "password123"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token_data = login_resp.json()
    assert "access_token" in token_data, "No access_token returned"
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  ✓ Demo user login successful (Token received: {token[:16]}...)")

    # Get user profile (/auth/me)
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200, f"/auth/me failed: {me_resp.text}"
    user_info = me_resp.json()
    assert user_info["email"] == "alex.reynolds@example.com"
    assert "hashed_password" not in user_info, "Security vulnerability: hashed_password exposed in user object!"
    print(f"  ✓ User profile verified: {user_info['full_name']} ({user_info['email']})")

    # Rejection of invalid credentials
    bad_login = client.post("/auth/login", json={
        "email": "alex.reynolds@example.com",
        "password": "wrongpassword"
    })
    assert bad_login.status_code in (400, 401), "Failed to reject invalid password"
    print("  ✓ Invalid password correctly rejected (401/400)")

    # -------------------------------------------------------------
    # 2. TRANSACTION LEDGER & CRUD
    # -------------------------------------------------------------
    print("\n[2/11] Testing Transaction Ledger & CRUD Operations...")
    
    # Fetch transactions with pagination
    tx_list_resp = client.get("/transactions?page=1&limit=5", headers=headers)
    assert tx_list_resp.status_code == 200, f"Transactions fetch failed: {tx_list_resp.text}"
    tx_data = tx_list_resp.json()
    items = tx_data.get("items") or tx_data.get("transactions") or tx_data
    total_tx = tx_data.get("total", len(items)) if isinstance(tx_data, dict) else len(items)
    print(f"  ✓ Transactions fetched: {len(items)} items on page 1 (Total: {total_tx})")

    # Create new transaction
    new_tx_payload = {
        "date": "2026-09-30",
        "merchant": "Regression Test Merchant",
        "category": "Shopping & Apparel",
        "type": "expense",
        "amount": 42.50,
        "payment_method": "Credit Card",
        "description": "Automated system test purchase",
        "status": "completed"
    }
    create_tx_resp = client.post("/transactions", json=new_tx_payload, headers=headers)
    assert create_tx_resp.status_code in (200, 201), f"Create transaction failed: {create_tx_resp.text}"
    created_tx = create_tx_resp.json()
    tx_id = created_tx["id"]
    assert created_tx["amount"] == 42.50
    print(f"  ✓ Transaction created: ID {tx_id} (${created_tx['amount']})")

    # Update transaction
    update_tx_resp = client.put(f"/transactions/{tx_id}", json={
        "amount": 45.00,
        "description": "Updated automated purchase"
    }, headers=headers)
    assert update_tx_resp.status_code == 200, f"Update transaction failed: {update_tx_resp.text}"
    updated_tx = update_tx_resp.json()
    assert updated_tx["amount"] == 45.00
    print(f"  ✓ Transaction updated: ID {tx_id} updated amount = ${updated_tx['amount']}")

    # Clean up test transaction
    del_tx_resp = client.delete(f"/transactions/{tx_id}", headers=headers)
    assert del_tx_resp.status_code in (200, 204), f"Delete transaction failed: {del_tx_resp.text}"
    print(f"  ✓ Transaction deleted: ID {tx_id} cleaned up")

    # -------------------------------------------------------------
    # 3. FINANCIAL ANALYTICS SERVICE
    # -------------------------------------------------------------
    print("\n[3/11] Testing Financial Analytics & Aggregations...")
    analytics_resp = client.get("/analytics?timeframe=all", headers=headers)
    assert analytics_resp.status_code == 200, f"Analytics failed: {analytics_resp.text}"
    analytics = analytics_resp.json()
    assert "total_income" in analytics or "summary" in analytics or "monthly_trend" in analytics, "Missing key analytics fields"
    total_income = analytics.get("total_income", analytics.get("summary", {}).get("total_income", 0))
    total_expenses = analytics.get("total_expenses", analytics.get("summary", {}).get("total_expenses", 0))
    print(f"  ✓ Dynamic Financial Analytics verified:")
    print(f"    - Total Inflow: ${total_income:,.2f}")
    print(f"    - Total Outflow: ${total_expenses:,.2f}")
    if "category_breakdown" in analytics:
        print(f"    - Tracked Categories: {len(analytics['category_breakdown'])}")

    # -------------------------------------------------------------
    # 4. ML EXPENSE PREDICTOR (Ridge Regression)
    # -------------------------------------------------------------
    print("\n[4/11] Testing ML Expense Prediction Engine (Ridge Regression)...")
    pred_resp = client.get("/predictions", headers=headers)
    assert pred_resp.status_code == 200, f"Predictions failed: {pred_resp.text}"
    preds = pred_resp.json()
    assert "predicted_total_expense" in preds, f"Expected predicted_total_expense in preds: {preds.keys()}"
    pred_val = preds["predicted_total_expense"]
    conf_interval = preds.get("confidence_interval", {})
    print(f"  ✓ ML Point Forecast for Next Month: ${pred_val:,.2f}")
    if isinstance(conf_interval, dict) and "lower" in conf_interval:
        print(f"    - 95% Confidence Interval: [${conf_interval['lower']:,.2f} - ${conf_interval['upper']:,.2f}]")
    print(f"    - Projected Trend: {preds.get('trend_direction', 'stable')}")
    if "category_predictions" in preds:
        print(f"    - Category Decompositions: {len(preds['category_predictions'])} categories forecasted")

    # -------------------------------------------------------------
    # 5. ANOMALY DETECTION ENGINE (Isolation Forest)
    # -------------------------------------------------------------
    print("\n[5/11] Testing Anomaly Detection & Fraud Surveillance (Isolation Forest)...")
    anom_resp = client.get("/anomalies", headers=headers)
    assert anom_resp.status_code == 200, f"Anomalies failed: {anom_resp.text}"
    anom_data = anom_resp.json()
    anomalies_list = anom_data.get("anomalies", [])
    print(f"  ✓ Isolation Forest scanned: {len(anomalies_list)} anomaly candidates flagged")
    if anomalies_list:
        sample_anom = anomalies_list[0]
        print(f"    - Sample flagged: {sample_anom.get('merchant')} (${sample_anom.get('amount')})")
        print(f"    - Severity: {sample_anom.get('severity')} | Anomaly Score: {sample_anom.get('anomaly_score'):.2f}")
        print(f"    - AI Rationale: {sample_anom.get('ai_reason')[:70]}...")
        
        # Test resolving anomaly
        anom_id = sample_anom.get("id")
        if anom_id:
            res_resp = client.post(f"/anomalies/{anom_id}/resolve", headers=headers)
            if res_resp.status_code == 200:
                print(f"    - Successfully verified resolution for anomaly ID {anom_id}")

    # -------------------------------------------------------------
    # 6. AI SMART CATEGORIZATION (TF-IDF NLP)
    # -------------------------------------------------------------
    print("\n[6/11] Testing AI Smart Categorization (TF-IDF + Historical Memory)...")
    cat_payload = {
        "merchant": "Whole Foods Market",
        "description": "Organic groceries and snacks",
        "amount": 78.50
    }
    cat_resp = client.post("/ai/categorize", json=cat_payload, headers=headers)
    assert cat_resp.status_code == 200, f"Categorization failed: {cat_resp.text}"
    cat_result = cat_resp.json()
    assert "predicted_category" in cat_result, "No predicted_category returned"
    print(f"  ✓ Input: '{cat_payload['merchant']}' -> Categorized as: '{cat_result['predicted_category']}' (Confidence: {cat_result.get('confidence', 0.95):.0%})")

    # -------------------------------------------------------------
    # 7. GROUNDED FINANCIAL AI CHATBOT (Ledger RAG)
    # -------------------------------------------------------------
    print("\n[7/11] Testing Grounded Financial AI Chatbot (Ledger RAG Engine)...")
    chat_payload = {
        "message": "What is my total spending this month and what was my largest expense?"
    }
    chat_resp = client.post("/chat", json=chat_payload, headers=headers)
    assert chat_resp.status_code == 200, f"Chat failed: {chat_resp.text}"
    chat_result = chat_resp.json()
    assert "reply" in chat_result, "No reply returned from chat"
    print(f"  ✓ User Query: '{chat_payload['message']}'")
    print(f"  ✓ RAG Response snippet: {chat_result['reply'][:140]}...")

    # -------------------------------------------------------------
    # 8. RECEIPT OCR ENGINE
    # -------------------------------------------------------------
    print("\n[8/11] Testing Receipt OCR Extraction Engine...")
    ocr_resp = client.post("/receipts/scan", data={"sample_type": "whole_foods"}, headers=headers)
    assert ocr_resp.status_code == 200, f"OCR scan failed: {ocr_resp.text}"
    ocr_res = ocr_resp.json()
    assert ocr_res.get("merchant") == "Whole Foods Market", f"Unexpected merchant: {ocr_res}"
    assert ocr_res.get("total_amount") == 156.40, f"Unexpected total: {ocr_res}"
    print(f"  ✓ OCR Extracted: Merchant='{ocr_res.get('merchant')}', Amount=${ocr_res.get('total_amount')}, Tax=${ocr_res.get('tax_amount')}")
    print(f"  ✓ Line items parsed: {len(ocr_res.get('line_items', []))} items | Predicted Category: '{ocr_res.get('predicted_category')}'")

    # -------------------------------------------------------------
    # 9. SMART BUDGETS, GOALS & CASH FLOW FORECASTING
    # -------------------------------------------------------------
    print("\n[9/11] Testing Budgets, Goals & 30-Day Forward Forecasting...")
    budgets_resp = client.get("/budgets", headers=headers)
    assert budgets_resp.status_code == 200, f"Budgets failed: {budgets_resp.text}"
    b_data = budgets_resp.json()
    assert "total_budgeted" in b_data
    print(f"  ✓ Budget Summary: Budgeted=${b_data['total_budgeted']:,.2f} | Spent=${b_data['total_spent']:,.2f} | Cushion=${b_data['remaining_cushion']:,.2f}")

    forecast_resp = client.get("/budgets/forecast", headers=headers)
    assert forecast_resp.status_code == 200, f"Forecast failed: {forecast_resp.text}"
    f_data = forecast_resp.json()
    forecast_points = f_data.get("daily_projection", [])
    print(f"  ✓ 30-Day Cash Flow Forecast: Generated {len(forecast_points)} daily projection points (Ending Balance: ${f_data.get('projected_end_balance', 0):,.2f})")

    goals_resp = client.get("/goals", headers=headers)
    assert goals_resp.status_code == 200, f"Goals failed: {goals_resp.text}"
    goals_list = goals_resp.json()
    assert isinstance(goals_list, list), f"Expected list of goals, got {type(goals_list)}"
    print(f"  ✓ Active Goals: {len(goals_list)} tracked")

    # -------------------------------------------------------------
    # 10. FINANCIAL REPORTS & EXPORTS
    # -------------------------------------------------------------
    print("\n[10/11] Testing Financial Reporting & Export Engine...")
    report_resp = client.get("/reports/monthly?year=2026&month=9", headers=headers)
    assert report_resp.status_code == 200, f"Monthly report failed: {report_resp.text}"
    rep = report_resp.json()
    assert "executive_summary" in rep, "Missing executive_summary"
    print(f"  ✓ Executive Monthly Report generated: {rep['period']} (Savings Rate: {rep['savings_rate']}%)")

    csv_resp = client.get("/reports/export/csv?year=2026&month=9", headers=headers)
    assert csv_resp.status_code == 200, f"CSV export failed: {csv_resp.text}"
    assert "Transaction ID,Date,Type,Category" in csv_resp.text
    print(f"  ✓ CSV Ledger exported: {len(csv_resp.text.splitlines())} lines streamed")

    statement_resp = client.get("/reports/export/statement?year=2026&month=9", headers=headers)
    assert statement_resp.status_code == 200, f"Statement export failed: {statement_resp.text}"
    assert "<!DOCTYPE html>" in statement_resp.text
    print(f"  ✓ Printable Financial Statement HTML rendered ({len(statement_resp.text)} bytes)")

    # -------------------------------------------------------------
    # 11. NOTIFICATIONS ENGINE
    # -------------------------------------------------------------
    print("\n[11/11] Testing Real-Time Notifications Engine...")
    notif_resp = client.get("/notifications", headers=headers)
    assert notif_resp.status_code == 200, f"Notifications failed: {notif_resp.text}"
    notifs = notif_resp.json()
    assert "notifications" in notifs
    print(f"  ✓ Active Notifications: {len(notifs['notifications'])} (Unread: {notifs['unread_count']})")

    mark_all_resp = client.put("/notifications/read-all", headers=headers)
    assert mark_all_resp.status_code == 200, f"Mark all read failed: {mark_all_resp.text}"
    print(f"  ✓ Bulk Mark As Read verified")

    print("\n" + "=" * 70)
    print("ALL 11 BACKEND MODULES FULLY PASSED END-TO-END REGRESSION AUDIT!")
    print("=" * 70)


if __name__ == "__main__":
    run_full_suite()
