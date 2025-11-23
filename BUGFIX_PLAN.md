# 🔧 BUGFIX & IMPLEMENTATION PLAN

**Ngày**: 22/11/2025  
**Trạng thái**: Database trống, các tính năng CRUD/Chat chưa hoạt động

---

## 📋 PHÂN TÍCH VẤN ĐỀ

### ✅ ĐÃ HOẠT ĐỘNG:
1. Frontend không còn crash (đã thêm `Array.isArray()` checks)
2. Backend API đầy đủ endpoints cho:
   - ✅ Products (GET, POST, PUT, DELETE)
   - ✅ Collections (GET, POST, PUT, DELETE)
   - ✅ Orders (GET, POST, PUT)
   - ✅ Cart (GET, POST, PUT, DELETE)
   - ✅ Upload (POST image, DELETE image)
   - ✅ Chat (WebSocket + REST)

### ❌ CHƯA HOẠT ĐỘNG:

#### 1. **Database Trống**
- Database `luxe_furniture` không tồn tại
- Seed script bị lỗi: `AttributeError: property 'is_admin' of 'User' object has no setter`
- Không có data để test

#### 2. **Categories - Thiếu UPDATE/DELETE**
```python
# Backend KHÔNG CÓ:
@router.put("/categories/{category_id}")   # ❌ Missing
@router.delete("/categories/{category_id}") # ❌ Missing
```
- Frontend vô hiệu hóa nút Sửa/Xóa
- Chỉ có thể CREATE

#### 3. **Chat System - Chưa Test**
- WebSocket endpoint có
- Frontend components có
- Nhưng chưa có user để test
- Database chat tables chưa tồn tại

#### 4. **Authentication Issues**
- Không có admin user
- Login/Register có thể chưa hoạt động
- JWT token handling cần verify

---

## 🎯 KẾ HOẠCH THỰC HIỆN (7 BƯỚC)

### **BƯỚC 1: FIX DATABASE & SEED DATA** ⭐ QUAN TRỌNG NHẤT

**File cần sửa**: `backend/scripts/seed_data.py`

**Lỗi hiện tại**:
```python
admin = User(
    email="admin@luxefurniture.com",
    is_admin=True,  # ❌ Không có setter
    ...
)
```

**Giải pháp**:
```python
# is_admin là computed property từ role
admin = User(
    email="admin@luxefurniture.com",
    role=UserRole.ADMIN,  # ✅ Đúng
    ...
)
```

**Công việc**:
- [ ] Sửa seed_data.py line 222
- [ ] Run migrations: `alembic upgrade head`
- [ ] Seed database: `python scripts/seed_data.py`
- [ ] Verify: Check products, categories, admin user

---

### **BƯỚC 2: THÊM CATEGORY UPDATE/DELETE ENDPOINTS**

**File cần sửa**: `backend/app/api/api_v1/endpoints/products.py`

**Code cần thêm**:
```python
@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update category (admin only)"""
    category = ProductService.update_category(db, category_id, data)
    return category

@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete category (admin only)"""
    ProductService.delete_category(db, category_id)
    return {"message": "Category deleted successfully"}
```

**File cần sửa**: `backend/app/services/product_service.py`

**Methods cần thêm**:
```python
@staticmethod
def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Category:
    """Update category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise NotFoundException("Category not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return category

@staticmethod
def delete_category(db: Session, category_id: int) -> None:
    """Delete category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise NotFoundException("Category not found")
    
    db.delete(category)
    db.commit()
```

**Công việc**:
- [ ] Thêm endpoints vào products.py
- [ ] Thêm methods vào product_service.py
- [ ] Regenerate OpenAPI client: `cd frontend && npm run generate-api`
- [ ] Restart backend

---

### **BƯỚC 3: UPDATE FRONTEND CATEGORY MANAGEMENT**

**File cần sửa**: `frontend/src/pages/admin/CategoryManage.tsx`

