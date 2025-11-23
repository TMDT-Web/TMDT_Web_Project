# 🐛 Backend Logic Issues Report

**Date:** November 22, 2025  
**Severity:** CRITICAL  
**Status:** 🔴 MULTIPLE CRITICAL BUGS FOUND

---

## 🚨 Critical Issues Found

### Bug #12: Race Condition in Stock Management (CRITICAL) ⚠️⚠️⚠️
**Location:** `app/services/order_service.py` - `create_order()` method  
**Severity:** CRITICAL - Can cause overselling  

**Issue:**
```python
# Line 26-29: Check stock
if product.stock < item_data.quantity:
    raise BadRequestException(f"Insufficient stock for product {product.name}")

# Line 80-84: Update stock (MUCH LATER)
product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
product.stock -= item_data["quantity"]
```

**Problem:**
1. **Time Gap:** Stock check và stock update cách nhau ~50 lines code
2. **No Locking:** Không có pessimistic locking (SELECT FOR UPDATE)
3. **Race Condition:** 2 users order cùng lúc có thể vượt stock

**Scenario:**
```
Stock = 1
User A checks: stock(1) >= quantity(1) ✅ PASS
User B checks: stock(1) >= quantity(1) ✅ PASS (still 1!)
User A updates: stock = 0
User B updates: stock = -1 ❌ OVERSOLD!
```

**Impact:**
- ❌ Overselling products (bán vượt kho)
- ❌ Negative stock values
- ❌ Customer service nightmare
- ❌ Financial loss

**Fix Required:**
```python
# Use pessimistic locking
product = db.query(Product)\
    .filter(Product.id == item_data.product_id)\
    .with_for_update()\
    .first()

if product.stock < item_data.quantity:
    raise BadRequestException(f"Insufficient stock")

# Update immediately in same transaction
product.stock -= item_data.quantity
```

---

### Bug #13: No Transaction Rollback on Error (CRITICAL) ⚠️⚠️
**Location:** All service files  
**Severity:** CRITICAL - Data corruption risk  

**Issue:** No try-except blocks around database operations

**Problem Files:**
- `order_service.py`: No rollback if order item creation fails
- `product_service.py`: No rollback on errors
- `auth_service.py`: No rollback on errors
- `address_service.py`: No rollback on errors
- `loyalty_service.py`: No rollback on errors

**Example from order_service.py:**
```python
def create_order(db: Session, user_id: int, data: OrderCreate) -> Order:
    # ... lots of operations ...
    db.add(order)
    db.flush()
    
    # If this fails, order is created but items are not!
    for item_data in order_items_data:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)
    
    # If this fails, stock is already updated!
    product.stock -= item_data["quantity"]
    
    db.commit()  # No try-except!
```

**Impact:**
- ❌ Partial orders (order without items)
- ❌ Stock deducted but order fails
- ❌ Database inconsistency
- ❌ No error recovery

**Fix Required:**
```python
try:
    # ... operations ...
    db.commit()
    db.refresh(order)
    return order
except Exception as e:
    db.rollback()
    logger.error(f"Order creation failed: {e}")
    raise BadRequestException("Failed to create order")
```

---

### Bug #14: Missing Payment Validation (CRITICAL) ⚠️⚠️
**Location:** `app/api/api_v1/endpoints/payments.py`  
**Severity:** CRITICAL - Payment fraud risk  

**Issue:** No amount validation before payment

**Problem:**
```python
@router.post("/momo/create")
async def create_momo_payment(order_id: int, ...):
    order = OrderService.get_order_by_id(db, order_id)
    
    # ❌ No check if order already paid!
    # ❌ No check if order is in correct status!
    
    payment_data = await PaymentService.create_momo_payment(
        order_id=order.id,
        amount=order.total_amount,  # ❌ No validation
        ...
    )
```

**Exploits:**
1. **Double Payment:** User can pay same order multiple times
2. **Already Paid:** Can create payment for paid orders
3. **Cancelled Orders:** Can pay for cancelled orders
4. **Amount Tampering:** No verification of amount

**Impact:**
- ❌ Double charging customers
- ❌ Payment fraud
- ❌ Financial discrepancies
- ❌ Angry customers

