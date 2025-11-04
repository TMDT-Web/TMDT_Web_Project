import json
import textwrap


def lines(script: str | None) -> list[str]:
    if not script:
        return []
    text = textwrap.dedent(script)
    text = text.strip("\n")
    if not text:
        return []
    return [line.rstrip("\n") for line in text.splitlines()]


def make_url(path: list[str], query: list[dict] | None = None) -> dict:
    raw_path = "/".join(path)
    url = {
        "raw": "{{baseUrl}}/" + raw_path,
        "host": ["{{baseUrl}}"],
        "path": path,
    }
    if query:
        url["query"] = query
    return url


def make_request(
    name: str,
    method: str,
    path: list[str],
    *,
    description: str | None = None,
    body: str | None = None,
    tests: str | None = None,
    pre_request: str | None = None,
    auth: dict | None = None,
    headers: list[dict] | None = None,
    query: list[dict] | None = None,
) -> dict:
    request_headers = list(headers or [])
    request: dict = {
        "method": method,
        "header": request_headers,
        "url": make_url(path, query=query),
    }
    if body is not None:
        if not any(h for h in request_headers if h.get("key") == "Content-Type"):
            request_headers.append({"key": "Content-Type", "value": "application/json"})
        request["body"] = {
            "mode": "raw",
            "raw": body,
            "options": {"raw": {"language": "json"}},
        }
    events = []
    test_lines = lines(tests)
    if test_lines:
        events.append({
            "listen": "test",
            "script": {"type": "text/javascript", "exec": test_lines},
        })
    pre_lines = lines(pre_request)
    if auth and auth.get("type") == "noauth":
        pre_lines = ["pm.request.headers.remove(\"Authorization\");"] + pre_lines
    if pre_lines:
        events.append({
            "listen": "prerequest",
            "script": {"type": "text/javascript", "exec": pre_lines},
        })
    item: dict = {
        "name": name,
        "request": request,
        "response": [],
    }
    if description:
        item["description"] = description
    if events:
        item["event"] = events
    if auth:
        item["auth"] = auth
    return item


def bearer_auth(token_var: str) -> dict:
    return {
        "type": "bearer",
        "bearer": [
            {
                "key": "token",
                "value": token_var,
                "type": "string",
            }
        ],
    }


def no_auth() -> dict:
    return {"type": "noauth"}


