import os
import uuid
from datetime import datetime
from sqlalchemy import create_engine, text

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://furniture_user:secretpassword@db:5432/furniture_test_db",
)

def promote_user_to_admin(user_id: int):
    eng = create_engine(TEST_DATABASE_URL, future=True)
    with eng.begin() as conn:
        role_id = conn.execute(text("SELECT id FROM roles WHERE name = 'admin'")).scalar()
        if role_id is None:
            raise RuntimeError("Thiếu role 'admin' trong DB test.")
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

def signup_and_login(client, full_name="Tester", phone="0909000111"):
    email = f"u_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongPass!123"
    r = client.post("/api/auth/register", json={
        "email": email, "password": pwd, "full_name": full_name, "phone_number": phone
    })
    assert r.status_code in (200, 201), r.text
    user_id = r.json()["id"]
    r = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert r.status_code == 200, r.text
    access = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {access}"}
    return user_id, headers

def create_category(client, headers, name_prefix="Cat"):
    payload = {"name": f"{name_prefix}-{uuid.uuid4().hex[:5]}", "slug": f"{name_prefix.lower()}-{uuid.uuid4().hex[:5]}"}
    r = client.post("/api/products/categories", json=payload, headers=headers)
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]

def create_product(client, headers, category_id, price=120000, stock=50):
    payload = {
        "sku": f"SKU-{uuid.uuid4().hex[:8]}",
        "name": f"Prod-{uuid.uuid4().hex[:5]}",
        "description": "Test product",
        "price": price,
        "stock_quantity": stock,
        "category_id": category_id,
        "tag_ids": [],
    }
    r = client.post("/api/products", json=payload, headers=headers)
    assert r.status_code in (200, 201), r.text
    return r.json()

def add_to_cart(client, headers, product_id, qty=1):
    r = client.post("/api/cart", json={"product_id": product_id, "quantity": qty}, headers=headers)
    assert r.status_code == 201, r.text

def create_cod_order(client, headers, phone="0909000111"):
    payload = {
        "shipping_address": "123 Test Street",
        "shipping_contact_name": "Tester",
        "shipping_contact_phone": phone,
        "payment_gateway": "cod",
        "voucher_code": None,
        "use_reward_points": False,
    }
    r = client.post("/api/orders", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["order"]
