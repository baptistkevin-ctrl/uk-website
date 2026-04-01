# API Reference

Base URL: `https://uk-grocery-store.vercel.app/api`

All endpoints return JSON. Error responses follow the format `{ "error": "Human-readable message" }`. Internal error details are never leaked to clients.

## Common Status Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | Success                          |
| 201  | Created                          |
| 400  | Bad request / validation failure |
| 401  | Unauthorized (not signed in)     |
| 403  | Forbidden (insufficient role)    |
| 404  | Not found                        |
| 429  | Rate limited                     |
| 500  | Internal server error            |

## Rate Limits

Rate limits are enforced per IP address. When exceeded, the response includes `X-RateLimit-*` headers.

| Endpoint                 | Limit           |
|--------------------------|-----------------|
| `GET /api/search`        | 30 req / min    |
| `POST /api/reviews`      | Config-based    |
| `POST /api/orders/track` | 5 req / min     |
| `POST /api/coupons/validate` | 20 req / min |

---

## Public Endpoints

### Products

#### `GET /api/products`

List products with optional filtering and pagination.

**Query Parameters:**

| Param            | Type    | Default | Description                        |
|------------------|---------|---------|------------------------------------|
| `category`       | UUID    | -       | Filter by category ID              |
| `includeInactive`| boolean | false   | Include soft-deleted products       |
| `limit`          | integer | 50      | Page size (max 200)                |
| `offset`         | integer | 0       | Pagination offset                  |

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "Organic Bananas",
    "slug": "organic-bananas",
    "price_pence": 149,
    "compare_at_price_pence": null,
    "stock_quantity": 200,
    "image_url": "https://...",
    "is_active": true,
    "product_categories": [{ "categories": { "id": "uuid", "name": "Fruits" } }],
    "vendors": { "id": "uuid", "store_name": "Fresh Farm" }
  }
]
```

**Headers:**
- `X-Total-Count` - total number of matching products
- `Cache-Control: public, s-maxage=120, stale-while-revalidate=300`

#### `POST /api/products`

Create a new product. Requires admin or vendor role.

**Auth:** `requireAdmin()` or `requireVendor()`

**Request Body:** Validated against `productCreateSchema` (Zod). Key fields:

| Field                     | Type     | Required | Description                     |
|---------------------------|----------|----------|---------------------------------|
| `name`                    | string   | yes      | Product name                    |
| `slug`                    | string   | yes      | URL-friendly slug (unique)      |
| `price_pence`             | integer  | yes      | Price in pence                  |
| `description`             | string   | no       | Full description (HTML allowed) |
| `short_description`       | string   | no       | Brief description (plain text)  |
| `sku`                     | string   | no       | Stock keeping unit (unique)     |
| `stock_quantity`          | integer  | no       | Inventory count                 |
| `image_url`               | string   | no       | Primary image URL               |
| `images`                  | string[] | no       | Additional image URLs           |
| `brand`                   | string   | no       | Brand name                      |
| `is_vegan`                | boolean  | no       | Dietary flag                    |
| `is_vegetarian`           | boolean  | no       | Dietary flag                    |
| `is_gluten_free`          | boolean  | no       | Dietary flag                    |
| `is_organic`              | boolean  | no       | Dietary flag                    |
| `vendor_id`               | UUID     | no       | Auto-set for vendor users       |

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "name": "Organic Bananas",
  "slug": "organic-bananas",
  "price_pence": 149,
  "..."
}
```

#### `GET /api/products/[id]`

Get a single product by ID. Returns the product with its categories and vendor info.

**Response:** `200 OK` - single product object  
**Response:** `404 Not Found` - `{ "error": "Product not found" }`

---

### Search

#### `GET /api/search`

Full-text product search with faceted filtering.

**Rate Limit:** 30 requests per minute per IP.

**Query Parameters:**

| Param        | Type    | Default    | Description                                   |
|--------------|---------|------------|-----------------------------------------------|
| `q`          | string  | ""         | Search query (max 200 chars)                  |
| `page`       | integer | 1          | Page number (max 100)                         |
| `limit`      | integer | 20         | Results per page (max 50)                     |
| `sort`       | string  | "relevance"| Sort: relevance, price_asc, price_desc, rating, newest, popular |
| `category`   | string  | -          | Category slug                                 |
| `minPrice`   | integer | -          | Minimum price in pence                        |
| `maxPrice`   | integer | -          | Maximum price in pence                        |
| `inStock`    | boolean | false      | Only in-stock products                        |
| `onSale`     | boolean | false      | Only products with compare_at_price           |
| `organic`    | boolean | false      | Organic products only                         |
| `vegan`      | boolean | false      | Vegan products only                           |
| `vegetarian` | boolean | false      | Vegetarian products only                      |
| `glutenFree` | boolean | false      | Gluten-free products only                     |
| `brand`      | string  | -          | Filter by brand name                          |
| `vendor`     | UUID    | -          | Filter by vendor ID                           |

