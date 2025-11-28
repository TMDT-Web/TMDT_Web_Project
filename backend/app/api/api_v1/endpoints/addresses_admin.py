from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin_user
from app.models.address import Address
from app.schemas.user import AddressResponse

router = APIRouter()


@router.get("/{user_id}", response_model=list[AddressResponse])
def admin_get_addresses(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    addresses = db.query(Address).filter(Address.user_id == user_id).all()
    return addresses
