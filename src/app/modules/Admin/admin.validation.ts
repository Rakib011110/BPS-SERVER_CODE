import { z } from "zod";

const bulkOperationValidation = z.object({
  body: z.object({
    operation: z.enum(
      ["activate", "deactivate", "delete", "feature", "unfeature"],
      {
        required_error: "Operation is required",
      }
    ),
    targetType: z.enum(["user", "product", "order"], {
      required_error: "Target type is required",
    }),
    targetIds: z
      .array(z.string(), {
        required_error: "Target IDs are required",
      })
      .min(1, "At least one target ID is required"),
    reason: z.string().optional(),
  }),
});

const updateSystemSettingsValidation = z.object({
  body: z.object({
    siteName: z.string().optional(),
    siteUrl: z.string().url().optional(),
    adminEmail: z.string().email().optional(),
    supportEmail: z.string().email().optional(),
    currency: z.string().length(3).optional(),
    taxRate: z.number().min(0).max(100).optional(),
    shippingRate: z.number().min(0).optional(),
    maintenanceMode: z.boolean().optional(),
    allowRegistrations: z.boolean().optional(),
    emailVerificationRequired: z.boolean().optional(),
    paymentGateways: z
      .object({
        sslcommerz: z
          .object({
            enabled: z.boolean().optional(),
            testMode: z.boolean().optional(),
          })
          .optional(),
        stripe: z
          .object({
            enabled: z.boolean().optional(),
            testMode: z.boolean().optional(),
          })
          .optional(),
        paypal: z
          .object({
            enabled: z.boolean().optional(),
            testMode: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
    notificationSettings: z
      .object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
      })
      .optional(),
  }),
});

const updateUserStatusValidation = z.object({
  body: z.object({
    isActive: z.boolean({
      required_error: "Active status is required",
    }),
  }),
});

const updateProductStatusValidation = z.object({
  body: z
    .object({
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    })
    .refine(
      (data) => data.isActive !== undefined || data.isFeatured !== undefined,
      {
        message:
          "At least one status field (isActive or isFeatured) is required",
      }
    ),
});

const updateOrderStatusValidation = z.object({
  body: z
    .object({
      status: z
        .enum([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "completed",
          "cancelled",
          "refunded",
        ])
        .optional(),
      paymentStatus: z
        .enum(["pending", "paid", "failed", "refunded", "partially_refunded"])
        .optional(),
    })
    .refine(
      (data) => data.status !== undefined || data.paymentStatus !== undefined,
      {
        message:
          "At least one status field (status or paymentStatus) is required",
      }
    ),
});

const updateSubscriptionStatusValidation = z.object({
  body: z.object({
    status: z.enum(["pending", "active", "inactive", "cancelled"], {
      required_error: "Status is required",
    }),
  }),
});

const exportDataValidation = z.object({
  body: z.object({
    type: z.enum(["users", "products", "orders", "analytics"], {
      required_error: "Export type is required",
    }),
    format: z.enum(["csv", "xlsx", "pdf"], {
      required_error: "Export format is required",
    }),
    dateRange: z
      .object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
      .optional(),
    filters: z.record(z.any()).optional(),
  }),
});

export const AdminValidation = {
  bulkOperationValidation,
  updateSystemSettingsValidation,
  updateUserStatusValidation,
  updateProductStatusValidation,
  updateOrderStatusValidation,
  updateSubscriptionStatusValidation,
  exportDataValidation,
};
