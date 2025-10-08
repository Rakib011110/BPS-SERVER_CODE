import { z } from "zod";
import { LICENSE_STATUS, LICENSE_TYPE } from "./licenseKey.constant";

const createLicenseKeyValidationSchema = z.object({
  body: z.object({
    product: z.string().min(1, "Product ID is required"),
    user: z.string().min(1, "User ID is required"),
    order: z.string().min(1, "Order ID is required"),
    licenseType: z.enum(["single", "multiple", "unlimited"]),
    maxActivations: z
      .number()
      .min(1, "Max activations must be at least 1")
      .optional(),
    expiresAt: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
    notes: z.string().optional(),
    manualLicenseKey: z.string().optional(),
  }),
});

const updateLicenseKeyValidationSchema = z.object({
  body: z.object({
    status: z
      .enum(["active", "inactive", "suspended", "expired", "revoked"])
      .optional(),
    maxActivations: z
      .number()
      .min(1, "Max activations must be at least 1")
      .optional(),
    expiresAt: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
    notes: z.string().optional(),
  }),
});

const activateLicenseValidationSchema = z.object({
  body: z.object({
    licenseKey: z.string().min(1, "License key is required"),
    deviceId: z.string().min(1, "Device ID is required"),
    deviceName: z.string().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }),
});

const deactivateLicenseValidationSchema = z.object({
  body: z.object({
    licenseKey: z.string().min(1, "License key is required"),
    deviceId: z.string().min(1, "Device ID is required"),
    reason: z.string().optional(),
  }),
});

const validateLicenseValidationSchema = z.object({
  body: z.object({
    licenseKey: z.string().min(1, "License key is required"),
    deviceId: z.string().min(1, "Device ID is required"),
  }),
});

const getLicenseKeysValidationSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    product: z.string().optional(),
    user: z.string().optional(),
    status: z
      .enum(["active", "inactive", "suspended", "expired", "revoked"])
      .optional(),
    licenseType: z.enum(["single", "multiple", "unlimited"]).optional(),
    isActivated: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z
      .string()
      .transform((val) => parseInt(val) || 1)
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val) || 10)
      .optional(),
    sort: z.string().optional(),
  }),
});

const extendLicenseValidationSchema = z.object({
  body: z.object({
    extensionDays: z
      .number()
      .min(1, "Extension days must be at least 1")
      .max(3650, "Extension days cannot exceed 10 years"),
  }),
});

export const LicenseKeyValidations = {
  createLicenseKeyValidationSchema,
  updateLicenseKeyValidationSchema,
  activateLicenseValidationSchema,
  deactivateLicenseValidationSchema,
  validateLicenseValidationSchema,
  getLicenseKeysValidationSchema,
  extendLicenseValidationSchema,
};
