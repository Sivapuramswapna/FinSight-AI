import logging
from sqlalchemy.orm import Session
from app.database.session import engine, Base, SessionLocal
from app.models.models import User, Category, Transaction, Budget, Goal, Notification
from app.core.security import hash_password

logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    {"name": "Housing & Rent", "type": "expense", "icon": "home", "color": "#6366F1"},
    {"name": "Food & Dining", "type": "expense", "icon": "shopping-bag", "color": "#10B981"},
    {"name": "Transportation", "type": "expense", "icon": "lightning-bolt", "color": "#3B82F6"},
    {"name": "Utilities & Subscriptions", "type": "expense", "icon": "credit-card", "color": "#F59E0B"},
    {"name": "Shopping & Apparel", "type": "expense", "icon": "shopping-bag", "color": "#EC4899"},
    {"name": "Healthcare & Wellness", "type": "expense", "icon": "heart", "color": "#14B8A6"},
    {"name": "Entertainment", "type": "expense", "icon": "film", "color": "#8B5CF6"},
    {"name": "Salary", "type": "income", "icon": "cash", "color": "#10B981"},
    {"name": "Consulting", "type": "income", "icon": "briefcase", "color": "#6366F1"},
    {"name": "Investments & Dividends", "type": "income", "icon": "trending-up", "color": "#14B8A6"}
]

DEMO_TRANSACTIONS = [
    # September 2026
    {"merchant": "Apple Store", "description": "App Store Cloud Subscription", "category": "Utilities & Subscriptions", "subcategory": "Software", "type": "expense", "amount": 14.99, "date": "2026-09-19", "payment_method": "Apple Pay", "is_anomaly": False, "notes": "Monthly iCloud storage"},
    {"merchant": "Stripe Inc.", "description": "Consulting Retainer Payout", "category": "Consulting", "subcategory": "Consulting", "type": "income", "amount": 3200.00, "date": "2026-09-18", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "Q3 Enterprise Architecture Retainer"},
    {"merchant": "Whole Foods Market", "description": "Weekly Organic Groceries", "category": "Food & Dining", "subcategory": "Groceries", "type": "expense", "amount": 142.80, "date": "2026-09-17", "payment_method": "Credit Card", "is_anomaly": False, "notes": "Household groceries"},
    {"merchant": "Tesla Supercharger", "description": "EV Fast Charging Session", "category": "Transportation", "subcategory": "Charging", "type": "expense", "amount": 28.50, "date": "2026-09-16", "payment_method": "Credit Card", "is_anomaly": False, "notes": "Highway supercharger"},
    {"merchant": "Amazon Marketplace", "description": "Ergonomic Desk Accessories", "category": "Shopping & Apparel", "subcategory": "Home Office", "type": "expense", "amount": 189.90, "date": "2026-09-15", "payment_method": "Credit Card", "is_anomaly": True, "anomaly_score": 0.82, "notes": "Unusual spending bump detected"},
    {"merchant": "Apex Tech Corp", "description": "Bi-weekly Payroll Salary", "category": "Salary", "subcategory": "Salary", "type": "income", "amount": 4500.00, "date": "2026-09-15", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "Regular bi-weekly salary"},
    {"merchant": "Uber Eats", "description": "Weekend Family Dinner Delivery", "category": "Food & Dining", "subcategory": "Restaurants", "type": "expense", "amount": 78.40, "date": "2026-09-13", "payment_method": "Apple Pay", "is_anomaly": False, "notes": "Saturday dinner delivery"},
    {"merchant": "Chevron Gas", "description": "Fuel & Convenience Stop", "category": "Transportation", "subcategory": "Fuel", "type": "expense", "amount": 46.20, "date": "2026-09-11", "payment_method": "Debit Card", "is_anomaly": False, "notes": "Regular fuel fill"},
    {"merchant": "Vanguard Index Fund", "description": "Quarterly Dividend Distribution", "category": "Investments & Dividends", "subcategory": "Dividends", "type": "income", "amount": 480.00, "date": "2026-09-08", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "Q3 ETF Dividend"},
    {"merchant": "Metro Property Group", "description": "Monthly Residential Lease Payment", "category": "Housing & Rent", "subcategory": "Rent", "type": "expense", "amount": 1800.00, "date": "2026-09-01", "payment_method": "Bank Wire / ACH", "is_anomaly": False, "notes": "Primary apartment lease"},
    {"merchant": "Apex Tech Corp", "description": "Bi-weekly Payroll Salary", "category": "Salary", "subcategory": "Salary", "type": "income", "amount": 4500.00, "date": "2026-09-01", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "First half salary"},
    # August 2026
    {"merchant": "Metro Property Group", "description": "Monthly Residential Lease Payment", "category": "Housing & Rent", "subcategory": "Rent", "type": "expense", "amount": 1800.00, "date": "2026-08-01", "payment_method": "Bank Wire / ACH", "is_anomaly": False, "notes": "Primary apartment lease"},
    {"merchant": "Apex Tech Corp", "description": "Monthly Salary Combined", "category": "Salary", "subcategory": "Salary", "type": "income", "amount": 9000.00, "date": "2026-08-15", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "August payroll"},
    {"merchant": "Stripe Inc.", "description": "Consulting Payout", "category": "Consulting", "subcategory": "Consulting", "type": "income", "amount": 2200.00, "date": "2026-08-20", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "Advisory retainer"},
    {"merchant": "Trader Joe's", "description": "Monthly Grocery Run", "category": "Food & Dining", "subcategory": "Groceries", "type": "expense", "amount": 620.00, "date": "2026-08-14", "payment_method": "Credit Card", "is_anomaly": False, "notes": "Groceries"},
    {"merchant": "Delta Airlines", "description": "Client Flight Tickets", "category": "Transportation", "subcategory": "Flights", "type": "expense", "amount": 450.00, "date": "2026-08-18", "payment_method": "Credit Card", "is_anomaly": False, "notes": "Tech summit flight"},
    # July 2026
    {"merchant": "Metro Property Group", "description": "Monthly Residential Lease Payment", "category": "Housing & Rent", "subcategory": "Rent", "type": "expense", "amount": 1800.00, "date": "2026-07-01", "payment_method": "Bank Wire / ACH", "is_anomaly": False, "notes": "Primary apartment lease"},
    {"merchant": "Apex Tech Corp", "description": "Monthly Salary Combined", "category": "Salary", "subcategory": "Salary", "type": "income", "amount": 9000.00, "date": "2026-07-15", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "July payroll"},
    {"merchant": "Nordstrom", "description": "Summer Wardrobe Refresh", "category": "Shopping & Apparel", "subcategory": "Clothing", "type": "expense", "amount": 410.00, "date": "2026-07-22", "payment_method": "Credit Card", "is_anomaly": False, "notes": "Clothing apparel"},
    # June 2026
    {"merchant": "Metro Property Group", "description": "Monthly Residential Lease Payment", "category": "Housing & Rent", "subcategory": "Rent", "type": "expense", "amount": 1800.00, "date": "2026-06-01", "payment_method": "Bank Wire / ACH", "is_anomaly": False, "notes": "Primary apartment lease"},
    {"merchant": "Apex Tech Corp", "description": "Monthly Salary Combined", "category": "Salary", "subcategory": "Salary", "type": "income", "amount": 9000.00, "date": "2026-06-15", "payment_method": "Direct Deposit", "is_anomaly": False, "notes": "June payroll"},
    {"merchant": "Apple Store", "description": "New iPad Pro for Work", "category": "Shopping & Apparel", "subcategory": "Hardware", "type": "expense", "amount": 1199.00, "date": "2026-06-25", "payment_method": "Credit Card", "is_anomaly": True, "anomaly_score": 0.89, "notes": "Work hardware upgrade"}
]


