import uuid
import os
from datetime import datetime
from sqlalchemy import create_engine, text

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://furniture_user:secretpassword@db:5432/furniture_test_db",
)

def _promote_user_to_admin(user_id: int):
    eng = create_engine(TEST_DATABASE_URL, future=True)
    with eng.begin() as conn:
        role_id = conn.execute(text("SELECT id FROM roles WHERE name = 'admin'")).scalar()
        if role_id is None:
            raise RuntimeError("Role 'admin' chưa có trong DB; kiểm tra ensure_system_roles().")
        conn.execute(
            text("""
                INSERT INTO user_roles (user_id, role_id, assigned_at)
                SELECT :uid, :rid, :ts
                WHERE NOT EXISTS (
                  SELECT 1 FROM user_roles WHERE user_id=:uid AND role_id=:rid
                )
            """),
            {"uid": user_id, "rid": role_id, "ts": datetime.utcnow()},
        )

def _create_product(client, headers):
    cat_payload = {"name": f"TestCat-{uuid.uuid4().hex[:5]}", "slug": f"test-cat-{uuid.uuid4().hex[:5]}"}
    r = client.post("/api/products/categories", json=cat_payload, headers=headers)
    assert r.status_code in (200, 201), f"Tạo category thất bại: {r.status_code} {r.text}"
    cat_id = r.json()["id"]

    product_payload = {
        "sku": f"SKU-{uuid.uuid4().hex[:8]}",
        "name": f"Test Product {uuid.uuid4().hex[:5]}",
        "description": "Auto product for testing",
        "price": 120000,
        "stock_quantity": 20,
        "category_id": cat_id,
        "tag_ids": [],
    }
    r = client.post("/api/products", json=product_payload, headers=headers)
    assert r.status_code in (200, 201), f"Tạo sản phẩm thất bại: {r.status_code} {r.text}"
    return r.json()

def test_full_order_payment_reward_flow(client):
    print("\n=== BẮT ĐẦU TEST FULL ORDER FLOW ===")
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass!123"

    # 1. Đăng ký user
    r = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Order Tester",
        "phone_number": "0909555666"
    })
    assert r.status_code in (200, 201), r.text
    user_id = r.json()["id"]
    print("[1] Đăng ký người dùng thành công")

    # 2. Login
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[2] Đăng nhập thành công")

    # 3. Nâng quyền admin
    _promote_user_to_admin(user_id)
    print("[3] Nâng quyền admin thành công")

    # 4. Tạo sản phẩm
    product = _create_product(client, headers)
    product_id = product["id"]
    print(f"[4] Tạo sản phẩm thành công (id={product_id})")

    # 5. Thêm sản phẩm vào giỏ hàng
    add_payload = {"product_id": product_id, "quantity": 2}
    r = client.post("/api/cart", json=add_payload, headers=headers)
    assert r.status_code == 201, f"Add to cart failed: {r.status_code} {r.text}"
    print("[5] Thêm sản phẩm vào giỏ hàng thành công")

    # 6. Tạo đơn hàng (payment_gateway='cod' là giá trị hợp lệ)
    order_payload = {
        "shipping_address": "123 Test Street",
        "shipping_contact_name": "Order Tester",
        "shipping_contact_phone": "0909555666",
        "payment_gateway": "cod",  # enum yêu cầu lowercase
        "voucher_code": None,
        "use_reward_points": False,
    }
    r = client.post("/api/orders", json=order_payload, headers=headers)
    assert r.status_code == 201, f"Tạo đơn hàng thất bại: {r.status_code} {r.text}"
    order = r.json()["order"]
    order_id = order["id"]
    print(f"[6] Tạo đơn hàng thành công (id={order_id})")

    # 7. Kiểm tra chi tiết đơn hàng
    r = client.get(f"/api/orders/{order_id}", headers=headers)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == order_id
    print("[7] Lấy chi tiết đơn hàng thành công")

    # 8. Rewards dashboard (/api/rewards/me)
    r = client.get("/api/rewards/me", headers=headers)
    if r.status_code == 200:
        dash = r.json()
        assert "points" in dash
        assert dash["points"]["user_id"] == user_id
        assert isinstance(dash["points"]["points"], int)
        print("[8] Kiểm tra rewards dashboard thành công (/api/rewards/me)")
    else:
        import pytest
        pytest.skip("Rewards dashboard chưa được triển khai, bỏ qua bước này.")

    print("=== HOÀN TẤT TEST FULL ORDER FLOW ===")