**Fix Required:**
```python
# Check order status
if order.status == OrderStatus.CANCELLED:
    raise BadRequestException("Cannot pay for cancelled order")

if order.is_paid:
    raise BadRequestException("Order already paid")

if order.status not in [OrderStatus.PENDING, OrderStatus.AWAITING_PAYMENT]:
    raise BadRequestException("Order not in payable status")
```

---

### Bug #15: Payment Notification Race Condition (HIGH) ⚠️
**Location:** `payments.py` - `momo_payment_notify()` and `vnpay_payment_return()`  
**Severity:** HIGH - Duplicate processing  

**Issue:** No idempotency check for payment callbacks

**Problem:**
```python
@router.post("/momo/notify")
async def momo_payment_notify(...):
    # ❌ No check if already processed!
    if data.get("resultCode") == 0:
        order.is_paid = True
        order.status = OrderStatus.CONFIRMED
        db.commit()
```

**Scenario:**
- Payment gateway sends notification multiple times
- Network retry causes duplicate calls
- Both calls process → duplicate loyalty points, duplicate emails, etc.

**Impact:**
- ❌ Duplicate loyalty points awarded
- ❌ Multiple email notifications
- ❌ Inconsistent order status
- ❌ Audit log pollution

**Fix Required:**
```python
# Add transaction_id field to orders
# Check if already processed
if order.transaction_id == data.get("transId"):
    return {"resultCode": 0, "message": "Already processed"}

order.transaction_id = data.get("transId")
order.is_paid = True
db.commit()
```

---

### Bug #16: Missing Stock Restoration on Order Cancellation (HIGH) ⚠️
**Location:** `order_service.py` - `update_order()`  
**Severity:** HIGH - Stock management issue  

**Issue:** Stock is not restored when order is cancelled

**Problem:**
```python
def update_order(db: Session, order_id: int, data: OrderUpdate) -> Order:
    old_status = order.status
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    # ❌ No stock restoration logic!
    # If status changes to CANCELLED, stock should be restored
    
    db.commit()
```

**Impact:**
- ❌ Lost inventory
- ❌ Products appear out of stock when they're not
- ❌ Revenue loss
- ❌ Manual inventory corrections needed

**Fix Required:**
```python
# Check if order is being cancelled
if (old_status != OrderStatus.CANCELLED and 
    order.status == OrderStatus.CANCELLED):
    # Restore stock for all items
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity
```

---

### Bug #17: Insufficient Input Validation (MEDIUM) ⚠️
**Location:** Multiple endpoints  
**Severity:** MEDIUM - Security/UX issue  

**Issues:**
1. **Order Creation:** No validation for empty items list
2. **Deposit Amount:** Can be negative (despite DB constraint)
3. **Phone Numbers:** No format validation
4. **Shipping Address:** No length validation

**Example:**
```python
# ❌ Can create order with 0 items
data: OrderCreate
if not data.items or len(data.items) == 0:
    raise BadRequestException("Order must have at least one item")

# ❌ Negative deposit (will fail at DB, but should fail earlier)
if data.deposit_amount and data.deposit_amount < 0:
    raise BadRequestException("Deposit cannot be negative")

# ❌ Deposit > total (will fail at DB, but should fail earlier)
if data.deposit_amount and data.deposit_amount > total_amount:
    raise BadRequestException("Deposit cannot exceed total amount")
```

---

### Bug #18: Missing Authentication in Payment Notifications (MEDIUM) ⚠️
**Location:** `payments.py` - webhook endpoints  
**Severity:** MEDIUM - Security issue  

**Issue:** Payment notification endpoints are not authenticated

**Problem:**
```python
@router.post("/momo/notify")
async def momo_payment_notify(...):
    # ❌ No authentication dependency!
    # Anyone can call this endpoint
    
    # Only has signature verification
    if not PaymentService.verify_momo_signature(data):
        return {"resultCode": 1, "message": "Invalid signature"}
```

**Risk:**
- Signature verification is good, but...
- No rate limiting on webhook
- No IP whitelist check
- Potential DDoS on callback URL

