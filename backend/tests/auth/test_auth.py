def test_register_login_refresh_and_me(client):
    print("\n[AUTH] Bắt đầu")
    email = "demo_" + "x"*6 + "@example.com"

    print("[AUTH] Đăng ký")
    r = client.post("/api/auth/register", json={
        "email": email, "password": "StrongPass!123", "full_name": "Auth User", "phone_number": "0909123123"
    })
    assert r.status_code in (200, 201), r.text

    print("[AUTH] Đăng nhập")
    r = client.post("/api/auth/login", json={"email": email, "password": "StrongPass!123"})
    assert r.status_code == 200, r.text
    access = r.json()["access_token"]; refresh = r.json()["refresh_token"]

    print("[AUTH] Lấy thông tin /users/me")
    r = client.get("/api/users/me", headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 200 and r.json()["email"] == email

    print("[AUTH] Refresh token")
    r = client.post("/api/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200, r.text
    assert r.json()["access_token"]
    print("[AUTH] Hoàn tất")
