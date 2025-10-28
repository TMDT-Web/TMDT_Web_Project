def test_users_me_requires_token(client):
    r = client.get("/api/users/me")
    assert r.status_code in (401, 403)

def test_users_me_with_token_and_self_update(client):
    # đăng ký + login
    client.post("/api/auth/register", json={
        "email": "u1@example.com",
        "password": "P@ssw0rd!",
        "full_name": "U1",
        "phone_number": "0909555444"
    })
    tok = client.post("/api/auth/login", json={
        "email": "u1@example.com", "password": "P@ssw0rd!"
    }).json()["access_token"]

    # /users/me
    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {tok}"}).json()
    uid = me["id"]

    # PATCH self
    r = client.patch(f"/api/users/{uid}", json={
        "full_name": "U1 Updated",
        "phone_number": "0909000123"
    }, headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200, r.text
    updated = r.json()
    assert updated["full_name"] == "U1 Updated"
    assert updated["phone_number"] == "0909000123"

def test_list_users_forbidden_for_non_admin(client):
    client.post("/api/auth/register", json={
        "email": "normal@example.com", "password": "P@ssw0rd!", "full_name": "Normal"
    })
    tok = client.post("/api/auth/login", json={
        "email": "normal@example.com", "password": "P@ssw0rd!"
    }).json()["access_token"]

    r = client.get("/api/users", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code in (401, 403), r.text
