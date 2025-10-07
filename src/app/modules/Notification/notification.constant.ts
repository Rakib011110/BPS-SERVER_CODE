// Notification types
export const NOTIFICATION_TYPE = {
  // Order related
  ORDER_CONFIRMATION: "order_confirmation",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",

  // Payment related
  PAYMENT_SUCCESSFUL: "payment_successful",
  PAYMENT_FAILED: "payment_failed",

  // Subscription related
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  SUBSCRIPTION_EXPIRED: "subscription_expired",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  SUBSCRIPTION_RENEWAL_REMINDER: "subscription_renewal_reminder",
  SUBSCRIPTION_TRIAL_EXPIRING: "subscription_trial_expiring",

  // Product related
  DOWNLOAD_READY: "download_ready",
  NEW_PRODUCT_AVAILABLE: "new_product_available",
  PRICE_DROP_ALERT: "price_drop_alert",
  LOW_STOCK_ALERT: "low_stock_alert",

  // Account related
  ACCOUNT_CREATED: "account_created",
  PASSWORD_RESET: "password_reset",
  PROFILE_UPDATED: "profile_updated",

  // System alerts
  ADMIN_ALERT: "admin_alert",
  SECURITY_ALERT: "security_alert",
} as const;

// Notification channels
export const NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  IN_APP: "in_app",
} as const;

// Notification priority levels
export const NOTIFICATION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

// Notification status
export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
  BOUNCED: "bounced",
} as const;

// Digest frequency options
export const DIGEST_FREQUENCY = {
  IMMEDIATE: "immediate",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
} as const;

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  orderNotifications: true,
  paymentNotifications: true,
  subscriptionNotifications: true,
  productNotifications: true,
  marketingNotifications: true,
  securityNotifications: true,
  digestFrequency: DIGEST_FREQUENCY.IMMEDIATE,
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
    timezone: "Asia/Dhaka",
  },
  marketingOptIn: false,
  thirdPartyOptIn: false,
} as const;

// Email templates mapping
export const EMAIL_TEMPLATES = {
  [NOTIFICATION_TYPE.ORDER_CONFIRMATION]: {
    subject: "Order Confirmation - {{orderId}}",
    template: "order-confirmation",
  },
  [NOTIFICATION_TYPE.PAYMENT_SUCCESSFUL]: {
    subject: "Payment Successful - {{transactionId}}",
    template: "payment-success",
  },
  [NOTIFICATION_TYPE.PAYMENT_FAILED]: {
    subject: "Payment Failed - {{transactionId}}",
    template: "payment-failed",
  },
  [NOTIFICATION_TYPE.SUBSCRIPTION_ACTIVATED]: {
    subject: "Subscription Activated - {{subscriptionName}}",
    template: "subscription-activated",
  },
  [NOTIFICATION_TYPE.SUBSCRIPTION_RENEWED]: {
    subject: "Subscription Renewed - {{subscriptionName}}",
    template: "subscription-renewed",
  },
  [NOTIFICATION_TYPE.SUBSCRIPTION_EXPIRED]: {
    subject: "Subscription Expired - {{subscriptionName}}",
    template: "subscription-expired",
  },
  [NOTIFICATION_TYPE.DOWNLOAD_READY]: {
    subject: "Your Download is Ready - {{productName}}",
    template: "download-ready",
  },
  [NOTIFICATION_TYPE.ACCOUNT_CREATED]: {
    subject: "Welcome to Our Platform!",
    template: "account-created",
  },
  [NOTIFICATION_TYPE.PASSWORD_RESET]: {
    subject: "Password Reset Request",
    template: "password-reset",
  },
} as const;

// SMS templates mapping
export const SMS_TEMPLATES = {
  [NOTIFICATION_TYPE.ORDER_CONFIRMATION]:
    "Your order {{orderId}} has been confirmed. Total: {{amount}}. Thank you for your purchase!",
  [NOTIFICATION_TYPE.PAYMENT_SUCCESSFUL]:
    "Payment successful! {{amount}} has been processed for order {{orderId}}.",
  [NOTIFICATION_TYPE.PAYMENT_FAILED]:
    "Payment failed for order {{orderId}}. Please try again or contact support.",
  [NOTIFICATION_TYPE.SUBSCRIPTION_ACTIVATED]:
    "Your {{subscriptionName}} subscription is now active. Enjoy your benefits!",
  [NOTIFICATION_TYPE.SUBSCRIPTION_EXPIRED]:
    "Your {{subscriptionName}} subscription has expired. Renew now to continue enjoying benefits.",
  [NOTIFICATION_TYPE.DOWNLOAD_READY]:
    "Your {{productName}} download is ready. Check your email for the download link.",
  [NOTIFICATION_TYPE.PASSWORD_RESET]:
    "Your password reset code: {{actionCode}}. Valid for 10 minutes.",
} as const;

// Notification limits and constraints
export const NOTIFICATION_LIMITS = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MINUTES: [5, 15, 60], // Retry after 5min, 15min, 1hour
  MAX_SUBJECT_LENGTH: 200,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_SMS_LENGTH: 160,
  BATCH_SIZE: 100,
  CLEANUP_DAYS: 30, // Delete notifications older than 30 days
  RATE_LIMIT_PER_MINUTE: 100, // Max notifications per minute per user
} as const;

// Email provider types
export const EMAIL_PROVIDER = {
  NODEMAILER: "nodemailer",
  SENDGRID: "sendgrid",
  MAILGUN: "mailgun",
  SES: "ses",
} as const;

// SMS provider types
export const SMS_PROVIDER = {
  TWILIO: "twilio",
  BULK_SMS: "bulk_sms",
  NEXMO: "nexmo",
  LOCAL_SMS: "local_sms",
} as const;

// Push notification provider types
export const PUSH_PROVIDER = {
  FCM: "fcm",
  APNS: "apns",
  ONE_SIGNAL: "one_signal",
} as const;

// Notification validation rules
export const NOTIFICATION_VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]{10,}$/,
  TEMPLATE_VARIABLE_REGEX: /\{\{([^}]+)\}\}/g,
} as const;

// Error codes
export const NOTIFICATION_ERROR_CODES = {
  INVALID_RECIPIENT: "INVALID_RECIPIENT",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_TEMPLATE_DATA: "INVALID_TEMPLATE_DATA",
  NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND",
  USER_PREFERENCES_DISABLED: "USER_PREFERENCES_DISABLED",
  QUIET_HOURS_ACTIVE: "QUIET_HOURS_ACTIVE",
} as const;

// Success messages
export const NOTIFICATION_MESSAGES = {
  NOTIFICATION_SENT: "Notification sent successfully",
  NOTIFICATION_SCHEDULED: "Notification scheduled successfully",
  BULK_NOTIFICATIONS_QUEUED: "Bulk notifications queued successfully",
  PREFERENCES_UPDATED: "Notification preferences updated successfully",
  TEMPLATE_CREATED: "Notification template created successfully",
  TEMPLATE_UPDATED: "Notification template updated successfully",
  NOTIFICATIONS_MARKED_READ: "Notifications marked as read",
} as const;
