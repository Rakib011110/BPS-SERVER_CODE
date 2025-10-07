// Payment status constants
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

// Payment gateway constants
export const PAYMENT_GATEWAY = {
  SSLCOMMERZ: "sslcommerz",
  MANUAL: "manual",
} as const;

// Payment type constants
export const PAYMENT_TYPE = {
  PRODUCT: "product",
  SUBSCRIPTION: "subscription",
  COURSE: "course", // Legacy support
} as const;

// Currency constants
export const SUPPORTED_CURRENCIES = {
  BDT: "BDT",
  USD: "USD",
  EUR: "EUR",
} as const;

// Manual payment status constants
export const MANUAL_PAYMENT_STATUS = {
  PENDING: "pending_verification",
  APPROVED: "approved",
  REJECTED: "rejected",
  UNDER_REVIEW: "under_review",
} as const;

// Manual payment method types
export const MANUAL_PAYMENT_TYPES = {
  BANK_TRANSFER: "bank_transfer",
  BKASH: "bkash",
  NAGAD: "nagad",
  ROCKET: "rocket",
  UPAY: "upay",
  OTHER: "other",
} as const;

// Payment method constants (from SSLCommerz)
export const PAYMENT_METHODS = {
  VISA: "visa",
  MASTERCARD: "mastercard",
  AMEX: "amex",
  BKASH: "bkash",
  ROCKET: "rocket",
  NAGAD: "nagad",
  UPAY: "upay",
  BANK_TRANSFER: "bank_transfer",
  MOBILE_BANKING: "mobile_banking",
} as const;

// Webhook notification types
export const WEBHOOK_TYPES = {
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_CANCELLED: "payment_cancelled",
  REFUND_PROCESSED: "refund_processed",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  DOWNLOAD_GRANTED: "download_granted",
} as const;

// Payment limits and constraints
export const PAYMENT_LIMITS = {
  MIN_AMOUNT: 1, // Minimum 1 BDT/USD
  MAX_AMOUNT: 500000, // Maximum 500,000 BDT or equivalent
  MAX_ITEMS_PER_PAYMENT: 50,
  MAX_REFUND_DAYS: 30, // Refund window in days
  MAX_DOWNLOAD_ATTEMPTS: 10,
  SESSION_EXPIRY_MINUTES: 30, // Payment session expiry
} as const;

// Installment plan constants
export const INSTALLMENT_PLANS = {
  MONTHLY_3: "3_months",
  MONTHLY_6: "6_months",
  MONTHLY_12: "12_months",
  WEEKLY_4: "4_weeks",
} as const;

// SSLCommerz specific constants
export const SSLCOMMERZ_CONSTANTS = {
  SUCCESS_URL_PATH: "/api/v1/payments/success",
  FAIL_URL_PATH: "/api/v1/payments/fail",
  CANCEL_URL_PATH: "/api/v1/payments/cancel",
  IPN_URL_PATH: "/api/v1/payments/ipn",

  // SSLCommerz validation statuses
  VALIDATION_STATUS: {
    VALID: "VALID",
    INVALID: "INVALID",
    VALIDATED: "VALIDATED",
    FAILED: "FAILED",
  },

  // SSLCommerz transaction statuses
  TRANSACTION_STATUS: {
    SUCCESS: "SUCCESS",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    UNATTEMPTED: "UNATTEMPTED",
  },
} as const;

// Error codes
export const PAYMENT_ERROR_CODES = {
  INVALID_AMOUNT: "INVALID_AMOUNT",
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",
  PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",
  GATEWAY_ERROR: "GATEWAY_ERROR",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  REFUND_NOT_ALLOWED: "REFUND_NOT_ALLOWED",
  INSUFFICIENT_REFUND_AMOUNT: "INSUFFICIENT_REFUND_AMOUNT",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  UNSUPPORTED_GATEWAY: "UNSUPPORTED_GATEWAY",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION_NOT_FOUND",
} as const;

// Payment success messages
export const PAYMENT_MESSAGES = {
  PAYMENT_INITIATED: "Payment session initiated successfully",
  PAYMENT_COMPLETED: "Payment completed successfully",
  PAYMENT_FAILED: "Payment failed",
  PAYMENT_CANCELLED: "Payment was cancelled",
  REFUND_PROCESSED: "Refund processed successfully",
  DOWNLOAD_LINK_GENERATED: "Download link generated successfully",
  SUBSCRIPTION_ACTIVATED: "Subscription activated successfully",
  WEBHOOK_PROCESSED: "Webhook processed successfully",
} as const;

// Validation rules
export const PAYMENT_VALIDATION = {
  TRANSACTION_ID_LENGTH: { min: 10, max: 100 },
  CUSTOMER_EMAIL_MAX_LENGTH: 100,
  CUSTOMER_PHONE_MAX_LENGTH: 20,
  COUPON_CODE_MAX_LENGTH: 50,
  FAILURE_REASON_MAX_LENGTH: 500,
  REFUND_REASON_MAX_LENGTH: 1000,
  METADATA_MAX_SIZE: 10240, // 10KB for metadata JSON
} as const;
