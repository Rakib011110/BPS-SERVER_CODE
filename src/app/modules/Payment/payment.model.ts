import mongoose, { Schema, model, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  TPayment,
  TPaymentItem,
  IPaymentModel,
  IPaymentStatics,
} from "./payment.interface";
import {
  PAYMENT_STATUS,
  PAYMENT_GATEWAY,
  PAYMENT_TYPE,
  SUPPORTED_CURRENCIES,
  PAYMENT_LIMITS,
  WEBHOOK_TYPES,
} from "./payment.constant";

const paymentItemSchema = new Schema<TPaymentItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    subscriptionPlan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },
    type: {
      type: String,
      enum: Object.values(PAYMENT_TYPE),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: PAYMENT_LIMITS.MAX_ITEMS_PER_PAYMENT,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const billingAddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "Bangladesh" },
  },
  { _id: false }
);

const manualPaymentDetailsSchema = new Schema(
  {
    manualTransactionId: {
      type: String,
      index: true,
    },
    paymentMethodType: {
      type: String,
      enum: ["bank_transfer", "bkash", "nagad", "rocket", "upay", "other"],
    },
    paymentProof: {
      type: String, // File path for uploaded receipt/screenshot
    },
    adminNotes: String,
    verificationStatus: {
      type: String,
      enum: ["pending_verification", "approved", "rejected", "under_review"],
      default: "pending_verification",
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    rejectionReason: String,
  },
  { _id: false }
);

const downloadLinkSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    downloadUrl: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDownloads: {
      type: Number,
      default: PAYMENT_LIMITS.MAX_DOWNLOAD_ATTEMPTS,
      min: 1,
    },
  },
  { _id: false }
);

const subscriptionAccessSchema = new Schema(
  {
    subscriptionPlanId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    accessGranted: {
      type: Boolean,
      default: false,
    },
    accessStartDate: {
      type: Date,
      required: true,
    },
    accessEndDate: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const webhookNotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(WEBHOOK_TYPES),
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    response: {
      type: String,
    },
  },
  { _id: false }
);

const paymentSchema = new Schema<TPayment, IPaymentModel & IPaymentStatics>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Order reference for e-commerce
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },

    // Legacy course support
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },

    // Payment items
    items: {
      type: [paymentItemSchema],
      required: true,
      validate: {
        validator: function (items: TPaymentItem[]) {
          return (
            items.length > 0 &&
            items.length <= PAYMENT_LIMITS.MAX_ITEMS_PER_PAYMENT
          );
        },
        message: `Items must be between 1 and ${PAYMENT_LIMITS.MAX_ITEMS_PER_PAYMENT}`,
      },
    },

    // Payment amounts
    amount: {
      type: Number,
      required: true,
      min: PAYMENT_LIMITS.MIN_AMOUNT,
      max: PAYMENT_LIMITS.MAX_AMOUNT,
    },
    originalAmount: {
      type: Number,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Payment status and tracking
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    // SSLCommerz specific fields
    bankTransactionId: {
      type: String,
      index: true,
    },
    cardType: String,
    cardIssuer: String,
    verifiedAt: Date,
    failureReason: String,

    // Payment metadata
    paymentMethod: String,
    paymentGateway: {
      type: String,
      enum: Object.values(PAYMENT_GATEWAY),
      default: PAYMENT_GATEWAY.SSLCOMMERZ,
      required: true,
    },
    currency: {
      type: String,
      enum: Object.values(SUPPORTED_CURRENCIES),
      default: SUPPORTED_CURRENCIES.BDT,
      required: true,
    },

    // IPN validation tracking
    ipnReceived: {
      type: Boolean,
      default: false,
    },
    ipnValidated: {
      type: Boolean,
      default: false,
    },
    ipnValidationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Gateway session tracking
    sessionId: String,

    // Manual payment details
    manualPaymentDetails: manualPaymentDetailsSchema,
    gatewayUrl: String,

    // Customer information
    customerEmail: {
      type: String,
      required: true,
      index: true,
    },
    customerPhone: String,
    billingAddress: billingAddressSchema,

    // Subscription specific fields
    isSubscription: {
      type: Boolean,
      default: false,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscription",
    },
    subscriptionPeriod: {
      start: Date,
      end: Date,
    },

    // Installment information
    isInstallment: {
      type: Boolean,
      default: false,
    },
    installmentPlan: String,
    installmentNumber: {
      type: Number,
      min: 1,
    },
    totalInstallments: {
      type: Number,
      min: 2,
    },

    // Coupon and discount information
    couponCode: {
      type: String,
      uppercase: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Refund information
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundReason: String,
    refundedAt: Date,
    refundTransactionId: String,

    // Digital delivery information
    downloadLinks: [downloadLinkSchema],

    // Subscription access information
    subscriptionAccess: [subscriptionAccessSchema],

    // Webhook and notification tracking
    webhookNotifications: [webhookNotificationSchema],

    // Additional metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Indexes for better performance
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ paymentGateway: 1, status: 1 });
paymentSchema.index({ isSubscription: 1, subscriptionId: 1 });

