export const LICENSE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
  REVOKED: "revoked",
} as const;

export const LICENSE_TYPE = {
  SINGLE: "single",
  MULTIPLE: "multiple",
  UNLIMITED: "unlimited",
} as const;

export const LicenseKeySearchableFields = [
  "licenseKey",
  "status",
  "licenseType",
  "notes",
];

export const LICENSE_KEY_PREFIX = "LIC";

export const DEFAULT_LICENSE_SETTINGS = {
  SINGLE_MAX_ACTIVATIONS: 1,
  MULTIPLE_MAX_ACTIVATIONS: 5,
  UNLIMITED_MAX_ACTIVATIONS: 999999,
  DEFAULT_EXPIRY_DAYS: 365,
};

export const LICENSE_MESSAGES = {
  GENERATED: "License key generated successfully",
  ACTIVATED: "License key activated successfully",
  DEACTIVATED: "License key deactivated successfully",
  NOT_FOUND: "License key not found",
  INVALID: "Invalid license key",
  EXPIRED: "License key has expired",
  MAX_ACTIVATIONS_REACHED: "Maximum activations reached for this license",
  ALREADY_ACTIVATED: "License key already activated on this device",
  NOT_ACTIVATED: "License key is not activated on this device",
  SUSPENDED: "License key is suspended",
  REVOKED: "License key has been revoked",
};
