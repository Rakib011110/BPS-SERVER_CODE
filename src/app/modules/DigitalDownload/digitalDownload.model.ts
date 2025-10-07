import { Schema, model } from "mongoose";
import { TSecureDownload } from "./digitalDownload.interface";

const secureDownloadSchema = new Schema<TSecureDownload>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    downloadToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDownloads: {
      type: Number,
      default: 5,
      min: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    downloadHistory: [
      {
        downloadedAt: {
          type: Date,
          default: Date.now,
        },
        ipAddress: {
          type: String,
          required: false,
        },
        userAgent: {
          type: String,
          required: false,
        },
        success: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient token lookup
secureDownloadSchema.index({ downloadToken: 1 });

// Index for cleanup of expired downloads
secureDownloadSchema.index({ expiresAt: 1 });

// Index for user downloads
secureDownloadSchema.index({ user: 1, isActive: 1 });

// Method to check if download is valid
secureDownloadSchema.methods.isValidForDownload = function () {
  return (
    this.isActive &&
    this.downloadCount < this.maxDownloads &&
    this.expiresAt > new Date()
  );
};

// Method to increment download count
secureDownloadSchema.methods.recordDownload = function (
  ipAddress?: string,
  userAgent?: string,
  success: boolean = true
) {
  this.downloadCount += 1;
  this.downloadHistory.push({
    downloadedAt: new Date(),
    ipAddress,
    userAgent,
    success,
  });

  // Deactivate if max downloads reached
  if (this.downloadCount >= this.maxDownloads) {
    this.isActive = false;
  }

  return this.save();
};

export const SecureDownload = model<TSecureDownload>(
  "SecureDownload",
  secureDownloadSchema
);