// Virtual for refundable amount
paymentSchema.virtual("refundableAmount").get(function () {
  if (this.status !== PAYMENT_STATUS.COMPLETED) {
    return 0;
  }

  const refundedAmount = this.refundAmount || 0;
  return Math.max(0, this.amount - refundedAmount);
});

// Virtual for is refundable
paymentSchema.virtual("isRefundable").get(function () {
  if (this.status !== PAYMENT_STATUS.COMPLETED) {
    return false;
  }

  // Check if within refund window
  const refundWindow = PAYMENT_LIMITS.MAX_REFUND_DAYS * 24 * 60 * 60 * 1000;
  const isWithinRefundWindow =
    Date.now() - this.createdAt!.getTime() <= refundWindow;

  const refundedAmount = this.refundAmount || 0;
  const remaining = Math.max(0, this.amount - refundedAmount);

  return isWithinRefundWindow && remaining > 0;
});

// Static method to generate unique transaction ID
paymentSchema.statics.generateTransactionId = function (): string {
  const timestamp = Date.now().toString(36);
  const random = uuidv4().replace(/-/g, "").substring(0, 8);
  return `PAY_${timestamp}_${random}`.toUpperCase();
};

// Static method to find payment by transaction ID
paymentSchema.statics.findByTransactionId = function (transactionId: string) {
  return (this as any)
    .findOne({ transactionId })
    .populate("user", "name email phone")
    .populate("order")
    .populate("items.product", "title price thumbnail")
    .populate("items.subscriptionPlan", "name price billingCycle")
    .populate("subscriptionId");
};

// Static method to find payments by order ID
paymentSchema.statics.findByOrderId = function (orderId: string) {
  return (this as any)
    .find({ order: orderId })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });
};

// Static method to find payments by user ID
paymentSchema.statics.findByUserId = function (userId: string) {
  return (this as any)
    .find({ user: userId })
    .populate("order")
    .populate("items.product", "title price thumbnail")
    .populate("items.subscriptionPlan", "name price billingCycle")
    .sort({ createdAt: -1 });
};

// Static method to find payments by subscription ID
paymentSchema.statics.findBySubscriptionId = function (subscriptionId: string) {
  return (this as any)
    .find({ subscriptionId })
    .populate("user", "name email phone")
    .sort({ createdAt: -1 });
};

// Static method to calculate refundable amount
paymentSchema.statics.calculateRefundableAmount = async function (
  paymentId: string
): Promise<number> {
  const payment = await (this as any).findById(paymentId);
  if (!payment) {
    return 0;
  }

  return payment.refundableAmount || 0;
};

