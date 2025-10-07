import mongoose, { Schema, model } from "mongoose";
import {
  TSubscriptionPlan,
  TUserSubscription,
  ISubscriptionPlanModel,
  IUserSubscriptionModel,
} from "./subscription.interface";
import {
  BILLING_CYCLE,
  SUBSCRIPTION_STATUS,
  ACCESS_LEVEL,
  DURATION_TYPE,
  SUBSCRIPTION_CATEGORIES,
} from "./subscription.constant";

// Subscription Plan Schema
const subscriptionPlanSchema = new Schema<
  TSubscriptionPlan,
  ISubscriptionPlanModel
>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    features: {
      type: [String],
      required: true,
      validate: {
        validator: function (features: string[]) {
          return features.length > 0;
        },
        message: "At least one feature is required",
      },
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
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    durationType: {
      type: String,
      enum: Object.values(DURATION_TYPE),
      default: DURATION_TYPE.MONTHS,
    },
    trialPeriod: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: Object.values(SUBSCRIPTION_CATEGORIES),
      required: true,
    },
    maxUsers: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Access control
    accessLevel: {
      type: String,
      enum: Object.values(ACCESS_LEVEL),
      default: ACCESS_LEVEL.BASIC,
    },
    includedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Billing
    billingCycle: {
      type: String,
      enum: Object.values(BILLING_CYCLE),
      required: true,
    },
    setupFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Analytics
    totalSubscribers: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SEO
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// User Subscription Schema
const userSubscriptionSchema = new Schema<
  TUserSubscription,
  IUserSubscriptionModel
>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionPlan: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
      default: SUBSCRIPTION_STATUS.INACTIVE,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    nextBillingDate: {
      type: Date,
      required: true,
    },
    trialEndDate: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },

    // Payment tracking
    paymentMethod: {
      type: String,
      trim: true,
    },
    lastPaymentDate: {
      type: Date,
    },
    lastPaymentAmount: {
      type: Number,
      min: 0,
    },
    paymentHistory: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paymentDate: {
          type: Date,
          required: true,
        },
        transactionId: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["success", "failed", "pending"],
          required: true,
        },
      },
    ],

    // Cancellation
    cancellationDate: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },

    // Grace period
    gracePeriodEndDate: {
      type: Date,
    },

    // Notification tracking
    renewalReminderSent: {
      type: Boolean,
      default: false,
    },
    finalReminderSent: {
      type: Boolean,
      default: false,
    },
    trialReminderSent: {
      type: Boolean,
      default: false,
    },
    expiryNotificationSent7Days: {
      type: Boolean,
      default: false,
    },
    expiryNotificationSent1Day: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Virtual for discount percentage
subscriptionPlanSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// Virtual for days remaining in subscription
userSubscriptionSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Static methods
subscriptionPlanSchema.statics.isPlanExists = async function (id: string) {
  return await SubscriptionPlan.findById(id);
};

userSubscriptionSchema.statics.isUserSubscribed = async function (
  userId: string,
  planId?: string
) {
  const query: any = {
    user: userId,
    status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL] },
  };

  if (planId) {
    query.subscriptionPlan = planId;
  }

  return await UserSubscription.findOne(query);
};

userSubscriptionSchema.statics.getActiveSubscription = async function (
  userId: string
) {
  return await UserSubscription.findOne({
    user: userId,
    status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL] },
    endDate: { $gt: new Date() },
  }).populate("subscriptionPlan");
};

// Pre-save middleware for subscription plan slug generation
subscriptionPlanSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export const SubscriptionPlan = model<
  TSubscriptionPlan,
  ISubscriptionPlanModel
>("SubscriptionPlan", subscriptionPlanSchema);

export const UserSubscription = model<
  TUserSubscription,
  IUserSubscriptionModel
>("UserSubscription", userSubscriptionSchema);
