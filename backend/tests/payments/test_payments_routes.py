from decimal import Decimal
from tests.helpers import signup_and_login, promote_user_to_admin, create_category, create_product, add_to_cart, create_cod_order

def test_admin_initiate_payment_for_order(client):
    print("\n[PAYMENTS] Bắt đầu")
    user_id, headers = signup_and_login(client)
    promote_user_to_admin(user_id)

    print("[PAYMENTS] Chuẩn bị order")
    cat_id = create_category(client, headers)
    prod = create_product(client, headers, category_id=cat_id, price=150000, stock=10)
    add_to_cart(client, headers, prod["id"], qty=1)
    order = create_cod_order(client, headers)
    order_id = order["id"]
    total = Decimal(str(order["total_amount"]))

    print("[PAYMENTS] Initiate payment (momo)")
    payload = {
        "order_id": order_id,
        "gateway": "momo",
        "amount": float(total),
        "currency": "VND",
        "metadata": {"note": "unit test"},
    }
    r = client.post("/api/payments/initiate", json=payload, headers=headers)
    assert r.status_code in (200, 201), r.text
    body = r.json()
    assert {"payment_id", "gateway", "status"} <= set(body.keys())
    print("[PAYMENTS] Hoàn tất")
