from __future__ import annotations

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.payments import schemas
from app.payments.models import Payment
from app.users import dependencies as deps
from app.users.models import User

from . import router


@router.get("", response_model=list[schemas.PaymentRead])
def list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(deps.require_roles("admin", "root")),
) -> list[schemas.PaymentRead]:
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    return [schemas.PaymentRead.model_validate(payment) for payment in payments]
