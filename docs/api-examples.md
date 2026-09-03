# API examples

Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

## Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{"email":"admin@example.com","password":"ChangeMe123!"}
```

```json
{"access_token":"<jwt>","refresh_token":"<jwt>","token_type":"bearer","user":{"email":"admin@example.com","role":{"name":"Admin"}}}
```

## Create product

```http
POST /api/v1/products
Authorization: Bearer <access-token>
Content-Type: application/json

{"sku":"SKU-100","name":"Barcode Scanner","category_id":1,"price":149.99,"cost":90,"quantity":20,"minimum_stock":5}
```

## Pagination and filtering

`GET /api/v1/products?page=1&size=20&search=scanner&stock_status=low&sort=quantity&direction=asc`

