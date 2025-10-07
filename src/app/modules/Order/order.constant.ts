export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
  PENDING_VERIFICATION: "pending_verification",
  UNDER_REVIEW: "under_review",
  REJECTED: "rejected",
} as const;

export const ORDER_ITEM_TYPE = {
  PRODUCT: "product",
  SUBSCRIPTION: "subscription",
} as const;

export const PAYMENT_GATEWAY = {
  SSLCOMMERZ: "sslcommerz",
  STRIPE: "stripe",
  PAYPAL: "paypal",
  RAZORPAY: "razorpay",
} as const;

export const COUPON_TYPE = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
} as const;

export const OrderSearchableFields = [
  "orderNumber",
  "customerEmail",
  "customerPhone",
  "transactionId",
  "couponCode",
  "notes",
];

export const OrderFilterableFields = [
  "searchTerm",
  "status",
  "paymentStatus",
  "user",
  "startDate",
  "endDate",
  "minAmount",
  "maxAmount",
  "paymentMethod",
  "paymentGateway",
];
