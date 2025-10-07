import { Schema, model } from "mongoose";
import { TActivityLog, TSystemSettings } from "./admin.interface";

// Activity Log Schema
const activityLogSchema = new Schema<TActivityLog>(
  {
    adminUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: {
        type: String,
        enum: ["user", "product", "order", "subscription", "system"],
        required: true,
      },
      id: {
        type: String,
        required: true,
      },
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for activity logs
activityLogSchema.index({ adminUser: 1, createdAt: -1 });
activityLogSchema.index({ "target.type": 1, "target.id": 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

// System Settings Schema
const systemSettingsSchema = new Schema<TSystemSettings>(
  {
    siteName: {
      type: String,
      required: true,
      default: "BPS E-Commerce",
    },
    siteUrl: {
      type: String,
      required: true,
      default: "https://localhost:3000",
    },
    adminEmail: {
      type: String,
      required: true,
      default: "admin@bps-ecommerce.com",
    },
    supportEmail: {
      type: String,
      required: true,
      default: "support@bps-ecommerce.com",
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    shippingRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistrations: {
      type: Boolean,
      default: true,
    },
    emailVerificationRequired: {
      type: Boolean,
      default: true,
    },
    paymentGateways: {
      sslcommerz: {
        enabled: {
          type: Boolean,
          default: true,
        },
        testMode: {
          type: Boolean,
          default: true,
        },
      },
      manual: {
        enabled: {
          type: Boolean,
          default: true,
        },
        requiresApproval: {
          type: Boolean,
          default: true,
        },
      },
    },
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const ActivityLog = model<TActivityLog>(
  "ActivityLog",
  activityLogSchema
);
export const SystemSettings = model<TSystemSettings>(
  "SystemSettings",
  systemSettingsSchema
);