**Changes**:
```typescript
// Line 44: Enable edit
const handleEdit = (category: any) => {
  setEditingCategory(category)
  setFormData({
    name: category.name,
    slug: category.slug,
    description: category.description || ''
  })
  setImagePreview(category.image_url || '')
  setIsModalOpen(true)
}

// Line 91: Enable update logic
if (editingCategory) {
  await ProductsService.updateCategoryApiV1ProductsCategoriesCategoryIdPut(
    editingCategory.id,
    payload
  )
} else {
  await ProductsService.createCategoryApiV1ProductsCategoriesPost(payload as any)
}

// Line 109: Enable delete
const handleDelete = async (id: number) => {
  if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
  try {
    await ProductsService.deleteCategoryApiV1ProductsCategoriesCategoryIdDelete(id)
    refetch()
  } catch (error) {
    alert('Không thể xóa danh mục')
  }
}
```

**Công việc**:
- [ ] Xóa các dòng `alert('Chức năng chưa được hỗ trợ')`
- [ ] Implement handleEdit với setEditingCategory
- [ ] Implement handleDelete với API call
- [ ] Test create/update/delete

---

### **BƯỚC 4: FIX COLLECTION MANAGEMENT**

**Files đã có**:
- ✅ Backend: `endpoints/collections.py` (có đầy đủ PUT/DELETE)
- ✅ Frontend: `CollectionManage.tsx`

**Vấn đề**: Frontend CHƯA GỌI API UPDATE/DELETE

**File cần sửa**: `frontend/src/pages/admin/CollectionManage.tsx`

**Changes**:
```typescript
// Line 49: Enable edit
const handleEdit = (collection: any) => {
  setEditingCollection(collection)
  setFormData({
    name: collection.name,
    slug: collection.slug,
    description: collection.description || '',
    banner_url: collection.banner_url || '',
    is_active: collection.is_active
  })
  setBannerPreview(collection.banner_url || '')
  // TODO: Load selected products
  setIsModalOpen(true)
}

// Line 108: Enable update
if (editingCollection) {
  await CollectionsService.updateCollectionApiV1CollectionsCollectionIdPut(
    editingCollection.id,
    { ...payload, product_ids: selectedProducts }
  )
} else {
  await CollectionsService.createCollectionApiV1CollectionsPost(
    { ...payload, product_ids: selectedProducts }
  )
}

// Line 118: Enable delete
const handleDelete = async (id: number) => {
  if (!confirm('Bạn có chắc muốn xóa bộ sưu tập này?')) return
  try {
    await CollectionsService.deleteCollectionApiV1CollectionsCollectionIdDelete(id)
    refetch()
  } catch (error) {
    alert('Không thể xóa bộ sưu tập')
  }
}
```

**Công việc**:
- [ ] Implement handleEdit
- [ ] Implement handleDelete
- [ ] Test workflows

---

### **BƯỚC 5: TEST & FIX CHAT SYSTEM**

**Prerequisites**:
- ✅ Backend WebSocket endpoint: `/api/v1/chat/ws/{session_id}`
- ✅ Frontend SocketContext.tsx
- ✅ Frontend ChatWidget.tsx (customer)
- ✅ Frontend ChatSupport.tsx (admin)

**Testing Plan**:
1. Tạo user account (hoặc dùng seed data)
2. Customer: Click chat widget → Tạo session
3. Admin: Vào `/admin/chat` → Xem sessions
4. Admin: Click session → Reply
5. Customer: Nhận message real-time

**Known Issues**:
- WebSocket URL có thể sai (kiểm tra `ws://` vs `http://`)
- CORS settings cho WebSocket
- Session creation có thể fail nếu không login

**File cần check**: 
- `frontend/src/context/SocketContext.tsx` line 15 (WebSocket URL)
- `backend/app/api/api_v1/endpoints/chat.py` (CORS)

**Công việc**:
- [ ] Verify WebSocket connection
- [ ] Test message sending/receiving
- [ ] Fix CORS if needed
- [ ] Test admin reply

---

### **BƯỚC 6: VERIFY AUTHENTICATION FLOW**

**Testing**:
1. Register new user: POST `/api/v1/auth/register`
2. Login: POST `/api/v1/auth/login` → Get JWT token
3. Access protected routes với token header
4. Admin login: `admin@luxefurniture.com` / `Admin@123456`

