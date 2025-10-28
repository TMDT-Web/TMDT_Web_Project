from tests.helpers import signup_and_login, promote_user_to_admin, create_category, create_product, add_to_cart

def test_add_update_remove_clear_cart(client):
    print("\n[CART] Bắt đầu")
    user_id, headers = signup_and_login(client)
    promote_user_to_admin(user_id)

    print("[CART] Chuẩn bị product")
    cat_id = create_category(client, headers)
    prod = create_product(client, headers, category_id=cat_id, stock=5)
    pid = prod["id"]

    print("[CART] Thêm vào giỏ")
    add_to_cart(client, headers, pid, qty=2)

    print("[CART] GET cart")
    r = client.get("/api/cart", headers=headers)
    assert r.status_code == 200 and len(r.json()) >= 1
    item_id = r.json()[0]["id"]

    print("[CART] Cập nhật item")
    r = client.patch(f"/api/cart/{item_id}", json={"quantity": 3}, headers=headers)
    assert r.status_code in (200, 204)

    print("[CART] Xoá item")
    r = client.delete(f"/api/cart/{item_id}", headers=headers)
    assert r.status_code == 204

    print("[CART] Thêm lại và clear toàn bộ")
    add_to_cart(client, headers, pid, qty=1)
    r = client.delete("/api/cart", headers=headers)
    assert r.status_code == 204
    print("[CART] Hoàn tất")
