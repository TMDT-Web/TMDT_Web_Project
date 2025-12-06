# tests/inventory/test_inventory_routes.py
import uuid
from decimal import Decimal

from tests.helpers import (
    signup_and_login,
    promote_user_to_admin,
    create_category,
    create_product,
)


def _ensure_admin(client):
    """Đăng ký, đăng nhập và set quyền admin."""
    user_id, headers = signup_and_login(client)
    promote_user_to_admin(user_id)
    print("Promoted user to admin:", user_id)
    return user_id, headers


def _ensure_product(client, headers):
    """Tạo category + product để nhập kho (dùng helpers gốc)."""
    cat_id = create_category(client, headers)
    print("CREATE CATEGORY id:", cat_id)
    prod = create_product(client, headers, category_id=cat_id, price=120000, stock=0)
    print("CREATE PRODUCT response:", prod)
    return prod


def test_inventory_create_and_list_suppliers(client):
    user_id, headers = _ensure_admin(client)

    supplier_payload = {
        "name": f"Supplier {uuid.uuid4().hex[:6]}",
        "contact_name": "Nguyen Van A",
        "contact_phone": "0909000222",
        "contact_email": "supplier@example.com",
        "address": "123 Supplier St",
        "tax_code": "0123456789",
        "notes": "test supplier",
    }

    r = client.post("/api/inventory/suppliers", json=supplier_payload, headers=headers)
    print("CREATE SUPPLIER payload:", supplier_payload)
    print("CREATE SUPPLIER response:", r.status_code, r.json() if r.content else None)
    assert r.status_code in (200, 201), r.text
    supplier = r.json()
    assert supplier["name"] == supplier_payload["name"]

    r = client.get("/api/inventory/suppliers", headers=headers)
    print("LIST SUPPLIERS response:", r.status_code, r.json() if r.content else None)
    assert r.status_code == 200, r.text
    suppliers = r.json()
    assert any(s["id"] == supplier["id"] for s in suppliers)


def test_inventory_create_purchase_order_and_list(client):
    user_id, headers = _ensure_admin(client)

    supplier_payload = {
        "name": f"Supplier {uuid.uuid4().hex[:6]}",
        "contact_name": "Le Thi B",
    }
    r = client.post("/api/inventory/suppliers", json=supplier_payload, headers=headers)
    print("CREATE SUPPLIER payload:", supplier_payload)
    print("CREATE SUPPLIER response:", r.status_code, r.json() if r.content else None)
    assert r.status_code in (200, 201), r.text
    supplier_id = r.json()["id"]

    product = _ensure_product(client, headers)
    product_id = product["id"]

    po_payload = {
        "supplier_id": supplier_id,
        "items": [
            {
                "product_id": product_id,
                "quantity": 5,
                "unit_cost": "50000",
            }
        ],
        "notes": "first import",
    }

    r = client.post("/api/inventory/stock-entries", json=po_payload, headers=headers)
    print("CREATE PURCHASE ORDER payload:", po_payload)
    print("CREATE PURCHASE ORDER response:", r.status_code, r.json() if r.content else None)
    assert r.status_code in (200, 201), r.text

    po = r.json()
    assert po["supplier_id"] == supplier_id
    assert len(po["items"]) == 1
    assert po["items"][0]["product_id"] == product_id
    assert Decimal(str(po["total_cost"])) == Decimal("250000")

    r = client.get("/api/inventory/stock-entries", headers=headers)
    print("LIST PURCHASE ORDERS response:", r.status_code, r.json() if r.content else None)
    assert r.status_code == 200, r.text
    lst = r.json()
    assert any(x["id"] == po["id"] for x in lst)