**Response:** `200 OK`

```json
{
  "products": [ ... ],
  "total": 142,
  "page": 1,
  "totalPages": 8,
  "facets": {
    "categories": [{ "id": "uuid", "name": "Fruits", "slug": "fruits" }],
    "brands": ["Organic Valley", "Tesco"],
    "priceRange": { "min": 49, "max": 9999 }
  },
  "query": "bananas"
}
```

---

### Reviews

#### `GET /api/reviews`

Get reviews for a product.

**Query Parameters:**

| Param        | Type    | Default  | Description                                     |
|--------------|---------|----------|-------------------------------------------------|
| `product_id` | UUID    | required | Product to fetch reviews for                    |
| `page`       | integer | 1        | Page number                                     |
| `limit`      | integer | 10       | Results per page                                |
| `sort`       | string  | "recent" | Sort: recent, helpful, rating_high, rating_low  |

**Response:** `200 OK`

```json
{
  "reviews": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "rating": 5,
      "title": "Great quality",
      "content": "Very fresh produce...",
      "is_verified_purchase": true,
      "helpful_count": 12,
      "profiles": { "full_name": "John D." },
      "created_at": "2026-03-15T10:30:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "totalPages": 3,
  "breakdown": { "1": 0, "2": 1, "3": 3, "4": 8, "5": 12 }
}
```

#### `POST /api/reviews`

Submit a product review. Requires authentication. Rate limited.

**Auth:** Authenticated user (Supabase session).

**Request Body:** Validated against `reviewCreateSchema` (Zod).

| Field        | Type     | Required | Description                     |
|--------------|----------|----------|---------------------------------|
| `product_id` | UUID     | yes      | Product being reviewed          |
| `rating`     | integer  | yes      | 1-5 star rating                 |
| `title`      | string   | no       | Review title                    |
| `content`    | string   | no       | Review body text                |
| `images`     | string[] | no       | Review image URLs               |

**Response:** `200 OK`

```json
{
  "review": { "id": "uuid", "status": "pending", "..." },
  "message": "Your review has been submitted and is pending approval"
}
```

**Errors:**
- `400` - Already reviewed this product
- `401` - Not signed in
- `429` - Rate limited

---

### Order Tracking

#### `POST /api/orders/track`

Track an order by order number and email. No authentication required (for guest orders).

**Rate Limit:** 5 requests per minute per IP.

**Request Body:**

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| `orderNumber` | string | yes      | Format: `ORD-[A-Z0-9-]+` (max 30)  |
| `email`       | string | yes      | Customer email (max 255 chars)       |

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "order_number": "ORD-ABC123",
  "status": "out_for_delivery",
  "payment_status": "paid",
  "delivery_city": "London",
  "delivery_postcode": "E1 6AN",
  "created_at": "2026-03-20T14:00:00Z",
  "confirmed_at": "2026-03-20T14:05:00Z",
  "shipped_at": "2026-03-21T09:00:00Z",
  "delivered_at": null,
  "order_items": [
    { "id": "uuid", "product_name": "Organic Bananas", "product_image_url": "...", "quantity": 2 }
  ]
}
```

**Errors:**
- `400` - Missing or invalid order number / email
- `404` - Order not found
- `429` - Rate limited

---

### Coupon Validation

#### `POST /api/coupons/validate`

Validate a coupon code. Uses the `validate_coupon()` RPC function.

**Rate Limit:** 20 requests per minute per IP.

**Request Body:**

| Field           | Type    | Required | Description                          |
|-----------------|---------|----------|--------------------------------------|
| `code`          | string  | yes      | Coupon code (alphanumeric, max 50)   |
| `subtotal_pence`| integer | no       | Cart subtotal for minimum order check|

**Response (valid):** `200 OK`

```json
{
  "valid": true,
  "coupon_id": "uuid",
  "discount_type": "percentage",
  "discount_value": 10.00,
  "discount_pence": 500,
  "code": "FRESH10",
  "description": "10% off your order"
}
```

**Response (invalid):** `200 OK`

```json
{
  "valid": false,
  "error": "Coupon has expired"
}
```

---

### Categories

#### `GET /api/categories`

List all active categories, ordered by `display_order`.

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "name": "Fruits & Vegetables",
    "slug": "fruits-vegetables",
    "image_url": "...",
    "parent_id": null,
    "display_order": 1
  }
]
```

---

### Brands

#### `GET /api/brands`

List all brands derived from active products.

**Response:** `200 OK`

```json
[
  { "brand": "Organic Valley", "product_count": 24 }
]
```

#### `GET /api/brands/[slug]`

Get products for a specific brand.

---

### Deals

#### `GET /api/deals`