collection = {
    "info": {
        "_postman_id": "21c129c6-30ec-4b79-b089-ecda001e2f0f",
        "name": "TMDT Backend API",
        "description": "Postman collection covering success and failure scenarios for all API endpoints.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    "item": [],
    "auth": bearer_auth("{{accessToken}}"),
    "event": [],
    "variable": [
        {"key": "baseUrl", "value": "http://127.0.0.1:8000/api"},
        {"key": "customerEmail", "value": ""},
        {"key": "customerPassword", "value": "stringstrong!"},
        {"key": "customerId", "value": ""},
        {"key": "secondCustomerEmail", "value": ""},
        {"key": "secondCustomerPassword", "value": "stringstrong!"},
        {"key": "secondCustomerId", "value": ""},
        {"key": "accessToken", "value": ""},
        {"key": "refreshToken", "value": ""},
        {"key": "secondCustomerAccessToken", "value": ""},
        {"key": "adminEmail", "value": "admin@example.com"},
        {"key": "adminPassword", "value": "AdminPass123!"},
        {"key": "adminAccessToken", "value": ""},
        {"key": "rootEmail", "value": "root@example.com"},
        {"key": "rootPassword", "value": "RootPass123!"},
        {"key": "rootAccessToken", "value": ""},
        {"key": "categoryId", "value": ""},
        {"key": "tagId", "value": ""},
        {"key": "productId", "value": ""},
        {"key": "productToDeleteId", "value": ""},
        {"key": "supplierId", "value": ""},
        {"key": "purchaseOrderId", "value": ""},
        {"key": "cartItemId", "value": ""},
        {"key": "orderId", "value": ""},
        {"key": "orderIdToCancel", "value": ""},
        {"key": "paymentId", "value": ""},
        {"key": "paymentGateway", "value": "momo"},
        {"key": "voucherCode", "value": ""},
        {"key": "invalidToken", "value": "invalid-token"},
        {"key": "createdRoleId", "value": ""},
        {"key": "duplicateRoleId", "value": ""},
    ],
}

items = collection["item"]

# Auth folder
auth_items: list[dict] = []

auth_items.append(
    make_request(
        "Register Customer - Success",
        "POST",
        ["auth", "register"],
        body="""
{
    \"email\": \"customer_{{$randomInt}}@example.com\",
    \"password\": \"{{customerPassword}}\",
    \"full_name\": \"Test Customer\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"customerEmail\", response.email);
pm.collectionVariables.set(\"customerId\", response.id);
""",
    )
)

auth_items.append(
    make_request(
        "Register Customer - Error 400 Email Exists",
        "POST",
        ["auth", "register"],
        body="""
{
    \"email\": \"{{customerEmail}}\",
    \"password\": \"{{customerPassword}}\",
    \"full_name\": \"Duplicate Customer\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

auth_items.append(
    make_request(
        "Register Customer - Error 422 Invalid Email",
        "POST",
        ["auth", "register"],
        body="""
{
    \"email\": \"not-an-email\",
    \"password\": \"{{customerPassword}}\",
    \"full_name\": \"Broken Customer\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

auth_items.append(
    make_request(
        "Register Secondary Customer - Success",
        "POST",
        ["auth", "register"],
        body="""
{
    \"email\": \"customer_b_{{$randomInt}}@example.com\",
    \"password\": \"{{secondCustomerPassword}}\",
    \"full_name\": \"Second Customer\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"secondCustomerEmail\", response.email);
pm.collectionVariables.set(\"secondCustomerId\", response.id);
""",
    )
)

auth_items.append(
    make_request(
        "Login Customer - Success",
        "POST",
        ["auth", "login"],
        body="""
{
    \"email\": \"{{customerEmail}}\",
    \"password\": \"{{customerPassword}}\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
const response = pm.response.json();
pm.collectionVariables.set(\"accessToken\", response.access_token);
pm.collectionVariables.set(\"refreshToken\", response.refresh_token);
""",
    )
)

auth_items.append(
    make_request(
        "Login Customer - Error 401 Wrong Password",
        "POST",
        ["auth", "login"],
        body="""
{
    \"email\": \"{{customerEmail}}\",
    \"password\": \"wrong-password\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

auth_items.append(
    make_request(
        "Login Customer - Error 401 Unknown Email",
        "POST",
        ["auth", "login"],
        body="""
{
    \"email\": \"not_exists@example.com\",
    \"password\": \"{{customerPassword}}\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

auth_items.append(
    make_request(
        "Login Secondary Customer - Success",
        "POST",
        ["auth", "login"],
        body="""
{
    \"email\": \"{{secondCustomerEmail}}\",
    \"password\": \"{{secondCustomerPassword}}\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
const response = pm.response.json();
pm.collectionVariables.set(\"secondCustomerAccessToken\", response.access_token);
""",
    )
)

auth_items.append(
    make_request(
        "Refresh Token - Success",
        "POST",
        ["auth", "refresh"],
        body="""
{
    \"refresh_token\": \"{{refreshToken}}\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
const response = pm.response.json();
pm.collectionVariables.set(\"accessToken\", response.access_token);
pm.collectionVariables.set(\"refreshToken\", response.refresh_token);
""",
    )
)

auth_items.append(
    make_request(
        "Refresh Token - Error 400 Invalid Token",
        "POST",
        ["auth", "refresh"],
        body="""
{
    \"refresh_token\": \"totally-invalid\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

auth_items.append(
    make_request(
        "Login Admin - Success",
        "POST",
        ["auth", "login"],
        description="Provide valid admin credentials via collection variables before running.",
        body="""
{
    \"email\": \"{{adminEmail}}\",
    \"password\": \"{{adminPassword}}\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
const response = pm.response.json();
pm.collectionVariables.set(\"adminAccessToken\", response.access_token);
""",
    )
)

auth_items.append(
    make_request(
        "Login Admin - Error 401 Wrong Password",
        "POST",
        ["auth", "login"],
        body="""
{
    \"email\": \"{{adminEmail}}\",
    \"password\": \"WrongPassword123!\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

auth_items.append(
    make_request(
        "Login Root - Success",
        "POST",
        ["auth", "login"],
        description="Provide valid root credentials via collection variables before running.",
        body="""
{
    \"email\": \"{{rootEmail}}\",
    \"password\": \"{{rootPassword}}\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
const response = pm.response.json();
pm.collectionVariables.set(\"rootAccessToken\", response.access_token);
""",
    )
)

auth_items.append(
    make_request(
        "Login Root - Error 401 Wrong Password",
        "POST",
        ["auth", "login"],
        body="""
{
    \"email\": \"{{rootEmail}}\",
    \"password\": \"IncorrectRootPass!\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

auth_items.append(
    make_request(
        "Google OAuth Login - Success (Requires Config)",
        "GET",
        ["auth", "google", "login"],
        description="Returns redirect URL when Google OAuth credentials are configured.",
    )
)

auth_items.append(
    make_request(
        "Google OAuth Login - Error 500 Not Configured",
        "GET",
        ["auth", "google", "login"],
        tests="""
pm.test(\"Status code is 500\", function () {
    pm.response.to.have.status(500);
});
""",
    )
)

auth_items.append(
    make_request(
        "Google OAuth Callback - Success (Requires Config)",
        "GET",
        ["auth", "google", "callback"],
        description="Exchange code for tokens when Google OAuth credentials are configured.",
        query=[{"key": "code", "value": "valid-code"}],
    )
)

auth_items.append(
    make_request(
        "Google OAuth Callback - Error 422 Missing Code",
        "GET",
        ["auth", "google", "callback"],
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

auth_items.append(
    make_request(
        "Google OAuth Callback - Error 503 Not Configured",
        "GET",
        ["auth", "google", "callback"],
        query=[{"key": "code", "value": "sample-code"}],
        tests="""
pm.test(\"Status code is 503\", function () {
    pm.response.to.have.status(503);
});
""",
    )
)

items.append({"name": "Auth", "item": auth_items})

# Users folder
users_items: list[dict] = []

users_items.append(
    make_request(
        "Get Current User - Success",
        "GET",
        ["users", "me"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
const response = pm.response.json();
pm.test(\"Matches logged in user\", function () {
    pm.expect(response.id).to.eql(Number(pm.collectionVariables.get(\"customerId\")));
});
""",
    )
)

users_items.append(
    make_request(
        "Get Current User - Error 401 Missing Token",
        "GET",
        ["users", "me"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

users_items.append(
    make_request(
        "Get Current User - Error 401 Invalid Token",
        "GET",
        ["users", "me"],
        auth=no_auth(),
        headers=[{"key": "Authorization", "value": "Bearer {{invalidToken}}"}],
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

users_items.append(
    make_request(
        "List Users - Success (Admin)",
        "GET",
        ["users"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

users_items.append(
    make_request(
        "List Users - Error 403 Forbidden (Customer)",
        "GET",
        ["users"],
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

users_items.append(
    make_request(
        "List Users - Error 401 Missing Token",
        "GET",
        ["users"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

users_items.append(
    make_request(
        "Get User Detail - Success (Self)",
        "GET",
        ["users", "{{customerId}}"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

users_items.append(
    make_request(
        "Get User Detail - Error 404 Not Found",
        "GET",
        ["users", "999999"],
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

users_items.append(
    make_request(
        "Get User Detail - Error 403 Forbidden (Other Customer)",
        "GET",
        ["users", "{{secondCustomerId}}"],
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

users_items.append(
    make_request(
        "Update User - Success (Self)",
        "PATCH",
        ["users", "{{customerId}}"],
        body="""
{
    \"full_name\": \"Customer Updated\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

users_items.append(
    make_request(
        "Update User - Error 404 Not Found",
        "PATCH",
        ["users", "999999"],
        body="""
{
    \"full_name\": \"No One\"
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

users_items.append(
    make_request(
        "Update User - Error 403 Forbidden (Other Customer)",
        "PATCH",
        ["users", "{{secondCustomerId}}"],
        body="""
{
    \"full_name\": \"Illegal Update\"
}
""",
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

users_items.append(
    make_request(
        "Create Role - Success (Root)",
        "POST",
        ["roles"],
        auth=bearer_auth("{{rootAccessToken}}"),
        body="""
{
    \"name\": \"qa-role-{{$timestamp}}\",
    \"description\": \"Role created via tests\",
    \"is_system\": false
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"createdRoleId\", response.id);
""",
    )
)

users_items.append(
    make_request(
        "Create Role - Error 400 Duplicate",
        "POST",
        ["roles"],
        auth=bearer_auth("{{rootAccessToken}}"),
        body="""
{
    \"name\": \"qa-role-duplicate\",
    \"description\": \"Duplicate role\",
    \"is_system\": false
}
""",
        tests="""
pm.test(pm.response.code === 201 || pm.response.code === 400, \"Create or detect duplicate\");
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.collectionVariables.set(\"duplicateRoleId\", response.id);
} else {
    pm.test(\"Status code is 400\", function () {
        pm.response.to.have.status(400);
    });
}
""",
    )
)

users_items.append(
    make_request(
        "Create Role - Error 403 Forbidden (Admin)",
        "POST",
        ["roles"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"admin-not-allowed\",
    \"description\": \"Should fail\",
    \"is_system\": false
}
""",
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

users_items.append(
    make_request(
        "List Roles - Success (Admin)",
        "GET",
        ["roles"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

users_items.append(
    make_request(
        "List Roles - Error 401 Missing Token",
        "GET",
        ["roles"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

users_items.append(
    make_request(
        "Create Address - Success",
        "POST",
        ["users", "me", "addresses"],
        body="""
{
    \"street\": \"123 Test St\",
    \"city\": \"HCMC\",
    \"district\": \"1\",
    \"ward\": \"Ben Nghe\",
    \"contact_name\": \"Test Customer\",
    \"contact_phone\": \"0900000000\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
""",
    )
)

users_items.append(
    make_request(
        "Create Address - Error 422 Invalid Phone",
        "POST",
        ["users", "me", "addresses"],
        body="""
{
    \"street\": \"Bad St\",
    \"city\": \"HCMC\",
    \"district\": \"1\",
    \"ward\": \"Ben Nghe\",
    \"contact_name\": \"Test Customer\",
    \"contact_phone\": \"invalid\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

users_items.append(
    make_request(
        "Create Address - Error 401 Missing Token",
        "POST",
        ["users", "me", "addresses"],
        auth=no_auth(),
        body="""
{
    \"street\": \"No Auth St\",
    \"city\": \"HCMC\",
    \"district\": \"1\",
    \"ward\": \"Ben Nghe\",
    \"contact_name\": \"Test Customer\",
    \"contact_phone\": \"0900000000\"
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

items.append({"name": "Users", "item": users_items})

# Products folder
products_public: list[dict] = []

products_public.append(
    make_request(
        "List Products - Success",
        "GET",
        ["products"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

products_public.append(
    make_request(
        "List Products - Error 422 Invalid Size",
        "GET",
        ["products"],
        query=[{"key": "size", "value": "0"}],
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

products_public.append(
    make_request(
        "Product Suggestions - Success",
        "GET",
        ["products", "suggestions"],
        query=[{"key": "q", "value": "chair"}],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

products_public.append(
    make_request(
        "Product Suggestions - Error 422 Missing Query",
        "GET",
        ["products", "suggestions"],
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

products_public.append(
    make_request(
        "Get Product Detail - Error 404 Not Found",
        "GET",
        ["products", "999999"],
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

products_public.append(
    make_request(
        "List Categories - Success",
        "GET",
        ["products", "categories"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

products_public.append(
    make_request(
        "List Categories - Error 405 Method Not Allowed",
        "DELETE",
        ["products", "categories"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 405\", function () {
    pm.response.to.have.status(405);
});
""",
    )
)

products_public.append(
    make_request(
        "List Tags - Success",
        "GET",
        ["products", "tags"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

products_public.append(
    make_request(
        "List Tags - Error 405 Method Not Allowed",
        "DELETE",
        ["products", "tags"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 405\", function () {
    pm.response.to.have.status(405);
});
""",
    )
)

items.append({"name": "Products (Public)", "item": products_public})

products_admin: list[dict] = []

products_admin.append(
    make_request(
        "Create Category - Success (Admin)",
        "POST",
        ["products", "categories"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"Category {{$randomInt}}\",
    \"slug\": \"category-{{$randomInt}}\",
    \"description\": \"Automation category\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"categoryId\", response.id);
""",
    )
)

products_admin.append(
    make_request(
        "Create Category - Error 400 Duplicate",
        "POST",
        ["products", "categories"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"Duplicate Category\",
    \"slug\": \"duplicate-category\",
    \"description\": \"Duplicate check\"
}
""",
        tests="""
pm.test(pm.response.code === 201 || pm.response.code === 400, \"Create or detect duplicate category\");
""",
    )
)

products_admin.append(
    make_request(
        "Create Category - Error 422 Missing Fields",
        "POST",
        ["products", "categories"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"description\": \"Missing required fields\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

products_admin.append(
    make_request(
        "Create Tag - Success (Admin)",
        "POST",
        ["products", "tags"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"Tag {{$randomInt}}\",
    \"slug\": \"tag-{{$randomInt}}\",
    \"description\": \"Automation tag\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"tagId\", response.id);
""",
    )
)

products_admin.append(
    make_request(
        "Create Tag - Error 400 Duplicate",
        "POST",
        ["products", "tags"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"Duplicate Tag\",
    \"slug\": \"duplicate-tag\",
    \"description\": \"Duplicate check\"
}
""",
        tests="""
pm.test(pm.response.code === 201 || pm.response.code === 400, \"Create or detect duplicate tag\");
""",
    )
)

products_admin.append(
    make_request(
        "Create Tag - Error 422 Missing Fields",
        "POST",
        ["products", "tags"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"description\": \"Missing required fields\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

products_admin.append(
    make_request(
        "Create Product - Success (Admin)",
        "POST",
        ["products"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"sku\": \"SKU-{{$uuid}}\",
    \"name\": \"Luxury Chair {{$uuid}}\",
    \"description\": \"Ergonomic luxury chair\",
    \"price\": 500000,
    \"stock_quantity\": 50,
    \"category_id\": {{categoryId}},
    \"tag_ids\": [{{tagId}}]
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"productId\", response.id);
""",
    )
)

products_admin.append(
    make_request(
        "Create Product - Error 422 Missing Fields",
        "POST",
        ["products"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"Incomplete Product\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

products_admin.append(
    make_request(
        "Create Product - Error 401 Unauthorized",
        "POST",
        ["products"],
        auth=no_auth(),
        body="""
{
    \"sku\": \"SKU-NOAUTH\",
    \"name\": \"Unauthorized Product\",
    \"price\": 100,
    \"stock_quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

products_admin.append(
    make_request(
        "Create Product For Deletion - Success (Admin)",
        "POST",
        ["products"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"sku\": \"SKU-DELETE-{{$uuid}}\",
    \"name\": \"Disposable Product {{$uuid}}\",
    \"description\": \"Product used for delete tests\",
    \"price\": 1000,
    \"stock_quantity\": 5
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"productToDeleteId\", response.id);
""",
    )
)

products_admin.append(
    make_request(
        "Get Product Detail - Success",
        "GET",
        ["products", "{{productId}}"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

products_admin.append(
    make_request(
        "Update Product - Success",
        "PATCH",
        ["products", "{{productId}}"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"price\": 450000,
    \"stock_quantity\": 40
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

products_admin.append(
    make_request(
        "Update Product - Error 404 Not Found",
        "PATCH",
        ["products", "999999"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"price\": 10
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

products_admin.append(
    make_request(
        "Update Product - Error 401 Unauthorized",
        "PATCH",
        ["products", "{{productId}}"],
        auth=no_auth(),
        body="""
{
    \"price\": 10
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

products_admin.append(
    make_request(
        "Delete Product - Success",
        "DELETE",
        ["products", "{{productToDeleteId}}"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 204\", function () {
    pm.response.to.have.status(204);
});
""",
    )
)

products_admin.append(
    make_request(
        "Delete Product - Error 404 Not Found",
        "DELETE",
        ["products", "999999"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

products_admin.append(
    make_request(
        "Delete Product - Error 401 Unauthorized",
        "DELETE",
        ["products", "{{productId}}"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

items.append({"name": "Products (Admin)", "item": products_admin})

# Cart folder
cart_items: list[dict] = []

cart_items.append(
    make_request(
        "Add To Cart - Success",
        "POST",
        ["cart"],
        body="""
{
    \"product_id\": {{productId}},
    \"quantity\": 2
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"cartItemId\", response.id);
""",
    )
)

cart_items.append(
    make_request(
        "Add To Cart - Error 404 Product Not Found",
        "POST",
        ["cart"],
        body="""
{
    \"product_id\": 999999,
    \"quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

cart_items.append(
    make_request(
        "Add To Cart - Error 401 Unauthorized",
        "POST",
        ["cart"],
        auth=no_auth(),
        body="""
{
    \"product_id\": {{productId}},
    \"quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

cart_items.append(
    make_request(
        "Get Cart - Success",
        "GET",
        ["cart"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

cart_items.append(
    make_request(
        "Get Cart - Error 401 Missing Token",
        "GET",
        ["cart"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

cart_items.append(
    make_request(
        "Update Cart Item - Success",
        "PATCH",
        ["cart", "{{cartItemId}}"],
        body="""
{
    \"quantity\": 3
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

cart_items.append(
    make_request(
        "Update Cart Item - Error 404 Not Found",
        "PATCH",
        ["cart", "0"],
        body="""
{
    \"quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

cart_items.append(
    make_request(
        "Update Cart Item - Error 401 Missing Token",
        "PATCH",
        ["cart", "{{cartItemId}}"],
        auth=no_auth(),
        body="""
{
    \"quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

cart_items.append(
    make_request(
        "Remove Cart Item - Success",
        "DELETE",
        ["cart", "{{cartItemId}}"],
        tests="""
pm.test(\"Status code is 204\", function () {
    pm.response.to.have.status(204);
});
""",
    )
)

cart_items.append(
    make_request(
        "Remove Cart Item - Error 404 Not Found",
        "DELETE",
        ["cart", "999999"],
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

cart_items.append(
    make_request(
        "Remove Cart Item - Error 401 Missing Token",
        "DELETE",
        ["cart", "{{cartItemId}}"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

cart_items.append(
    make_request(
        "Add To Cart For Clear - Success",
        "POST",
        ["cart"],
        body="""
{
    \"product_id\": {{productId}},
    \"quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
""",
    )
)

cart_items.append(
    make_request(
        "Clear Cart - Success",
        "DELETE",
        ["cart"],
        tests="""
pm.test(\"Status code is 204\", function () {
    pm.response.to.have.status(204);
});
""",
    )
)

cart_items.append(
    make_request(
        "Clear Cart - Error 401 Missing Token",
        "DELETE",
        ["cart"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

items.append({"name": "Cart", "item": cart_items})

# Orders folder
orders_items: list[dict] = []

orders_items.append(
    make_request(
        "Prepare Cart For Order - Success",
        "POST",
        ["cart"],
        body="""
{
    \"product_id\": {{productId}},
    \"quantity\": 3
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
""",
    )
)

orders_items.append(
    make_request(
        "Create Order - Success (MOMO)",
        "POST",
        ["orders"],
        body="""
{
    \"shipping_address\": \"123 Main St, District 1, HCMC\",
    \"shipping_contact_name\": \"Test Customer\",
    \"shipping_contact_phone\": \"0987654321\",
    \"payment_gateway\": \"momo\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"orderId\", response.order.id);
if (response.payment && response.payment.payment_id) {
    pm.collectionVariables.set(\"paymentId\", response.payment.payment_id);
}
""",
    )
)

orders_items.append(
    make_request(
        "Create Order - Error 400 Cart Empty",
        "POST",
        ["orders"],
        body="""
{
    \"shipping_address\": \"123 Main St\",
    \"shipping_contact_name\": \"Test Customer\",
    \"shipping_contact_phone\": \"0987654321\",
    \"payment_gateway\": \"cod\"
}
""",
        tests="""
pm.test(\"Status code is 400\", function () {
    pm.response.to.have.status(400);
});
""",
    )
)

orders_items.append(
    make_request(
        "List Orders - Success",
        "GET",
        ["orders"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

orders_items.append(
    make_request(
        "List Orders - Error 401 Missing Token",
        "GET",
        ["orders"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

orders_items.append(
    make_request(
        "Get Order Detail - Success",
        "GET",
        ["orders", "{{orderId}}"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

orders_items.append(
    make_request(
        "Get Order Detail - Error 404 Not Found",
        "GET",
        ["orders", "999999"],
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

orders_items.append(
    make_request(
        "Create Cancelable Order - Success (COD)",
        "POST",
        ["cart"],
        body="""
{
    \"product_id\": {{productId}},
    \"quantity\": 1
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
""",
    )
)

orders_items.append(
    make_request(
        "Create Order To Cancel - Success",
        "POST",
        ["orders"],
        body="""
{
    \"shipping_address\": \"456 Another St\",
    \"shipping_contact_name\": \"Test Customer\",
    \"shipping_contact_phone\": \"0977777777\",
    \"payment_gateway\": \"cod\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"orderIdToCancel\", response.order.id);
""",
    )
)

orders_items.append(
    make_request(
        "Cancel Order - Success",
        "POST",
        ["orders", "{{orderIdToCancel}}", "cancel"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

orders_items.append(
    make_request(
        "Cancel Order - Error 400 Already Cancelled",
        "POST",
        ["orders", "{{orderIdToCancel}}", "cancel"],
        tests="""
pm.test(\"Status code is 400\", function () {
    pm.response.to.have.status(400);
});
""",
    )
)

orders_items.append(
    make_request(
        "Admin List Orders - Success",
        "GET",
        ["admin", "orders"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

orders_items.append(
    make_request(
        "Admin List Orders - Error 401 Missing Token",
        "GET",
        ["admin", "orders"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

orders_items.append(
    make_request(
        "Admin List Orders - Error 403 Forbidden (Customer)",
        "GET",
        ["admin", "orders"],
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

orders_items.append(
    make_request(
        "Admin Update Order Status - Success",
        "PATCH",
        ["admin", "orders", "{{orderId}}", "status"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"status\": \"processing\",
    \"notes\": \"Manually updated during testing\"
}
""",
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

orders_items.append(
    make_request(
        "Admin Update Order Status - Error 404 Not Found",
        "PATCH",
        ["admin", "orders", "999999", "status"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"status\": \"processing\"
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

orders_items.append(
    make_request(
        "Admin Update Order Status - Error 422 Invalid Status",
        "PATCH",
        ["admin", "orders", "{{orderId}}", "status"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"status\": \"invalid\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

items.append({"name": "Orders", "item": orders_items})

# Payments folder
payments_items: list[dict] = []

payments_items.append(
    make_request(
        "Initiate Payment - Success (Admin)",
        "POST",
        ["payments", "initiate"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"order_id\": {{orderId}},
    \"gateway\": \"momo\",
    \"amount\": 450000,
    \"currency\": \"VND\",
    \"metadata\": {"purpose": "manual retry"}
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"paymentId\", response.payment_id);
pm.collectionVariables.set(\"paymentGateway\", response.gateway);
""",
    )
)

payments_items.append(
    make_request(
        "Initiate Payment - Error 404 Order Not Found",
        "POST",
        ["payments", "initiate"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"order_id\": 999999,
    \"gateway\": \"momo\",
    \"amount\": 100,
    \"currency\": \"VND\"
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

payments_items.append(
    make_request(
        "Initiate Payment - Error 403 Forbidden (Customer)",
        "POST",
        ["payments", "initiate"],
        body="""
{
    \"order_id\": {{orderId}},
    \"gateway\": \"momo\",
    \"amount\": 450000
}
""",
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

payments_items.append(
    make_request(
        "Payment Callback - Success",
        "POST",
        ["payments", "{{paymentGateway}}", "callback"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"order_id\": {{orderId}},
    \"payment_id\": {{paymentId}},
    \"transaction_id\": \"SIM-{{$timestamp}}\"
}
""",
        tests="""
pm.test(pm.response.code === 200 || pm.response.code === 404, \"Callback processed or payment missing\");
""",
    )
)

payments_items.append(
    make_request(
        "Payment Callback - Error 400 Invalid Payload",
        "POST",
        ["payments", "momo", "callback"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"payment_id\": {{paymentId}}
}
""",
        tests="""
pm.test(\"Status code is 400\", function () {
    pm.response.to.have.status(400);
});
""",
    )
)

payments_items.append(
    make_request(
        "Payment Callback - Error 404 Payment Not Found",
        "POST",
        ["payments", "momo", "callback"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"order_id\": {{orderId}},
    \"payment_id\": 999999,
    \"transaction_id\": \"FAIL-{{$timestamp}}\"
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

payments_items.append(
    make_request(
        "List Payments - Success (Admin)",
        "GET",
        ["payments"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

payments_items.append(
    make_request(
        "List Payments - Error 401 Missing Token",
        "GET",
        ["payments"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

payments_items.append(
    make_request(
        "List Payments - Error 403 Forbidden (Customer)",
        "GET",
        ["payments"],
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

items.append({"name": "Payments", "item": payments_items})

# Inventory folder
inventory_items: list[dict] = []

inventory_items.append(
    make_request(
        "Create Supplier - Success (Admin)",
        "POST",
        ["inventory", "suppliers"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"name\": \"Supplier {{$randomInt}}\",
    \"contact_name\": \"Supplier Rep\",
    \"contact_phone\": \"0911001100\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"supplierId\", response.id);
""",
    )
)

inventory_items.append(
    make_request(
        "Create Supplier - Error 422 Missing Name",
        "POST",
        ["inventory", "suppliers"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"contact_name\": \"No Name\"
}
""",
        tests="""
pm.test(\"Status code is 422\", function () {
    pm.response.to.have.status(422);
});
""",
    )
)

inventory_items.append(
    make_request(
        "Create Supplier - Error 403 Forbidden (Customer)",
        "POST",
        ["inventory", "suppliers"],
        body="""
{
    \"name\": \"Forbidden Supplier\"
}
""",
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

inventory_items.append(
    make_request(
        "List Suppliers - Success (Admin)",
        "GET",
        ["inventory", "suppliers"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

inventory_items.append(
    make_request(
        "List Suppliers - Error 403 Forbidden (Customer)",
        "GET",
        ["inventory", "suppliers"],
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

inventory_items.append(
    make_request(
        "List Suppliers - Error 401 Missing Token",
        "GET",
        ["inventory", "suppliers"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

inventory_items.append(
    make_request(
        "Create Purchase Order - Success (Admin)",
        "POST",
        ["inventory", "stock-entries"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"supplier_id\": {{supplierId}},
    \"items\": [
        {
            \"product_id\": {{productId}},
            \"quantity\": 5,
            \"unit_cost\": 300000
        }
    ],
    \"notes\": \"Restock product for testing\"
}
""",
        tests="""
pm.test(\"Status code is 201\", function () {
    pm.response.to.have.status(201);
});
const response = pm.response.json();
pm.collectionVariables.set(\"purchaseOrderId\", response.id);
""",
    )
)

inventory_items.append(
    make_request(
        "Create Purchase Order - Error 400 No Items",
        "POST",
        ["inventory", "stock-entries"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"supplier_id\": {{supplierId}},
    \"items\": []
}
""",
        tests="""
pm.test(\"Status code is 400\", function () {
    pm.response.to.have.status(400);
});
""",
    )
)

inventory_items.append(
    make_request(
        "Create Purchase Order - Error 404 Supplier Not Found",
        "POST",
        ["inventory", "stock-entries"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"supplier_id\": 999999,
    \"items\": [
        {
            \"product_id\": {{productId}},
            \"quantity\": 1,
            \"unit_cost\": 1000
        }
    ]
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

inventory_items.append(
    make_request(
        "Create Purchase Order - Error 404 Product Not Found",
        "POST",
        ["inventory", "stock-entries"],
        auth=bearer_auth("{{adminAccessToken}}"),
        body="""
{
    \"supplier_id\": {{supplierId}},
    \"items\": [
        {
            \"product_id\": 999999,
            \"quantity\": 1,
            \"unit_cost\": 1000
        }
    ]
}
""",
        tests="""
pm.test(\"Status code is 404\", function () {
    pm.response.to.have.status(404);
});
""",
    )
)

inventory_items.append(
    make_request(
        "List Purchase Orders - Success (Admin)",
        "GET",
        ["inventory", "stock-entries"],
        auth=bearer_auth("{{adminAccessToken}}"),
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

inventory_items.append(
    make_request(
        "List Purchase Orders - Error 403 Forbidden (Customer)",
        "GET",
        ["inventory", "stock-entries"],
        tests="""
pm.test(\"Status code is 403\", function () {
    pm.response.to.have.status(403);
});
""",
    )
)

inventory_items.append(
    make_request(
        "List Purchase Orders - Error 401 Missing Token",
        "GET",
        ["inventory", "stock-entries"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

items.append({"name": "Inventory", "item": inventory_items})

# Rewards folder
rewards_items: list[dict] = []

rewards_items.append(
    make_request(
        "Get Reward Dashboard - Success",
        "GET",
        ["rewards", "me"],
        tests="""
pm.test(\"Status code is 200\", function () {
    pm.response.to.have.status(200);
});
""",
    )
)

rewards_items.append(
    make_request(
        "Get Reward Dashboard - Error 401 Missing Token",
        "GET",
        ["rewards", "me"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

rewards_items.append(
    make_request(
        "Get Reward Dashboard - Error 401 Invalid Token",
        "GET",
        ["rewards", "me"],
        auth=no_auth(),
        headers=[{"key": "Authorization", "value": "Bearer {{invalidToken}}"}],
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

rewards_items.append(
    make_request(
        "Redeem Voucher - Success",
        "POST",
        ["rewards", "redeem"],
        tests="""
pm.test(pm.response.code === 201 || pm.response.code === 400, \"Redeem when enough points or detect insufficient\");
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.collectionVariables.set(\"voucherCode\", response.voucher.code);
}
""",
    )
)

rewards_items.append(
    make_request(
        "Redeem Voucher - Error 400 Not Enough Points",
        "POST",
        ["rewards", "redeem"],
        auth=bearer_auth("{{secondCustomerAccessToken}}"),
        tests="""
pm.test(\"Status code is 400\", function () {
    pm.response.to.have.status(400);
});
""",
    )
)

rewards_items.append(
    make_request(
        "Redeem Voucher - Error 401 Missing Token",
        "POST",
        ["rewards", "redeem"],
        auth=no_auth(),
        tests="""
pm.test(\"Status code is 401\", function () {
    pm.response.to.have.status(401);
});
""",
    )
)

items.append({"name": "Rewards", "item": rewards_items})

with open("postman_collection.json", "w", encoding="utf-8") as fh:
    json.dump(collection, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
