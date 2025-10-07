# Admin API Documentation

## Overview

The Admin API provides comprehensive administrative functionality for managing the e-commerce platform. All admin endpoints require ADMIN role authentication.

## Base URL

All admin endpoints are prefixed with `/api/admin`

## Authentication

All admin endpoints require:

- Valid JWT token in Authorization header: `Bearer <token>`
- User must have ADMIN role

## Endpoints

### Dashboard Analytics

Get comprehensive dashboard statistics and metrics.

#### GET /dashboard/stats

Returns overview statistics for the admin dashboard.

**Response:**

```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "totalUsers": 1250,
    "totalOrders": 850,
    "totalRevenue": 125000,
    "totalProducts": 340,
    "totalSubscriptions": 180,
    "activeSubscriptions": 165,
    "pendingOrders": 25,
    "completedOrders": 780,
    "refundedOrders": 15,
    "monthlyRevenue": 32000,
    "weeklyRevenue": 8500,
    "dailyRevenue": 1200,
    "topSellingProducts": [...],
    "recentOrders": [...],
    "userGrowth": [...],
    "revenueGrowth": [...]
  }
}
```

### User Management

#### GET /users

Get paginated list of users with filtering options.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by user role
- `isActive` (boolean): Filter by active status
- `emailVerified` (boolean): Filter by email verification status
- `search` (string): Search in name, email, phone

#### GET /users/:userId

Get detailed information about a specific user.

#### PATCH /users/:userId/status

Update user's active status.

**Request Body:**

```json
{
  "isActive": true
}
```

### Product Management

#### GET /products

Get paginated list of products with filtering options.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `category` (string): Filter by product category
- `isActive` (boolean): Filter by active status
- `isFeatured` (boolean): Filter by featured status
- `search` (string): Search in title, description, tags

#### GET /products/:productId

Get detailed information about a specific product.

#### PATCH /products/:productId/status

Update product's status.

**Request Body:**

```json
{
  "isActive": true,
  "isFeatured": false
}
```

### Order Management

#### GET /orders

Get paginated list of orders with filtering options.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by order status
- `paymentStatus` (string): Filter by payment status
- `paymentMethod` (string): Filter by payment method
- `dateFrom` (string): Filter orders from date (ISO format)
- `dateTo` (string): Filter orders to date (ISO format)

#### GET /orders/:orderId

Get detailed information about a specific order.

#### PATCH /orders/:orderId/status

Update order status.

**Request Body:**

```json
{
  "status": "completed",
  "paymentStatus": "paid"
}
```

### Bulk Operations

#### POST /bulk-operation

Perform bulk operations on multiple entities.

**Request Body:**

```json
{
  "operation": "activate",
  "targetType": "user",
  "targetIds": ["userId1", "userId2", "userId3"],
  "reason": "Bulk activation after verification"
}
```

**Operations:**

- `activate`: Activate entities
- `deactivate`: Deactivate entities
- `delete`: Delete entities
- `feature`: Feature products (products only)
- `unfeature`: Unfeature products (products only)

**Target Types:**

- `user`: User entities
- `product`: Product entities
- `order`: Order entities

### System Settings

#### GET /settings

Get current system settings.

#### PATCH /settings

Update system settings.

**Request Body:**

```json
{
  "siteName": "BPS E-Commerce",
  "currency": "USD",
  "taxRate": 8.5,
  "maintenanceMode": false,
  "paymentGateways": {
    "stripe": {
      "enabled": true,
      "testMode": false
    }
  }
}
```

### Activity Logs

#### GET /activity-logs

Get paginated admin activity logs.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `adminUser` (string): Filter by admin user ID
- `action` (string): Filter by action type
- `targetType` (string): Filter by target type
- `dateFrom` (string): Filter from date (ISO format)
- `dateTo` (string): Filter to date (ISO format)

### Data Export

#### POST /export

Generate data exports in various formats.

**Request Body:**

```json
{
  "type": "users",
  "format": "csv",
  "dateRange": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  },
  "filters": {
    "isActive": true
  }
}
```

**Export Types:**

- `users`: User data export
- `products`: Product data export
- `orders`: Order data export
- `analytics`: Analytics data export

**Export Formats:**

- `csv`: Comma-separated values
- `xlsx`: Excel spreadsheet
- `pdf`: PDF document

### System Health

#### GET /system/health

Get system health status and metrics.

**Response:**

```json
{
  "success": true,
  "message": "System health check completed",
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "database": "connected",
    "services": {
      "users": { "count": 1250, "status": "operational" },
      "products": { "count": 340, "status": "operational" },
      "orders": { "count": 850, "status": "operational" },
      "subscriptions": { "count": 165, "status": "operational" }
    },
    "errors": {
      "last24Hours": 2,
      "status": "good"
    },
    "uptime": 86400,
    "memory": {
      "rss": 156160000,
      "heapTotal": 123904000,
      "heapUsed": 89012000,
      "external": 1024000
    }
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errorDetails": "Detailed error information",
  "stack": "Error stack trace (development only)"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Activity Logging

All admin actions are automatically logged with:

- Admin user ID
- Action type
- Target entity
- Timestamp
- IP address (if available)
- User agent (if available)
- Action details

## Pagination

Paginated endpoints include meta information:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  },
  "data": [...]
}
```

## Filtering and Search

Most list endpoints support:

- **Filtering**: Query parameters for specific field values
- **Search**: Text search across relevant fields
- **Date Range**: Filter by creation or update dates
- **Status Filtering**: Filter by various status fields

## Security Features

- Role-based access control (ADMIN only)
- Activity logging for audit trails
- Input validation and sanitization
- Rate limiting (if configured)
- CORS protection
- XSS prevention