// Instance method to mark payment as completed
paymentSchema.methods.markAsCompleted = function (
  gatewayResponse: Record<string, any>
) {
  this.status = PAYMENT_STATUS.COMPLETED;
  this.verifiedAt = new Date();
  this.ipnValidated = true;

  // Extract gateway-specific data
  if (gatewayResponse.bank_tran_id) {
    this.bankTransactionId = gatewayResponse.bank_tran_id;
  }
  if (gatewayResponse.card_type) {
    this.cardType = gatewayResponse.card_type;
  }
  if (gatewayResponse.card_issuer) {
    this.cardIssuer = gatewayResponse.card_issuer;
  }
  if (gatewayResponse.payment_method) {
    this.paymentMethod = gatewayResponse.payment_method;
  }

  return this.save();
};

// Instance method to mark payment as failed
paymentSchema.methods.markAsFailed = function (reason: string) {
  this.status = PAYMENT_STATUS.FAILED;
  this.failureReason = reason;

  return this.save();
};

// Instance method to process refund
paymentSchema.methods.processRefund = function (
  amount: number,
  reason: string
) {
  if (amount > this.refundableAmount) {
    throw new Error("Refund amount exceeds refundable amount");
  }

  const currentRefund = this.refundAmount || 0;
  this.refundAmount = currentRefund + amount;
  this.refundReason = reason;
  this.refundedAt = new Date();

  // Update status
  if (this.refundAmount >= this.amount) {
    this.status = PAYMENT_STATUS.REFUNDED;
  } else {
    this.status = PAYMENT_STATUS.PARTIALLY_REFUNDED;
  }

  return this.save();
};

// Instance method to add download link
paymentSchema.methods.addDownloadLink = function (
  productId: string,
  downloadUrl: string,
  maxDownloads: number = PAYMENT_LIMITS.MAX_DOWNLOAD_ATTEMPTS
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  this.downloadLinks.push({
    productId: new mongoose.Types.ObjectId(productId),
    downloadUrl,
    expiresAt,
    downloadCount: 0,
    maxDownloads,
  });

  return this.save();
};

// Instance method to grant subscription access
paymentSchema.methods.grantSubscriptionAccess = function (
  subscriptionPlanId: string,
  startDate: Date,
  endDate: Date
) {
  this.subscriptionAccess.push({
    subscriptionPlanId: new mongoose.Types.ObjectId(subscriptionPlanId),
    accessGranted: true,
    accessStartDate: startDate,
    accessEndDate: endDate,
  });

  return this.save();
};

// Instance method to approve manual payment
paymentSchema.methods.approveManualPayment = function (
  adminId: string,
  adminNotes?: string
) {
  if (!this.manualPaymentDetails) {
    throw new Error("This is not a manual payment");
  }

  this.status = PAYMENT_STATUS.COMPLETED;
  this.manualPaymentDetails.verificationStatus = "approved";
  this.manualPaymentDetails.verifiedBy = new mongoose.Types.ObjectId(adminId);
  this.manualPaymentDetails.verifiedAt = new Date();
  this.verifiedAt = new Date();

  if (adminNotes) {
    this.manualPaymentDetails.adminNotes = adminNotes;
  }

  return this.save();
};

// Instance method to reject manual payment
paymentSchema.methods.rejectManualPayment = function (
  adminId: string,
  reason: string
) {
  if (!this.manualPaymentDetails) {
    throw new Error("This is not a manual payment");
  }

  this.status = PAYMENT_STATUS.REJECTED;
  this.manualPaymentDetails.verificationStatus = "rejected";
  this.manualPaymentDetails.verifiedBy = new mongoose.Types.ObjectId(adminId);
  this.manualPaymentDetails.verifiedAt = new Date();
  this.manualPaymentDetails.rejectionReason = reason;

  return this.save();
};

export const Payment = model<TPayment, Model<TPayment> & IPaymentStatics>(
  "Payment",
  paymentSchema
);
