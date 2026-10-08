from collections import defaultdict, Counter
import re
from typing import List, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models.models import Transaction
from app.schemas.categorization import (
    CategorizeRequest,
    CategoryCandidate,
    CategorizeResponse
)

# Reference Knowledge Corpus for Financial Categories
CATEGORY_CORPUS = {
    'Food & Dining': (
        "grocery supermarket groceries restaurant dining diner burger pizza sushi cafe coffee bakery bistro "
        "whole foods trader joe trader joe's starbucks peet's uber eats doordash grubhub mcdonald's mcdonalds "
        "chipotle sweetgreen safeway kroger aldi publix costco wholesale food market lunch dinner breakfast snacks bar pub brew"
    ),
    'Transportation': (
        "gas fuel gasoline chevron shell exxon mobil bp speedway sunoco tesla supercharger chargepoint ev charging "
        "uber lyft ride rideshare taxi cab transit metro subway bus train amtrak parking sp+ parking garage toll "
        "ezpass fasstrak flight airline airlines delta delta airlines united american airlines southwest jetblue alaska air car rental hertz avis enterprise"
    ),
    'Housing & Rent': (
        "rent rental apartment property management real estate mortgage home loan landlord lease hoa dues homeowners "
        "condo maintenance tenant housing metro property group equity residential avalonbay archstone lease payment"
    ),
    'Utilities & Subscriptions': (
        "electric electricity power utility edison coned pge water sewage sanitation waste trash gas utility internet "
        "wifi broadband verizon at&t t-mobile comcast xfinity spectrum charter netflix spotify hulu disney+ hbo max "
        "apple tv icloud google storage aws dropbox prime amazon prime youtube premium subscription digital monthly recurring"
    ),
    'Shopping & Apparel': (
        "amazon amazon marketplace amazon.com target walmart best buy apple store clothing apparel clothes shoes "
        "sneakers fashion zara nike adidas h&m nordstrom macy's macys gap uniqlo lululemon electronics gadget "
        "hardware department store retail boutique outlet merchandise macbook accessory charger iphone ipad laptop"
    ),
    'Healthcare & Wellness': (
        "pharmacy cvs cvs pharmacy walgreens rite aid doctor physician hospital clinic dental dentist orthodontist "
        "vision optometry eyeglasses lenses prescription medicine healthcare medical copay labcorp quest diagnostics "
        "fitness gym planet fitness equinox lifetime yoga pilates crossfit mental health therapy counseling"
    ),
    'Entertainment': (
        "movie movies theater cinema amc regal cinematicket concert live event ticketmaster live nation seatgeek "
        "steam playstation psn xbox live nintendo eshop gaming video games blizzard ea sports amusement park theme park "
        "museum art gallery zoo aquarium bowling golf recreation sporting events"
    ),
    'Salary': (
        "payroll direct deposit salary wages biweekly paycheck monthly compensation apex tech corp employer "
        "stipend earnings bonus payout adp workday gust paychex"
    ),
    'Consulting': (
        "consulting freelance client payment invoice retainer stripe inc stripe transfer direct payment upwork fiverr "
        "toptal professional services contract work advisory fee tech consulting"
    ),
    'Investments & Dividends': (
        "vanguard fidelity charles schwab robinhood etrade morgan stanley index fund mutual fund etf stock shares "
        "dividend distribution capital gain treasury bond crypto cryptocurrency coinbase kraken binance bitcoin "
        "ethereum interest yield high yield savings"
    )
}

INCOME_CATEGORIES = {'Salary', 'Consulting', 'Investments & Dividends'}
EXPENSE_CATEGORIES = {
    'Housing & Rent', 'Food & Dining', 'Transportation',
    'Utilities & Subscriptions', 'Shopping & Apparel',
    'Healthcare & Wellness', 'Entertainment'
}

# Pre-train TF-IDF Vectorizer on Domain Corpus
categories_list = list(CATEGORY_CORPUS.keys())
corpus_texts = [CATEGORY_CORPUS[cat] for cat in categories_list]

vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    sublinear_tf=True,
    stop_words='english'
)
corpus_matrix = vectorizer.fit_transform(corpus_texts)