**Files to check**:
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/services/apiClient.ts` (JWT interceptor)
- `backend/app/api/api_v1/endpoints/auth.py`

**Common issues**:
- Token not saved in localStorage
- Token not sent in headers
- Token expired
- CORS blocking cookies

**Công việc**:
- [ ] Test register flow
- [ ] Test login flow
- [ ] Test admin access
- [ ] Test token refresh

---

### **BƯỚC 7: INTEGRATION TESTING**

**Full E2E Test Scenarios**:

#### Admin Workflow:
1. ✅ Login as admin
2. ✅ Create category
3. ✅ Update category
4. ✅ Delete category
5. ✅ Create product (với category, images, specs)
6. ✅ Update product
7. ✅ Delete product
8. ✅ Create collection (với products)
9. ✅ Update collection
10. ✅ Delete collection
11. ✅ View orders
12. ✅ Update order status
13. ✅ Reply to customer chat

#### Customer Workflow:
1. ✅ Register account
2. ✅ Login
3. ✅ Browse products (filter by category)
4. ✅ View product detail
5. ✅ Add to cart
6. ✅ Update cart quantity
7. ✅ Checkout
8. ✅ View order history
9. ✅ Use chat widget
10. ✅ Receive admin replies

---

## 📊 PRIORITY MATRIX

| Priority | Task | Impact | Effort | Status |
|----------|------|--------|--------|--------|
| 🔴 P0 | Fix database & seed data | CRITICAL | Low | ⏳ TODO |
| 🔴 P0 | Add Category UPDATE/DELETE | HIGH | Medium | ⏳ TODO |
| 🟡 P1 | Fix Collection Management | HIGH | Low | ⏳ TODO |
| 🟡 P1 | Test Chat System | MEDIUM | Low | ⏳ TODO |
| 🟢 P2 | Verify Auth Flow | MEDIUM | Low | ⏳ TODO |
| 🟢 P2 | Integration Testing | LOW | High | ⏳ TODO |

---

## 🚀 EXECUTION ORDER

### Phase 1: Foundation (30 phút)
1. Fix seed_data.py
2. Run migrations & seed
3. Verify database has data

### Phase 2: Backend API (45 phút)
4. Add Category UPDATE/DELETE endpoints
5. Add methods to ProductService
6. Restart backend
7. Test với Postman

### Phase 3: Frontend Updates (45 phút)
8. Regenerate API client
9. Update CategoryManage.tsx
10. Update CollectionManage.tsx
11. Rebuild frontend

### Phase 4: Testing (60 phút)
12. Test all CRUD operations
13. Test chat system
14. Test auth flow
15. Fix bugs found

### Phase 5: Polish (30 phút)
16. Add error messages
17. Add loading states
18. Add success notifications
19. Final testing

**TOTAL TIME ESTIMATE**: ~3.5 giờ

---

## ✅ SUCCESS CRITERIA

### Must Have:
- [ ] Database có data (categories, products, admin user)
- [ ] Category CRUD hoạt động 100%
- [ ] Product CRUD hoạt động 100%
- [ ] Collection CRUD hoạt động 100%
- [ ] Chat real-time hoạt động
- [ ] Login/Logout hoạt động
- [ ] Cart hoạt động
- [ ] Checkout hoạt động

### Nice to Have:
- [ ] Order management hoạt động
- [ ] Dashboard stats hoạt động
- [ ] Image upload hoạt động
- [ ] Search/Filter hoạt động

---

## 📝 NOTES

### Debugging Tips:
- Check browser DevTools Console for errors
- Check backend logs: `docker logs luxefurniture_backend -f`
- Check database: `docker exec -it luxefurniture_db psql -U postgres -d luxe_furniture`
- Check API responses in Network tab

### Common Errors:
- **401 Unauthorized**: Token expired or invalid
- **403 Forbidden**: User không có quyền admin
- **404 Not Found**: Endpoint sai hoặc resource không tồn tại
- **500 Internal Server Error**: Backend bug, check logs

---

**LƯU Ý**: Bắt đầu từ BƯỚC 1 là quan trọng nhất. Không có data thì không test được gì cả!
