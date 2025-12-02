"""
Stock Receipt Service
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.models.stock_receipt import StockReceipt, StockReceiptItem, StockReceiptStatus
from app.models.product import Product
from app.schemas.stock_receipt import StockReceiptCreate, StockReceiptUpdate


class StockReceiptService:
    """Service for managing stock receipts"""

    @staticmethod
    def generate_receipt_code(db: Session) -> str:
        """Generate unique receipt code"""
        # Format: PN-YYYYMMDD-XXX
        today = datetime.utcnow().strftime("%Y%m%d")
        prefix = f"PN-{today}"
        
        # Count receipts today
        count = db.query(StockReceipt).filter(
            StockReceipt.receipt_code.like(f"{prefix}%")
        ).count()
        
        return f"{prefix}-{count + 1:03d}"

    @staticmethod
    def create_receipt(
        db: Session,
        receipt_data: StockReceiptCreate,
        user_id: int
    ) -> StockReceipt:
        """Create new stock receipt"""
        # Generate receipt code
        receipt_code = StockReceiptService.generate_receipt_code(db)
        
        # Calculate total
        total_amount = sum(
            Decimal(str(item.quantity)) * item.unit_price
            for item in receipt_data.items
        )
        
        # Create receipt
        receipt = StockReceipt(
            receipt_code=receipt_code,
            supplier_name=receipt_data.supplier_name,
            supplier_phone=receipt_data.supplier_phone,
            supplier_address=receipt_data.supplier_address,
            notes=receipt_data.notes,
            total_amount=total_amount,
            status=StockReceiptStatus.DRAFT,
            created_by=user_id
        )
        
        db.add(receipt)
        db.flush()
        
        # Create items
        for item_data in receipt_data.items:
            subtotal = Decimal(str(item_data.quantity)) * item_data.unit_price
            item = StockReceiptItem(
                receipt_id=receipt.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                subtotal=subtotal,
                notes=item_data.notes
            )
            db.add(item)
        
        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def get_receipt(db: Session, receipt_id: int) -> Optional[StockReceipt]:
        """Get stock receipt by ID"""
        return db.query(StockReceipt).filter(StockReceipt.id == receipt_id).first()

    @staticmethod
    def get_receipts(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[StockReceipt], int]:
        """Get list of stock receipts with pagination"""
        query = db.query(StockReceipt)
        
        # Filter by status
        if status and status != "all":
            query = query.filter(StockReceipt.status == status)
        
        # Search by receipt code or supplier name
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (StockReceipt.receipt_code.ilike(search_pattern)) |
                (StockReceipt.supplier_name.ilike(search_pattern))
            )
        
        # Get total count
        total = query.count()
        
        # Get paginated results
        receipts = query.order_by(desc(StockReceipt.created_at)).offset(skip).limit(limit).all()
        
        return receipts, total

    @staticmethod
    def update_receipt(
        db: Session,
        receipt_id: int,
        receipt_data: StockReceiptUpdate
    ) -> Optional[StockReceipt]:
        """Update stock receipt (only if status is DRAFT)"""
        receipt = db.query(StockReceipt).filter(StockReceipt.id == receipt_id).first()
        
        if not receipt:
            return None
        
        if receipt.status != StockReceiptStatus.DRAFT:
            raise ValueError("Only draft receipts can be updated")
        
        # Update basic fields
        if receipt_data.supplier_name is not None:
            receipt.supplier_name = receipt_data.supplier_name
        if receipt_data.supplier_phone is not None:
            receipt.supplier_phone = receipt_data.supplier_phone
        if receipt_data.supplier_address is not None:
            receipt.supplier_address = receipt_data.supplier_address
        if receipt_data.notes is not None:
            receipt.notes = receipt_data.notes
        
        # Update items if provided
        if receipt_data.items is not None:
            # Delete old items
            db.query(StockReceiptItem).filter(
                StockReceiptItem.receipt_id == receipt_id
            ).delete()
            
            # Create new items
            total_amount = Decimal(0)
            for item_data in receipt_data.items:
                subtotal = Decimal(str(item_data.quantity)) * item_data.unit_price
                total_amount += subtotal
                
                item = StockReceiptItem(
                    receipt_id=receipt.id,
                    product_id=item_data.product_id,
                    quantity=item_data.quantity,
                    unit_price=item_data.unit_price,
                    subtotal=subtotal,
                    notes=item_data.notes
                )
                db.add(item)
            
            receipt.total_amount = total_amount
        
        receipt.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def confirm_receipt(db: Session, receipt_id: int) -> Optional[StockReceipt]:
        """Confirm stock receipt and update product stock"""
        receipt = db.query(StockReceipt).filter(StockReceipt.id == receipt_id).first()
        
        if not receipt:
            return None
        
        if receipt.status != StockReceiptStatus.DRAFT:
            raise ValueError("Only draft receipts can be confirmed")
        
        # Update receipt status
        receipt.status = StockReceiptStatus.CONFIRMED
        receipt.confirmed_at = datetime.utcnow()
        
        # Update product stock
        for item in receipt.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock = (product.stock or 0) + item.quantity
        
        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def cancel_receipt(db: Session, receipt_id: int) -> Optional[StockReceipt]:
        """Cancel stock receipt"""
        receipt = db.query(StockReceipt).filter(StockReceipt.id == receipt_id).first()
        
        if not receipt:
            return None
        
        if receipt.status == StockReceiptStatus.COMPLETED:
            raise ValueError("Completed receipts cannot be cancelled")
        
        receipt.status = StockReceiptStatus.CANCELLED
        receipt.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(receipt)
        return receipt

    @staticmethod
    def delete_receipt(db: Session, receipt_id: int) -> bool:
        """Delete stock receipt (only if status is DRAFT)"""
        receipt = db.query(StockReceipt).filter(StockReceipt.id == receipt_id).first()
        
        if not receipt:
            return False
        
        if receipt.status != StockReceiptStatus.DRAFT:
            raise ValueError("Only draft receipts can be deleted")
        
        db.delete(receipt)
        db.commit()
        return True
