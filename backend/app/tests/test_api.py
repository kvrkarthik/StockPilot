def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_authentication(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "ChangeMe123!"})
    assert response.status_code == 200
    assert response.json()["user"]["role"]["name"] == "Admin"


def test_product_lifecycle(client, auth_headers):
    category = client.post("/api/v1/categories", json={"name": "Hardware"}, headers=auth_headers)
    assert category.status_code == 201
    product = client.post(
        "/api/v1/products",
        json={
            "sku": "HW-001", "name": "Wireless Scanner", "category_id": category.json()["id"],
            "price": 149.99, "cost": 90, "quantity": 10, "minimum_stock": 2,
        },
        headers=auth_headers,
    )
    assert product.status_code == 201
    listed = client.get("/api/v1/products?search=Scanner", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1


def test_stock_validation(client, auth_headers):
    category_id = client.post("/api/v1/categories", json={"name": "Office"}, headers=auth_headers).json()["id"]
    product_id = client.post(
        "/api/v1/products",
        json={"sku": "OF-1", "name": "Paper", "category_id": category_id, "price": 10, "cost": 5, "quantity": 2, "minimum_stock": 1},
        headers=auth_headers,
    ).json()["id"]
    response = client.post(
        "/api/v1/inventory/movements",
        json={"product_id": product_id, "quantity": 3, "transaction_type": "stock_out"},
        headers=auth_headers,
    )
    assert response.status_code == 409

