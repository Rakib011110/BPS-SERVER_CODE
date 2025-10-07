import mongoose, { Schema, model } from "mongoose";
import { TOrder, TOrderItem, IOrderModel } from "./order.interface";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  ORDER_ITEM_TYPE,
  PAYMENT_GATEWAY,
  COUPON_TYPE,
} from "./order.constant";

const orderItemSchema = new Schema<TOrderItem>(
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
      enum: Object.values(ORDER_ITEM_TYPE),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
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
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<TOrder, IOrderModel>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items: TOrderItem[]) {
          return items.length > 0;
        },
        message: "At least one item is required in the order",
      },
    },

    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Order status
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    // Payment details
    transactionId: {
      type: String,
      sparse: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    paymentGateway: {
      type: String,
      enum: Object.values(PAYMENT_GATEWAY),
    },
    paymentDate: {
      type: Date,
    },

    // SSLCommerz specific fields
    bankTransactionId: {
      type: String,
    },
    cardType: {
      type: String,
    },
    cardIssuer: {
      type: String,
    },
    sessionId: {
      type: String,
    },

    // Coupon details
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    couponType: {
      type: String,
      enum: Object.values(COUPON_TYPE),
    },

    // Customer details
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },

    // Order processing timestamps
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },

    // Refund details
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    refundDate: {
      type: Date,
    },
    refundTransactionId: {
      type: String,
    },

    // Digital delivery
    downloadLinks: [
      {
        product: {
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
          default: 5,
          min: 1,
        },
      },
    ],

    // Notes and tracking
    notes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },

    // Enhanced tracking information
    trackingInfo: {
      trackingNumber: {
        type: String,
        trim: true,
      },
      carrier: {
        type: String,
        trim: true,
      },
      estimatedDelivery: {
        type: Date,
      },
    },

    // Order priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Status history
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Fulfillment status
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    // Customer notifications tracking
    customerNotifications: {
      orderConfirmation: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      paymentConfirmation: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      shippingNotification: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
      deliveryNotification: {
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
    },

    // Automation flags
    automationFlags: {
      autoProcessing: {
        type: Boolean,
        default: false,
      },
      autoShipping: {
        type: Boolean,
        default: false,
      },
      requiresReview: {
        type: Boolean,
        default: false,
      },
      highRiskOrder: {
        type: Boolean,
        default: false,
      },
    },

    // Legacy automation fields (for backward compatibility)
    autoProcessingEnabled: {
      type: Boolean,
      default: false,
    },
    requiresManualReview: {
      type: Boolean,
      default: false,
    },
    fraudCheckPassed: {
      type: Boolean,
    },

    // Processing time tracking
    processingTime: {
      type: Number, // in minutes
    },
    estimatedProcessingTime: {
      type: Number,
    },

    // Delivery tracking
    deliveredAt: {
      type: Date,
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
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ transactionId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ totalAmount: 1 });

// Virtual for order age in days
orderSchema.virtual("orderAge").get(function (this: TOrder) {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = now.getTime() - created.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for order summary
orderSchema.virtual("itemsSummary").get(function (this: TOrder) {
  // Check if items exist to prevent 'Cannot read properties of undefined' error
  if (!this.items || !Array.isArray(this.items)) {
    return [];
  }
  return this.items.map((item: TOrderItem) => ({
    type: item.type,
    quantity: item.quantity,
    total: item.price * item.quantity,
  }));
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const prefix = "ORD";
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  let orderNumber: string;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    orderNumber = `${prefix}${timestamp}${random}${attempts
      .toString()
      .padStart(2, "0")}`;
    const existingOrder = await this.findOne({ orderNumber });

    if (!existingOrder) {
      return orderNumber;
    }

    attempts++;
  } while (attempts < maxAttempts);

  // Fallback to UUID-like generation if all attempts fail
  return `${prefix}${Date.now()}${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
};

// Static method to calculate order total
orderSchema.statics.calculateOrderTotal = function (
  items: TOrderItem[],
  couponDiscount: number = 0,
  tax: number = 0,
  shipping: number = 0
): number {
  const subtotal = items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  return Math.max(0, subtotal + tax + shipping - couponDiscount);
};

// Pre-save middleware to update timestamps based on status changes
orderSchema.pre("save", function (this: TOrder, next) {
  const now = new Date();

  if (this.isModified("status")) {
    switch (this.status) {
      case ORDER_STATUS.PROCESSING:
        if (!this.processedAt) this.processedAt = now;
        break;
      case ORDER_STATUS.COMPLETED:
        if (!this.completedAt) this.completedAt = now;
        break;
      case ORDER_STATUS.CANCELLED:
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }

  if (
    this.isModified("paymentStatus") &&
    this.paymentStatus === PAYMENT_STATUS.COMPLETED
  ) {
    if (!this.paymentDate) this.paymentDate = now;
  }

  next();
});

// Instance methods
orderSchema.methods.markAsCompleted = function (paymentData?: any) {
  this.status = ORDER_STATUS.COMPLETED;
  this.paymentStatus = PAYMENT_STATUS.COMPLETED;
  this.completedAt = new Date();

  if (paymentData) {
    this.transactionId = paymentData.transactionId;
    this.bankTransactionId = paymentData.bankTransactionId;
    this.cardType = paymentData.cardType;
    this.cardIssuer = paymentData.cardIssuer;
    this.paymentDate = new Date();
  }

  return this.save();
};

orderSchema.methods.markAsFailed = function (reason?: string) {
  this.status = ORDER_STATUS.CANCELLED;
  this.paymentStatus = PAYMENT_STATUS.FAILED;
  this.cancelledAt = new Date();
  this.cancellationReason = reason;

  return this.save();
};

orderSchema.methods.processRefund = function (
  amount: number,
  reason?: string,
  transactionId?: string
) {
  this.refundAmount = (this.refundAmount || 0) + amount;
  this.refundReason = reason;
  this.refundDate = new Date();
  this.refundTransactionId = transactionId;

  if (this.refundAmount >= this.totalAmount) {
    this.paymentStatus = PAYMENT_STATUS.REFUNDED;
    this.status = ORDER_STATUS.REFUNDED;
  } else {
    this.paymentStatus = PAYMENT_STATUS.PARTIALLY_REFUNDED;
  }

  return this.save();
};

export const Order = model<TOrder, IOrderModel>("Order", orderSchema);
