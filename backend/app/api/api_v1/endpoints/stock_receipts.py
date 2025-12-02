"""
Stock Receipt API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.stock_receipt_service import StockReceiptService
from app.schemas.stock_receipt import (
    StockReceiptCreate,
    StockReceiptUpdate,
    StockReceiptResponse,
    StockReceiptListResponse,
    StockReceiptItemResponse
)

router = APIRouter()


@router.post("", response_model=StockReceiptResponse)
def create_stock_receipt(
    receipt_data: StockReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new stock receipt (Admin/Staff only)"""
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        receipt = StockReceiptService.create_receipt(db, receipt_data, current_user.id)
        
        # Build response with creator name and product details
        response = StockReceiptResponse.from_orm(receipt)
        response.creator_name = receipt.creator.full_name if receipt.creator else None
        
        # Add product details to items
        response.items = [
            StockReceiptItemResponse(
                **{
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None,
                    "product_sku": item.product.sku if item.product else None
                }
            )
            for item in receipt.items
        ]
        
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=StockReceiptListResponse)
def get_stock_receipts(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of stock receipts with pagination (Admin/Staff only)"""
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    skip = (page - 1) * size
    receipts, total = StockReceiptService.get_receipts(db, skip, size, status, search)
    
    # Build response list
    receipt_responses = []
    for receipt in receipts:
        response = StockReceiptResponse.from_orm(receipt)
        response.creator_name = receipt.creator.full_name if receipt.creator else None
        
        # Add product details to items
        response.items = [
            StockReceiptItemResponse(
                **{
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None,
                    "product_sku": item.product.sku if item.product else None
                }
            )
            for item in receipt.items
        ]
        
        receipt_responses.append(response)
    
    return StockReceiptListResponse(
        receipts=receipt_responses,
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0
    )


@router.get("/{receipt_id}", response_model=StockReceiptResponse)
def get_stock_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get stock receipt by ID (Admin/Staff only)"""
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    receipt = StockReceiptService.get_receipt(db, receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    # Build response
    response = StockReceiptResponse.from_orm(receipt)
    response.creator_name = receipt.creator.full_name if receipt.creator else None
    
    # Add product details to items
    response.items = [
        StockReceiptItemResponse(
            **{
                **item.__dict__,
                "product_name": item.product.name if item.product else None,
                "product_sku": item.product.sku if item.product else None
            }
        )
        for item in receipt.items
    ]
    
    return response


@router.put("/{receipt_id}", response_model=StockReceiptResponse)
def update_stock_receipt(
    receipt_id: int,
    receipt_data: StockReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update stock receipt (Admin/Staff only, only DRAFT status)"""
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        receipt = StockReceiptService.update_receipt(db, receipt_id, receipt_data)
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        # Build response
        response = StockReceiptResponse.from_orm(receipt)
        response.creator_name = receipt.creator.full_name if receipt.creator else None
        
        # Add product details to items
        response.items = [
            StockReceiptItemResponse(
                **{
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None,
                    "product_sku": item.product.sku if item.product else None
                }
            )
            for item in receipt.items
        ]
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{receipt_id}/confirm", response_model=StockReceiptResponse)
def confirm_stock_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm stock receipt and update product stock (Admin/Staff only)"""
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        receipt = StockReceiptService.confirm_receipt(db, receipt_id)
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        # Build response
        response = StockReceiptResponse.from_orm(receipt)
        response.creator_name = receipt.creator.full_name if receipt.creator else None
        
        # Add product details to items
        response.items = [
            StockReceiptItemResponse(
                **{
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None,
                    "product_sku": item.product.sku if item.product else None
                }
            )
            for item in receipt.items
        ]
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{receipt_id}/cancel", response_model=StockReceiptResponse)
def cancel_stock_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel stock receipt (Admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        receipt = StockReceiptService.cancel_receipt(db, receipt_id)
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        # Build response
        response = StockReceiptResponse.from_orm(receipt)
        response.creator_name = receipt.creator.full_name if receipt.creator else None
        
        # Add product details to items
        response.items = [
            StockReceiptItemResponse(
                **{
                    **item.__dict__,
                    "product_name": item.product.name if item.product else None,
                    "product_sku": item.product.sku if item.product else None
                }
            )
            for item in receipt.items
        ]
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{receipt_id}")
def delete_stock_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete stock receipt (Admin only, only DRAFT status)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        success = StockReceiptService.delete_receipt(db, receipt_id)
        if not success:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        return {"message": "Receipt deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
