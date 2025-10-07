export const BILLING_CYCLE = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  TRIAL: "trial",
  PENDING: "pending",
} as const;

export const ACCESS_LEVEL = {
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
} as const;

export const DURATION_TYPE = {
  DAYS: "days",
  MONTHS: "months",
  YEARS: "years",
} as const;

export const SUBSCRIPTION_CATEGORIES = {
  CONTENT_ACCESS: "content-access",
  SOFTWARE_SAAS: "software-saas",
  PREMIUM_SUPPORT: "premium-support",
  TRAINING: "training",
  TOOLS: "tools",
  MEMBERSHIP: "membership",
  OTHER: "other",
} as const;

export const SubscriptionPlanSearchableFields = [
  "name",
  "description",
  "features",
  "category",
  "metaTitle",
  "metaDescription",
];

export const SubscriptionPlanFilterableFields = [
  "searchTerm",
  "category",
  "billingCycle",
  "minPrice",
  "maxPrice",
  "isActive",
  "isFeatured",
  "accessLevel",
];
