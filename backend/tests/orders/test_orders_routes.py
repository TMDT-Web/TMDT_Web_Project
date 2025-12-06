from tests.helpers import signup_and_login, promote_user_to_admin, create_category, create_product, add_to_cart, create_cod_order

def test_create_list_get_cancel_order(client):
    print("\n[ORDERS] Bắt đầu")
    user_id, headers = signup_and_login(client)
    promote_user_to_admin(user_id)

    print("[ORDERS] Chuẩn bị product")
    cat_id = create_category(client, headers)
    prod = create_product(client, headers, category_id=cat_id, stock=10)

    print("[ORDERS] Thêm vào giỏ")
    add_to_cart(client, headers, prod["id"], qty=2)

    print("[ORDERS] Tạo đơn COD")
    order = create_cod_order(client, headers)
    order_id = order["id"]

    print("[ORDERS] List đơn")
    r = client.get("/api/orders", headers=headers)
    assert r.status_code == 200 and any(it["id"] == order_id for it in r.json()["items"])

    print("[ORDERS] GET chi tiết đơn")
    r = client.get(f"/api/orders/{order_id}", headers=headers)
    assert r.status_code == 200 and r.json()["id"] == order_id

    print("[ORDERS] Cancel đơn")
    r = client.post(f"/api/orders/{order_id}/cancel", headers=headers)
    assert r.status_code == 200
    print("[ORDERS] Hoàn tất")
