from tests.helpers import signup_and_login, promote_user_to_admin, create_category, create_product

def test_admin_crud_product(client):
    print("\n[PRODUCTS] Bắt đầu CRUD")
    user_id, headers = signup_and_login(client)
    promote_user_to_admin(user_id)

    print("[PRODUCTS] Tạo category")
    cat_id = create_category(client, headers)

    print("[PRODUCTS] Tạo product")
    prod = create_product(client, headers, category_id=cat_id)
    pid = prod["id"]

    print("[PRODUCTS] GET product")
    r = client.get(f"/api/products/{pid}")
    assert r.status_code == 200 and r.json()["id"] == pid

    print("[PRODUCTS] PATCH product")
    r = client.patch(f"/api/products/{pid}", json={"price": 130000}, headers=headers)
    assert r.status_code == 200 and str(r.json()["price"]) in ("130000", "130000.00")

    print("[PRODUCTS] DELETE product")
    r = client.delete(f"/api/products/{pid}", headers=headers)
    assert r.status_code == 204
    print("[PRODUCTS] Hoàn tất")

def test_list_products_public(client):
    print("\n[PRODUCTS] List public")
    r = client.get("/api/products")
    assert r.status_code == 200
    body = r.json()
    assert {"items", "total", "page", "size"} <= set(body.keys())
    print("[PRODUCTS] Hoàn tất")
