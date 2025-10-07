export const ANALYTICS_PERIODS = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export const ANALYTICS_MESSAGES = {
  SALES_REPORT_GENERATED: "Sales report generated successfully",
  ANALYTICS_RETRIEVED: "Analytics data retrieved successfully",
  INVALID_DATE_RANGE: "Invalid date range provided",
  INSUFFICIENT_DATA: "Insufficient data for the requested period",
} as const;
