import { Document, Model, Types } from "mongoose";

export interface TLicenseKey extends Document {
  licenseKey: string;
  product: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;

  // License details
  licenseType: "single" | "multiple" | "unlimited";
  maxActivations: number;
  currentActivations: number;

  // Status and lifecycle
  status: "active" | "inactive" | "suspended" | "expired" | "revoked";
  isActivated: boolean;
  activatedAt?: Date;
  expiresAt?: Date;

  // Usage tracking
  activationHistory: {
    deviceId: string;
    deviceName?: string;
    activatedAt: Date;
    deactivatedAt?: Date;
    ipAddress?: string;
    userAgent?: string;
  }[];

  // Metadata
  metadata?: Record<string, any>;
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  activateDevice(deviceData: {
    deviceId: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<TLicenseKey>;

  deactivateDevice(deviceId: string): Promise<TLicenseKey>;
}

export interface ILicenseKeyModel extends Model<TLicenseKey> {
  generateLicenseKey(): string;
  isLicenseKeyExists(licenseKey: string): Promise<TLicenseKey | null>;
  validateLicenseKey(licenseKey: string, deviceId: string): Promise<boolean>;
}

export interface TLicenseKeyFilter {
  searchTerm?: string;
  product?: string;
  user?: string;
  status?: string;
  licenseType?: string;
  isActivated?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TActivateLicense {
  licenseKey: string;
  deviceId: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TDeactivateLicense {
  licenseKey: string;
  deviceId: string;
  reason?: string;
}

export interface TLicenseValidation {
  isValid: boolean;
  licenseKey?: TLicenseKey;
  message: string;
  remainingActivations?: number;
}