def clean_text(text: str) -> str:
    """Preprocesses and normalizes text for NLP matching."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return ' '.join(text.split())


def categorize_transaction(db: Session, user_id: int, request: CategorizeRequest) -> CategorizeResponse:
    raw_query = f"{request.description} {request.merchant or ''}".strip()
    cleaned_query = clean_text(raw_query)
    amount = request.amount or 0.0

    # 1. Compute TF-IDF Cosine Similarity against Domain Financial Corpus
    query_vector = vectorizer.transform([cleaned_query])
    similarities = cosine_similarity(query_vector, corpus_matrix)[0]

    category_scores = {}
    for idx, cat in enumerate(categories_list):
        score = float(similarities[idx])
        # Filter or penalize mismatch with specified transaction type
        if request.type == 'income' and cat not in INCOME_CATEGORIES:
            score *= 0.05
        elif request.type == 'expense' and cat in INCOME_CATEGORIES:
            score *= 0.05
        category_scores[cat] = score

    # 2. Historical User Transaction Memory
    user_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).all()

    user_merchant_votes = defaultdict(Counter)
    for tx in user_txs:
        if tx.merchant:
            m_clean = clean_text(tx.merchant)
            if m_clean:
                user_merchant_votes[m_clean][tx.category] += 1

    req_merchant_clean = clean_text(request.merchant) if request.merchant else ""
    matched_merchant_cat = None
    historical_reason = ""

    # Check merchant history
    if req_merchant_clean and req_merchant_clean in user_merchant_votes:
        cat_counts = user_merchant_votes[req_merchant_clean]
        # If merchant has multiple historical categories (e.g. Apple Store for both iCloud and MacBook),
        # use TF-IDF semantic score and amount context to select the most appropriate one
        best_cand = None
        best_combined = -1.0
        for cat, cnt in cat_counts.items():
            tfidf_val = category_scores.get(cat, 0.0)
            combined = (cnt * 0.4) + (tfidf_val * 1.5)

            # Amount disambiguation for tech / digital subscriptions
            if cat == 'Utilities & Subscriptions' and amount > 50:
                combined -= 0.5
            elif cat == 'Shopping & Apparel' and amount > 50:
                combined += 0.3

            if combined > best_combined:
                best_combined = combined
                best_cand = (cat, cnt)

        if best_cand:
            matched_merchant_cat, count = best_cand
            category_scores[matched_merchant_cat] = max(
                category_scores.get(matched_merchant_cat, 0.0),
                0.86 + min(0.10, count * 0.02)
            )
            historical_reason = f"Learned from {count} prior transaction(s) with '{request.merchant}'."

    # 3. Domain Heuristics for High-Confidence Signatures
    if ("salary" in cleaned_query or "payroll" in cleaned_query or "direct deposit" in cleaned_query) and request.type != 'expense':
        category_scores['Salary'] = max(category_scores.get('Salary', 0), 0.96)
    elif ("whole foods" in cleaned_query or "trader joe" in cleaned_query or "supermarket" in cleaned_query or "groceries" in cleaned_query):
        category_scores['Food & Dining'] = max(category_scores.get('Food & Dining', 0), 0.94)
    elif ("chevron" in cleaned_query or "gas station" in cleaned_query or "shell" in cleaned_query or "supercharger" in cleaned_query):
        category_scores['Transportation'] = max(category_scores.get('Transportation', 0), 0.92)
    elif ("uber" in cleaned_query or "lyft" in cleaned_query) and ("eats" not in cleaned_query and "food" not in cleaned_query):
        category_scores['Transportation'] = max(category_scores.get('Transportation', 0), 0.90)
    elif ("lease" in cleaned_query or "apartment" in cleaned_query or "rent" in cleaned_query) and "car" not in cleaned_query:
        category_scores['Housing & Rent'] = max(category_scores.get('Housing & Rent', 0), 0.93)
    elif ("macbook" in cleaned_query or "laptop" in cleaned_query or "accessory" in cleaned_query or "iphone" in cleaned_query or "ipad" in cleaned_query):
        category_scores['Shopping & Apparel'] = max(category_scores.get('Shopping & Apparel', 0), 0.91)
    elif ("amazon" in cleaned_query and "aws" not in cleaned_query and "prime video" not in cleaned_query):
        category_scores['Shopping & Apparel'] = max(category_scores.get('Shopping & Apparel', 0), 0.88)

    # Sort categories by score descending
    sorted_cats = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    top_cat, top_score = sorted_cats[0]

    # Calibrate confidence score between 0.60 and 0.98
    if top_score > 0.08:
        calibrated_top_confidence = round(min(0.98, max(0.65, top_score)), 2)
    else:
        # Low match fallback
        top_cat = 'Shopping & Apparel' if request.type != 'income' else 'Salary'
        calibrated_top_confidence = 0.50

    # Build explanations for candidates
    candidates: List[CategoryCandidate] = []
    for rank, (cat, score) in enumerate(sorted_cats[:3]):
        cand_conf = round(min(0.98, max(0.20, score)), 2)
        if rank == 0:
            cand_conf = calibrated_top_confidence

        if matched_merchant_cat == cat and historical_reason:
            explanation = historical_reason
        elif cat in ['Salary', 'Consulting']:
            explanation = f"Matched income/compensation semantics for {cat}."
        elif cat == 'Food & Dining':
            explanation = "Matched grocery, dining, or restaurant keywords."
        elif cat == 'Transportation':
            explanation = "Matched fuel, transit, ride, or travel tokens."
        elif cat == 'Utilities & Subscriptions':
            explanation = "Matched recurring utility, telecom, or digital subscription patterns."
        elif cat == 'Shopping & Apparel':
            explanation = "Matched retail, consumer electronics, or merchandise patterns."
        elif cat == 'Healthcare & Wellness':
            explanation = "Matched pharmacy, medical, fitness, or healthcare terminology."
        elif cat == 'Entertainment':
            explanation = "Matched leisure, gaming, ticket, or entertainment tokens."
        elif cat == 'Housing & Rent':
            explanation = "Matched rent, property, or residential lease keywords."
        else:
            explanation = f"Statistically aligned with {cat} spend profile."

        candidates.append(CategoryCandidate(
            category=cat,
            confidence=cand_conf,
            explanation=explanation
        ))

    # Overall explanation
    if matched_merchant_cat == top_cat and historical_reason:
        final_explanation = historical_reason
    else:
        final_explanation = f"TF-IDF semantic analysis classified '{request.description}' as {top_cat} with {int(calibrated_top_confidence * 100)}% confidence."

    return CategorizeResponse(
        predicted_category=top_cat,
        confidence=calibrated_top_confidence,
        is_high_confidence=(calibrated_top_confidence >= 0.75),
        explanation=final_explanation,
        candidates=candidates,
        model_used="FinSight-TFIDF-UserMemory-Classifier-v1"
    )