**Fix Required:**
```python
# Add IP whitelist middleware
MOMO_IPS = ["210.245.0.0/16"]  # MoMo IP range
VNPAY_IPS = ["113.160.0.0/16"]  # VNPAY IP range

# Or at minimum, add signature check BEFORE processing
```

---

### Bug #19: Loyalty Points Awarded Before Payment (MEDIUM) ⚠️
**Location:** `order_service.py` - `update_order()`  
**Severity:** MEDIUM - Business logic error  

**Issue:** Points awarded when order status = COMPLETED, but not checking is_paid

**Problem:**
```python
if old_status != OrderStatus.COMPLETED and order.status == OrderStatus.COMPLETED:
    # ❌ No check if order is paid!
    user = db.query(User).filter(User.id == order.user_id).first()
    if user:
        LoyaltyService.add_points(db, user, order.total_amount)
```

**Scenario:**
- Admin marks order COMPLETED
- Customer hasn't paid yet (COD)
- Customer gets points
- Customer cancels order
- Free points exploit!

**Fix Required:**
```python
if (old_status != OrderStatus.COMPLETED and 
    order.status == OrderStatus.COMPLETED and 
    order.is_paid):  # ✅ Check payment!
    LoyaltyService.add_points(db, user, order.total_amount)
```

---

### Bug #20: No Duplicate Order Prevention (LOW) ⚠️
**Location:** `order_service.py` - `create_order()`  
**Severity:** LOW - UX issue  

**Issue:** User can accidentally create duplicate orders (double-click)

**Fix:** Add idempotency key or rate limiting

---

## 📊 Summary

| Bug # | Severity | Location | Impact |
|-------|----------|----------|--------|
| #12 | 🔴 CRITICAL | order_service | Overselling, negative stock |
| #13 | 🔴 CRITICAL | All services | Data corruption, partial operations |
| #14 | 🔴 CRITICAL | payments | Double payment, fraud risk |
| #15 | 🟠 HIGH | payments | Duplicate processing |
| #16 | 🟠 HIGH | order_service | Lost inventory |
| #17 | 🟡 MEDIUM | Multiple | Poor validation |
| #18 | 🟡 MEDIUM | payments | Security risk |
| #19 | 🟡 MEDIUM | order_service | Points fraud |
| #20 | 🟢 LOW | order_service | UX issue |

**Total:** 9 critical issues found

---

## 🔧 Priority Fixes

### Must Fix Before Production (P0):
1. ✅ Bug #12 - Add SELECT FOR UPDATE for stock
2. ✅ Bug #13 - Add try-except-rollback everywhere
3. ✅ Bug #14 - Add payment validation
4. ✅ Bug #16 - Add stock restoration on cancellation

### Should Fix Soon (P1):
5. ✅ Bug #15 - Add idempotency for webhooks
6. ✅ Bug #19 - Check is_paid before points

### Nice to Have (P2):
7. ✅ Bug #17 - Better input validation
8. ✅ Bug #18 - IP whitelist for webhooks
9. ✅ Bug #20 - Duplicate order prevention

---

## 🎯 Recommended Architecture Improvements

1. **Add Service Layer Transactions:**
   ```python
   from contextlib import contextmanager
   
   @contextmanager
   def transaction(db: Session):
       try:
           yield db
           db.commit()
       except Exception as e:
           db.rollback()
           raise
   ```

2. **Add Pessimistic Locking Helper:**
   ```python
   def get_product_for_update(db: Session, product_id: int):
       return db.query(Product)\
           .filter(Product.id == product_id)\
           .with_for_update()\
           .first()
   ```

3. **Add Payment State Machine:**
   ```python
   class OrderStateMachine:
       ALLOWED_TRANSITIONS = {
           OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
           OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
           # ...
       }
   ```

4. **Add Idempotency Middleware:**
   ```python
   @app.middleware("http")
   async def idempotency_middleware(request: Request, call_next):
       idempotency_key = request.headers.get("Idempotency-Key")
       # Check Redis cache, return cached response if exists
   ```

---

**Status:** 🔴 BLOCKING PRODUCTION DEPLOYMENT  
**Next Action:** Fix P0 issues immediately
