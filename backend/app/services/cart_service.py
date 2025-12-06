"""
Cart Service
"""
from sqlalchemy.orm import Session
from typing import Optional

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.collection import Collection
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse, CartSummary, CollectionAddToCart
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
            if item.collection_id:
                # Combo item - use collection's sale_price
                if item.collection.sale_price:
                    subtotal += item.collection.sale_price * item.quantity
                else:
                    # Fallback: sum product prices
                    for coll_item in item.collection.items:
                        price = coll_item.product.sale_price if coll_item.product.sale_price else coll_item.product.price
                        subtotal += price * coll_item.quantity * item.quantity
                total_items += item.quantity
            else:
                # Regular product item
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
        
        # CRITICAL: Check is_collection flag first to prevent ID collision
        # If is_collection is True, OR if collection_id is provided, treat as collection
        if data.is_collection or data.collection_id:
            # Determine collection ID - prefer collection_id, fallback to product_id
            collection_id = data.collection_id if data.collection_id else data.product_id
            
            if not collection_id:
                raise BadRequestException("Collection ID is required")
                
            # Adding collection/combo - use add_collection method
            return CartService.add_collection(db, user_id, collection_id, CollectionAddToCart(quantity=data.quantity))
            
        # Otherwise, treat as regular product
        if not data.product_id:
            raise BadRequestException("Product ID is required")
            
        # Adding regular product
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise NotFoundException("Product not found")
        
        if not product.is_active:
            raise BadRequestException("Product is not available")
        
        # Check stock availability
        if product.stock < data.quantity:
            raise BadRequestException(f"Insufficient stock. Available: {product.stock}")
        
        # Check if item already exists in cart
        # CRITICAL: Also check is_collection to prevent Product ID 1 from matching Collection ID 1
        existing_item = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == data.product_id,
            CartItem.is_collection == False
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
                is_collection=False,
                quantity=data.quantity
            )
            db.add(cart_item)
            db.commit()
            db.refresh(cart)
        
        return cart
    
    @staticmethod
    def add_collection(db: Session, user_id: int, collection_id: int, data: CollectionAddToCart) -> CartResponse:
        """Add collection/combo to cart as a single item"""
        cart = CartService.get_or_create_cart(db, user_id)
        
        # Check if collection exists and is active
        collection = db.query(Collection).filter(Collection.id == collection_id).first()
        if not collection:
            raise NotFoundException("Collection not found")
        
        if not collection.is_active:
            raise BadRequestException("Collection is not available")
        
        # Validate collection has items
        if not collection.items or len(collection.items) == 0:
            raise BadRequestException("Collection has no products")
        
        # Check stock for all products in the combo
        for item in collection.items:
            # Ensure product exists
            if not item.product:
                raise BadRequestException(f"Product with ID {item.product_id} not found in collection")
            
            # Check if product is active
            if not item.product.is_active:
                raise BadRequestException(f"{item.product.name} is not available")
            
            # Check stock
            required_stock = item.quantity * data.quantity
            if item.product.stock < required_stock:
                raise BadRequestException(
                    f"Insufficient stock for {item.product.name}. "
                    f"Required: {required_stock}, Available: {item.product.stock}"
                )
        
        # Check if combo already exists in cart
        # CRITICAL: Check is_collection flag to differentiate from products
        existing_item = db.query(CartItem).filter(
            CartItem.cart_id == cart.id,
            CartItem.collection_id == collection_id,
            CartItem.is_collection == True
        ).first()
        
        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + data.quantity
            
            # Re-check stock for new quantity
            for item in collection.items:
                if not item.product:
                    raise BadRequestException(f"Product with ID {item.product_id} not found")
                
                required_stock = item.quantity * new_quantity
                if item.product.stock < required_stock:
                    raise BadRequestException(
                        f"Insufficient stock for {item.product.name}. "
                        f"Required: {required_stock}, Available: {item.product.stock}"
                    )
            
            existing_item.quantity = new_quantity
            db.commit()
            db.refresh(cart)
        else:
            # Create new cart item for combo
            cart_item = CartItem(
                cart_id=cart.id,
                collection_id=collection_id,
                is_collection=True,  # CRITICAL: Mark as collection
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
        
        # Check stock availability based on type
        if cart_item.product_id:
            # Regular product
            if not cart_item.product:
                raise BadRequestException("Product not found")
            if cart_item.product.stock < data.quantity:
                raise BadRequestException(f"Insufficient stock. Available: {cart_item.product.stock}")
        elif cart_item.collection_id:
            # Combo - check all products in combo
            if not cart_item.collection:
                raise BadRequestException("Collection not found")
            for item in cart_item.collection.items:
                if not item.product:
                    raise BadRequestException(f"Product with ID {item.product_id} not found")
                required_stock = item.quantity * data.quantity
                if item.product.stock < required_stock:
                    raise BadRequestException(
                        f"Insufficient stock for {item.product.name}. "
                        f"Required: {required_stock}, Available: {item.product.stock}"
                    )
        
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
