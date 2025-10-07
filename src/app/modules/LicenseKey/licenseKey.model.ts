import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { TLicenseKey, ILicenseKeyModel } from "./licenseKey.interface";
import {
  LICENSE_STATUS,
  LICENSE_TYPE,
  LICENSE_KEY_PREFIX,
  DEFAULT_LICENSE_SETTINGS,
} from "./licenseKey.constant";

const licenseKeySchema = new Schema<TLicenseKey>(
  {
    licenseKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    licenseType: {
      type: String,
      enum: Object.values(LICENSE_TYPE),
      required: true,
    },
    maxActivations: {
      type: Number,
      required: true,
    },
    currentActivations: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(LICENSE_STATUS),
      default: LICENSE_STATUS.ACTIVE,
      index: true,
    },
    isActivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    activatedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    activationHistory: [
      {
        deviceId: {
          type: String,
          required: true,
        },
        deviceName: String,
        activatedAt: {
          type: Date,
          required: true,
        },
        deactivatedAt: Date,
        ipAddress: String,
        userAgent: String,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
licenseKeySchema.index({ licenseKey: 1 });
licenseKeySchema.index({ product: 1, user: 1 });
licenseKeySchema.index({ status: 1, expiresAt: 1 });
licenseKeySchema.index({ "activationHistory.deviceId": 1 });

// Static method to generate license key
licenseKeySchema.statics.generateLicenseKey = function (): string {
  const timestamp = Date.now().toString(36);
  const randomPart = uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase();
  return `${LICENSE_KEY_PREFIX}-${timestamp}-${randomPart}`;
};

// Static method to check if license key exists
licenseKeySchema.statics.isLicenseKeyExists = async function (
  licenseKey: string
): Promise<TLicenseKey | null> {
  return await this.findOne({ licenseKey });
};

// Static method to validate license key
licenseKeySchema.statics.validateLicenseKey = async function (
  licenseKey: string,
  deviceId: string
): Promise<boolean> {
  const license = await this.findOne({ licenseKey }).populate("product user");

  if (!license) return false;

  // Check if license is active
  if (license.status !== LICENSE_STATUS.ACTIVE) return false;

  // Check if license has expired
  if (license.expiresAt && new Date() > license.expiresAt) {
    // Auto-update status to expired
    license.status = LICENSE_STATUS.EXPIRED;
    await license.save();
    return false;
  }

  // Check if device is already activated
  const deviceActivation = license.activationHistory.find(
    (activation: any) =>
      activation.deviceId === deviceId && !activation.deactivatedAt
  );

  if (deviceActivation) return true;

  // Check if max activations reached
  if (license.currentActivations >= license.maxActivations) return false;

  return true;
};

// Instance method to activate license
licenseKeySchema.methods.activateDevice = async function (deviceData: {
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Check if device is already activated
  const existingActivation = this.activationHistory.find(
    (activation: any) =>
      activation.deviceId === deviceData.deviceId && !activation.deactivatedAt
  );

  if (existingActivation) {
    throw new Error("Device already activated");
  }

  // Check if max activations reached
  if (this.currentActivations >= this.maxActivations) {
    throw new Error("Maximum activations reached");
  }

  // Add activation record
  this.activationHistory.push({
    deviceId: deviceData.deviceId,
    deviceName: deviceData.deviceName,
    activatedAt: new Date(),
    ipAddress: deviceData.ipAddress,
    userAgent: deviceData.userAgent,
  });

  this.currentActivations += 1;

  if (!this.isActivated) {
    this.isActivated = true;
    this.activatedAt = new Date();
  }

  await this.save();
  return this;
};

// Instance method to deactivate device
licenseKeySchema.methods.deactivateDevice = async function (deviceId: string) {
  const activation = this.activationHistory.find(
    (activation: any) =>
      activation.deviceId === deviceId && !activation.deactivatedAt
  );

  if (!activation) {
    throw new Error("Device not found in activation history");
  }

  activation.deactivatedAt = new Date();
  this.currentActivations = Math.max(0, this.currentActivations - 1);

  await this.save();
  return this;
};

export const LicenseKey = model<TLicenseKey, ILicenseKeyModel>(
  "LicenseKey",
  licenseKeySchema
);
