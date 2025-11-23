"""
Cart Service
"""
from sqlalchemy.orm import Session
from typing import Optional

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse, CartSummary
from app.core.exceptions import NotFoundException, BadRequestException


class CartService:
    """Cart service"""
    
    @staticmethod
    def get_or_create_cart(db: Session, user_id: int) -> Cart:
        """Get or create cart for user"""
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        
        if not cart:
            cart = Cart(user_id=user_id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        
        return cart
    
    @staticmethod
    def get_cart(db: Session, user_id: int) -> CartResponse:
        """Get user's cart with items"""
        cart = CartService.get_or_create_cart(db, user_id)
        return cart
    
    @staticmethod
    def get_cart_summary(db: Session, user_id: int) -> CartSummary:
        """Get cart with calculated totals"""
        cart = CartService.get_or_create_cart(db, user_id)
        
        subtotal = 0.0
        total_items = 0
        
        for item in cart.items:
            # Use sale_price if available, otherwise use regular price
            price = item.product.sale_price if item.product.sale_price else item.product.price
            subtotal += price * item.quantity
            total_items += item.quantity
        
        return CartSummary(
            cart=cart,
            subtotal=subtotal,
            total_items=total_items
        )
    
    @staticmethod
    def add_item(db: Session, user_id: int, data: CartItemCreate) -> CartResponse:
        """Add item to cart or update quantity if already exists"""
        cart = CartService.get_or_create_cart(db, user_id)
        
        # Check if product exists and is active
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise NotFoundException("Product not found")
        
        if not product.is_active:
            raise BadRequestException("Product is not available")
        
        # Check stock availability
        if product.stock < data.quantity:
            raise BadRequestException(f"Insufficient stock. Available: {product.stock}")
        
        # Check if item already exists in cart
        existing_item = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == data.product_id
        ).first()
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + data.quantity
            
            # Check stock for new quantity
            if product.stock < new_quantity:
                raise BadRequestException(f"Insufficient stock. Available: {product.stock}")
            
            existing_item.quantity = new_quantity
            db.commit()
            db.refresh(cart)
        else:
            # Create new cart item
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=data.product_id,
                quantity=data.quantity
            )
            db.add(cart_item)
            db.commit()
            db.refresh(cart)
        
        return cart
    
    @staticmethod
    def update_item(db: Session, user_id: int, item_id: int, data: CartItemUpdate) -> CartResponse:
        """Update cart item quantity"""
        cart = CartService.get_or_create_cart(db, user_id)
        
        # Find cart item
        cart_item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id
        ).first()
        
        if not cart_item:
            raise NotFoundException("Cart item not found")
        
        # Check stock availability
        if cart_item.product.stock < data.quantity:
            raise BadRequestException(f"Insufficient stock. Available: {cart_item.product.stock}")
        
        # Update quantity
        cart_item.quantity = data.quantity
        db.commit()
        db.refresh(cart)
        
        return cart
    
    @staticmethod
    def remove_item(db: Session, user_id: int, item_id: int) -> CartResponse:
        """Remove item from cart"""
        cart = CartService.get_or_create_cart(db, user_id)
        
        # Find cart item
        cart_item = db.query(CartItem).filter(
            CartItem.id == item_id,
            CartItem.cart_id == cart.id
        ).first()
        
        if not cart_item:
            raise NotFoundException("Cart item not found")
        
        # Delete cart item
        db.delete(cart_item)
        db.commit()
        db.refresh(cart)
        
        return cart
    
    @staticmethod
    def clear_cart(db: Session, user_id: int) -> None:
        """Clear all items from cart"""
        cart = CartService.get_or_create_cart(db, user_id)
        
        # Delete all cart items
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
