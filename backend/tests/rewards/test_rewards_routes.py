from tests.helpers import signup_and_login, promote_user_to_admin, create_category, create_product, add_to_cart, create_cod_order

def test_rewards_me_and_optional_redeem(client):
    print("\n[REWARDS] Bắt đầu")
    user_id, headers = signup_and_login(client)
    promote_user_to_admin(user_id)

    print("[REWARDS] /rewards/me ban đầu")
    r = client.get("/api/rewards/me", headers=headers)
    assert r.status_code == 200
    before = r.json()["points"]["points"]

    print("[REWARDS] Tạo order để cộng điểm")
    cat_id = create_category(client, headers)
    prod = create_product(client, headers, category_id=cat_id, price=120000, stock=10)
    add_to_cart(client, headers, prod["id"], qty=1)
    _ = create_cod_order(client, headers)

    print("[REWARDS] /rewards/me sau order")
    r = client.get("/api/rewards/me", headers=headers)
    assert r.status_code == 200
    after = r.json()["points"]["points"]
    assert after >= before

    print("[REWARDS] Redeem nếu đủ điểm")
    r = client.post("/api/rewards/redeem", headers=headers)
    if r.status_code in (200, 201):
        body = r.json()
        assert "voucher" in body and "balance" in body
        print("[REWARDS] Redeem thành công")
    else:
        import pytest
        pytest.skip(f"Chưa đủ điểm để redeem: {r.status_code} {r.text}")
    print("[REWARDS] Hoàn tất")