List active flash deals.

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "title": "Weekend Special",
    "product_id": "uuid",
    "deal_price_pence": 199,
    "original_price_pence": 399,
    "discount_percentage": 50,
    "starts_at": "2026-04-01T00:00:00Z",
    "ends_at": "2026-04-03T23:59:59Z",
    "is_active": true
  }
]
```

---

### Newsletter

#### `POST /api/newsletter`

Subscribe to the newsletter.

**Request Body:**

| Field   | Type   | Required | Description    |
|---------|--------|----------|----------------|
| `email` | string | yes      | Email address  |

**Response:** `200 OK`

```json
{ "message": "Successfully subscribed to newsletter" }
```

---

## Admin Endpoints

All admin endpoints require `requireAdmin()` authentication.

### `GET /api/admin/dashboard`

Returns dashboard summary statistics (total orders, revenue, users, products, recent activity).

### `GET /api/admin/orders`

List all orders with filtering by status, date range, and pagination.

### `PATCH /api/admin/orders/[id]`

Update order status (confirm, process, dispatch, deliver, cancel).

### `GET /api/admin/products`

List all products including inactive. Supports search and filtering.

### `POST /api/admin/products`

Create a product (admin can set any vendor_id).

### `PATCH /api/admin/products/[id]`

Update product fields. Uses `ALLOWED_FIELDS` whitelist to prevent mass assignment.

### `GET /api/admin/users`

List all user profiles with role filtering and search.

### `PATCH /api/admin/users/[id]`

Update user role or profile fields.

### Additional Admin Endpoints

| Endpoint                          | Method    | Description                           |
|-----------------------------------|-----------|---------------------------------------|
| `/api/admin/coupons`              | GET, POST | List and create coupons               |
| `/api/admin/coupons/[id]`         | PATCH, DELETE | Update or deactivate a coupon      |
| `/api/admin/hero-slides`          | GET, POST | Manage homepage banners               |
| `/api/admin/delivery-slots`       | GET, POST | Manage delivery time slots            |
| `/api/admin/vendors`              | GET       | List all vendors                      |
| `/api/admin/vendor-applications`  | GET, PATCH| Review vendor applications            |
| `/api/admin/vendor-transfers`     | GET       | View Stripe Connect transfers         |
| `/api/admin/newsletter`           | GET       | List newsletter subscribers           |
| `/api/admin/tickets`              | GET       | List support tickets                  |
| `/api/admin/tickets/[id]`         | PATCH     | Resolve/update a ticket               |
| `/api/admin/team`                 | GET, POST | Manage admin team members             |
| `/api/admin/team/[id]`            | PATCH, DELETE | Update/remove team member          |
| `/api/admin/invoices`             | GET       | List all invoices                     |
| `/api/admin/gift-cards`           | GET, POST | Manage gift cards                     |
| `/api/admin/gift-cards/[id]`      | PATCH     | Update a gift card                    |
| `/api/admin/abandoned-carts`      | GET       | View abandoned carts                  |
| `/api/admin/audit-logs`           | GET       | View admin action audit logs          |
| `/api/admin/transactions`         | GET       | View payment transactions             |
| `/api/admin/email-templates`      | GET       | List email templates                  |
| `/api/admin/email-templates/[id]` | PATCH     | Update an email template              |
| `/api/admin/site-settings`        | GET, PATCH| Manage site-wide settings             |
| `/api/admin/security`             | GET       | View security overview                |
| `/api/admin/import-export`        | POST      | Bulk import/export products           |
| `/api/admin/questions`            | GET       | List product questions                |
| `/api/admin/questions/[id]`       | PATCH     | Answer/moderate a question            |
| `/api/admin/chatbot/*`            | Various   | Manage chatbot intents, FAQs, settings|
| `/api/admin/live-support/*`       | Various   | Manage live support conversations     |

---

## Vendor Endpoints

All vendor endpoints require `requireVendor()` authentication.

| Endpoint                            | Method    | Description                         |
|-------------------------------------|-----------|-------------------------------------|
| `/api/vendor/products`              | GET, POST | List and create vendor products     |
| `/api/vendor/orders`                | GET       | List orders containing vendor items |
| `/api/vendor/stats`                 | GET       | Sales and performance statistics    |
| `/api/vendor/reviews`               | GET       | Reviews on vendor products          |
| `/api/vendor/deals`                 | GET, POST | Manage vendor flash deals           |
| `/api/vendor/coupons`               | GET, POST | Manage vendor coupons               |
| `/api/vendor/payouts`               | GET       | View payout history                 |
| `/api/vendor/settings`              | GET, PATCH| Update vendor profile/settings      |
| `/api/vendor/stripe/connect`        | POST      | Initiate Stripe Connect onboarding  |
| `/api/vendor/stripe/onboarding`     | POST      | Complete Stripe onboarding          |
| `/api/vendor/stripe/dashboard`      | GET       | Get Stripe Express dashboard link   |
