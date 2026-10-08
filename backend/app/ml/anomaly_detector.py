import math
from datetime import datetime
from typing import List, Dict, Tuple
from collections import defaultdict
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session

from app.models.models import Transaction
from app.schemas.anomaly import AnomalyItem, AnomalySummary, AnomalyResponse


def detect_anomalies(db: Session, user_id: int) -> AnomalyResponse:
    """
    Surveillance engine that applies Scikit-Learn's Isolation Forest algorithm
    alongside category deviation z-scores and merchant frequency heuristics to identify
    statistically aberrant or potentially fraudulent expense transactions.
    """
    # Fetch all expense transactions for the user
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == 'expense'
    ).order_by(Transaction.date.desc()).all()

    if not transactions:
        return AnomalyResponse(
            summary=AnomalySummary(
                total_anomalies=0,
                high_risk_count=0,
                moderate_risk_count=0,
                flagged_amount=0.0,
                surveillance_status="Idle • No Expense Transactions Found",
                model_contamination=0.10
            ),
            anomalies=[]
        )

    # Calculate baseline category statistics
    category_amounts = defaultdict(list)
    merchant_counts = defaultdict(int)

    for tx in transactions:
        category_amounts[tx.category].append(float(tx.amount))
        if tx.merchant:
            merchant_counts[tx.merchant.strip()] += 1

    category_stats = {}
    for cat, amts in category_amounts.items():
        mean_val = float(np.mean(amts))
        std_val = float(np.std(amts)) if len(amts) > 1 else max(mean_val * 0.25, 10.0)
        if std_val < 1.0:
            std_val = max(mean_val * 0.25, 5.0)
        category_stats[cat] = {"mean": mean_val, "std": std_val}

    # Prepare feature matrix for Isolation Forest
    # Features: [amount, log_amount, cat_z_score, cat_ratio, merchant_freq_inv, is_weekend]
    feature_rows = []
    metadata_rows = []

    for tx in transactions:
        amt = float(tx.amount)
        cat_info = category_stats.get(tx.category, {"mean": amt, "std": 10.0})
        cat_mean = cat_info["mean"]
        cat_std = cat_info["std"]
        cat_z_score = max(0.0, (amt - cat_mean) / cat_std)
        cat_ratio = amt / (cat_mean + 1.0)

        merchant = (tx.merchant or "").strip()
        m_count = merchant_counts.get(merchant, 1)
        merchant_freq_inv = 1.0 / (m_count + 1.0)

        # Check weekend
        is_weekend = 0.0
        try:
            dt = datetime.strptime(tx.date, "%Y-%m-%d")
            if dt.weekday() >= 5:  # Saturday or Sunday
                is_weekend = 1.0
        except Exception:
            is_weekend = 0.0

        feature_rows.append([
            amt,
            np.log1p(max(0.0, amt)),
            cat_z_score,
            cat_ratio,
            merchant_freq_inv,
            is_weekend
        ])
        metadata_rows.append({
            "tx": tx,
            "cat_mean": cat_mean,
            "cat_std": cat_std,
            "cat_z_score": cat_z_score,
            "cat_ratio": cat_ratio,
            "is_weekend": bool(is_weekend)
        })

    X = np.array(feature_rows)

    # If user has marked a transaction as resolved previously, ignore re-flagging
    # We identify resolved transactions if tx.notes contains '[RESOLVED_ANOMALY]'
    resolved_ids = set()
    for tx in transactions:
        if tx.notes and "[RESOLVED_ANOMALY]" in tx.notes:
            resolved_ids.add(tx.id)

    # Fit Isolation Forest when sample size is sufficient (>= 5), otherwise use statistical threshold
    contamination_rate = 0.10
    if len(transactions) >= 5:
        # Standardize features for robust isolation trees
        col_means = np.mean(X, axis=0)
        col_stds = np.std(X, axis=0)
        col_stds[col_stds == 0] = 1.0
        X_scaled = (X - col_means) / col_stds

        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=contamination_rate,
            random_state=42
        )
        iso_forest.fit(X_scaled)
        decision_scores = iso_forest.decision_function(X_scaled)
        preds = iso_forest.predict(X_scaled)
    else:
        decision_scores = np.zeros(len(transactions))
        preds = np.ones(len(transactions), dtype=int)

    detected_items: List[AnomalyItem] = []
    high_risk_count = 0
    moderate_risk_count = 0
    flagged_amount = 0.0

    # Process scores and build AI explanation
    for idx, meta in enumerate(metadata_rows):
        tx = meta["tx"]
        amt = float(tx.amount)
        cat_mean = meta["cat_mean"]
        cat_z_score = meta["cat_z_score"]
        cat_ratio = meta["cat_ratio"]
        is_wknd = meta["is_weekend"]

        # Check if already resolved by user
        if tx.id in resolved_ids:
            if tx.is_anomaly:
                tx.is_anomaly = False
                tx.anomaly_score = 0.0
            continue

        # Raw score conversion: decision_function gives negative for anomalies, positive for inliers
        # Range is roughly [-0.5, 0.5]. Invert and map to [0, 1]
        dec = decision_scores[idx]
        iso_score = 1.0 / (1.0 + np.exp(dec * 5.0))  # Sigmoid mapping centered at 0

        # Heuristic amplification based on statistical category deviation
        if cat_ratio >= 3.0:
            combined_score = max(iso_score, 0.85 + min(0.12, (cat_ratio - 3.0) * 0.02))
        elif cat_ratio >= 2.0 or cat_z_score >= 2.0:
            combined_score = max(iso_score, 0.70 + min(0.14, (cat_z_score - 2.0) * 0.03))
        elif tx.is_anomaly and tx.anomaly_score > 0:
            combined_score = max(iso_score, tx.anomaly_score)
        else:
            combined_score = iso_score

        # Determine anomaly threshold: Isolation Forest flagged (-1), or combined score >= 0.65, or explicit DB flag
        is_anom = (preds[idx] == -1) or (combined_score >= 0.65) or (cat_ratio >= 2.5 and amt > 100) or tx.is_anomaly

        if is_anom:
            final_score = round(min(0.98, max(0.65, combined_score)), 2)

            # Determine severity
            if final_score >= 0.80 or cat_ratio >= 3.0:
                severity = "High Risk"
                high_risk_count += 1
            elif final_score >= 0.65:
                severity = "Moderate Risk"
                moderate_risk_count += 1
            else:
                severity = "Low Risk"

            # Formulate explainable AI rationale
            reasons = []
            if cat_ratio >= 2.0:
                reasons.append(
                    f"Amount (${amt:,.2f}) is {cat_ratio:.1f}x higher than your average {tx.category} spend (${cat_mean:,.2f})"
                )
            elif cat_z_score >= 1.8:
                reasons.append(
                    f"Deviation of +{cat_z_score:.1f}σ from your historical spending baseline in {tx.category}"
                )

            if is_wknd and (cat_ratio >= 1.5 or amt > 200):
                reasons.append("Unusual weekend transaction volume detected")

            if tx.merchant and merchant_counts.get(tx.merchant.strip(), 0) <= 1:
                reasons.append(f"First-time or rare merchant ({tx.merchant})")

            if not reasons:
                reasons.append("Multi-attribute isolation tree detected outlier spending pattern")

            ai_reason = "; ".join(reasons) + "."

            # Update DB transaction fields
            tx.is_anomaly = True
            tx.anomaly_score = final_score
            flagged_amount += amt

            detected_items.append(
                AnomalyItem(
                    id=tx.id,
                    amount=round(amt, 2),
                    type=tx.type,
                    category=tx.category,
                    description=tx.description,
                    date=tx.date,
                    merchant=tx.merchant,
                    payment_method=tx.payment_method,
                    anomaly_score=final_score,
                    severity=severity,
                    ai_reason=ai_reason,
                    is_anomaly=True
                )
            )
        else:
            # Not an anomaly
            if tx.is_anomaly and tx.id not in resolved_ids:
                tx.is_anomaly = False
                tx.anomaly_score = 0.0

    # Commit any synchronized DB updates
    try:
        db.commit()
    except Exception:
        db.rollback()

    # Sort detected items by anomaly_score descending, then amount descending
    detected_items.sort(key=lambda item: (item.anomaly_score, item.amount), reverse=True)

    summary = AnomalySummary(
        total_anomalies=len(detected_items),
        high_risk_count=high_risk_count,
        moderate_risk_count=moderate_risk_count,
        flagged_amount=round(flagged_amount, 2),
        surveillance_status=f"Active • Isolation Forest (100 Trees, {len(transactions)} Evaluated)",
        model_contamination=contamination_rate
    )

    return AnomalyResponse(
        summary=summary,
        anomalies=detected_items
    )


def resolve_anomaly(db: Session, user_id: int, transaction_id: int) -> Dict[str, any]:
    """
    Resolves a flagged anomaly by marking it verified and updating notes
    so the model surveillance engine does not repeatedly flag it.
    """
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()

    if not tx:
        return {"success": False, "message": "Transaction not found or unauthorized"}

    tx.is_anomaly = False
    tx.anomaly_score = 0.0
    # Append resolution tag to notes
    existing_notes = tx.notes or ""
    if "[RESOLVED_ANOMALY]" not in existing_notes:
        tx.notes = (existing_notes + " [RESOLVED_ANOMALY]").strip()

    db.commit()
    return {
        "success": True,
        "message": f"Transaction #{transaction_id} marked as verified and anomaly resolved.",
        "transaction_id": transaction_id,
        "is_anomaly": False
    }