def init_db():
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Seed Categories if empty
        existing_categories = db.query(Category).first()
        if not existing_categories:
            logger.info("Seeding default categories...")
            for cat in DEFAULT_CATEGORIES:
                db.add(Category(
                    name=cat["name"],
                    type=cat["type"],
                    icon=cat["icon"],
                    color=cat["color"],
                    is_default=True
                ))
            db.commit()

        # 2. Seed Demo User if not existing
        demo_email = "alex.reynolds@example.com"
        demo_user = db.query(User).filter(User.email == demo_email).first()
        if not demo_user:
            logger.info("Seeding demo user...")
            demo_user = User(
                email=demo_email,
                hashed_password=hash_password("password123"),
                full_name="Alex Reynolds",
                currency="USD",
                role="admin",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Seed demo transactions for user
            for tx in DEMO_TRANSACTIONS:
                db.add(Transaction(
                    user_id=demo_user.id,
                    amount=tx["amount"],
                    type=tx["type"],
                    category=tx["category"],
                    subcategory=tx.get("subcategory"),
                    description=tx["description"],
                    date=tx["date"],
                    payment_method=tx.get("payment_method"),
                    merchant=tx.get("merchant"),
                    notes=tx.get("notes"),
                    is_anomaly=tx.get("is_anomaly", False),
                    anomaly_score=tx.get("anomaly_score", 0.0)
                ))

            # Seed active monthly budget
            db.add(Budget(
                user_id=demo_user.id,
                category="Food & Dining",
                monthly_limit=1000.0,
                spent=880.0,
                month=9,
                year=2026,
                alert_threshold=80.0
            ))

            # Seed savings goal
            db.add(Goal(
                user_id=demo_user.id,
                name="Emergency Reserve Fund",
                target_amount=50000.0,
                current_amount=42500.0,
                target_date="2026-12-31",
                monthly_contribution=1500.0,
                status="in_progress"
            ))

            # Seed demo notification
            db.add(Notification(
                user_id=demo_user.id,
                title="Budget Warning",
                message="Food & Dining has reached 88% of your $1,000 monthly limit.",
                type="budget_exceeded"
            ))

            db.commit()
            logger.info("Demo user and sample financial records seeded successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
