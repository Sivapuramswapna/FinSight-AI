import math
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.models.models import Transaction, Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def list_transactions(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    category: Optional[str] = None,
    type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = "date",
    sort_order: str = "desc",
    page: int = 1,
    size: int = 20
):
    query = db.query(Transaction).filter(Transaction.user_id == user_id)

    # 1. Type filter ('income' or 'expense')
    if type and type.lower() != "all":
        query = query.filter(Transaction.type == type.lower())

    # 2. Category filter
    if category and category.lower() != "all":
        query = query.filter(Transaction.category == category)

    # 3. Date range filters
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)

    # 4. Search across description, merchant, category, notes
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_pattern),
                Transaction.merchant.ilike(search_pattern),
                Transaction.category.ilike(search_pattern),
                Transaction.notes.ilike(search_pattern)
            )
        )

    total = query.count()

    # 5. Sorting
    sort_col = getattr(Transaction, sort_by if hasattr(Transaction, sort_by) else "date")
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    # 6. Pagination
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    pages = math.ceil(total / size) if size > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }


def get_transaction(db: Session, user_id: int, transaction_id: int) -> Optional[Transaction]:
    return db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()


def create_transaction(db: Session, user_id: int, tx_in: TransactionCreate) -> Transaction:
    db_tx = Transaction(
        user_id=user_id,
        amount=tx_in.amount,
        type=tx_in.type.lower(),
        category=tx_in.category,
        subcategory=tx_in.subcategory,
        description=tx_in.description,
        date=tx_in.date,
        payment_method=tx_in.payment_method,
        merchant=tx_in.merchant,
        notes=tx_in.notes,
        is_anomaly=False,
        anomaly_score=0.0
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx


def update_transaction(
    db: Session,
    user_id: int,
    transaction_id: int,
    tx_in: TransactionUpdate
) -> Optional[Transaction]:
    db_tx = get_transaction(db, user_id, transaction_id)
    if not db_tx:
        return None

    update_data = tx_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "type" and value:
            setattr(db_tx, field, value.lower())
        else:
            setattr(db_tx, field, value)

    db.commit()
    db.refresh(db_tx)
    return db_tx


def delete_transaction(db: Session, user_id: int, transaction_id: int) -> bool:
    db_tx = get_transaction(db, user_id, transaction_id)
    if not db_tx:
        return False

    db.delete(db_tx)
    db.commit()
    return True


def list_categories(db: Session, user_id: int):
    # Returns system defaults or custom user categories
    return db.query(Category).filter(
        or_(Category.is_default == True, Category.user_id == user_id)
    ).order_by(Category.name).all()
