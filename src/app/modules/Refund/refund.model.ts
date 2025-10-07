import { Schema, model } from "mongoose";
import {
  TRefundRequest,
  TRefundPolicy,
  TCancellation,
} from "./refund.interface";

// Refund Request Schema
const refundRequestSchema = new Schema<TRefundRequest>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    refundType: {
      type: String,
      enum: ["full", "partial"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "completed",
        "failed",
      ],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        subscriptionPlan: {
          type: Schema.Types.ObjectId,
          ref: "SubscriptionPlan",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        refundAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        reason: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    refundMethod: {
      type: String,
      enum: ["original_payment", "bank_transfer", "store_credit", "other"],
      default: "original_payment",
    },
    gatewayRefundId: {
      type: String,
      trim: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    customerNotified: {
      type: Boolean,
      default: false,
    },
    customerMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Refund Policy Schema
const refundPolicySchema = new Schema<TRefundPolicy>(
  {
    productType: {
      type: String,
      enum: ["digital", "physical", "subscription"],
      required: true,
    },
    refundWindow: {
      type: Number,
      required: true,
      min: 0,
    },
    allowPartialRefunds: {
      type: Boolean,
      default: true,
    },
    autoApproveThreshold: {
      type: Number,
      default: 0,
      min: 0,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    conditions: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Cancellation Schema
const cancellationSchema = new Schema<TCancellation>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["order", "subscription"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed"],
      default: "requested",
    },
    cancellationType: {
      type: String,
      enum: ["immediate", "end_of_period", "scheduled"],
      default: "immediate",
    },
    scheduledDate: {
      type: Date,
    },
    refundEligible: {
      type: Boolean,
      default: false,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    refundRequest: {
      type: Schema.Types.ObjectId,
      ref: "RefundRequest",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
refundRequestSchema.index({ user: 1, status: 1 });
refundRequestSchema.index({ order: 1 });
refundRequestSchema.index({ status: 1, createdAt: -1 });
refundRequestSchema.index({ processedBy: 1 });

refundPolicySchema.index({ productType: 1, isActive: 1 });

cancellationSchema.index({ user: 1, status: 1 });
cancellationSchema.index({ type: 1, status: 1 });
cancellationSchema.index({ scheduledDate: 1 });

// Methods for RefundRequest
refundRequestSchema.methods.canBeProcessed = function () {
  return this.status === "approved";
};

refundRequestSchema.methods.isExpired = function (windowDays: number) {
  const expiryDate = new Date(
    this.createdAt.getTime() + windowDays * 24 * 60 * 60 * 1000
  );
  return new Date() > expiryDate;
};

// Methods for Cancellation
cancellationSchema.methods.canBeProcessed = function () {
  return this.status === "approved" && !this.processedAt;
};

cancellationSchema.methods.isScheduled = function () {
  return this.cancellationType === "scheduled" && this.scheduledDate;
};

export const RefundRequest = model<TRefundRequest>(
  "RefundRequest",
  refundRequestSchema
);
export const RefundPolicy = model<TRefundPolicy>(
  "RefundPolicy",
  refundPolicySchema
);
export const Cancellation = model<TCancellation>(
  "Cancellation",
  cancellationSchema
);
