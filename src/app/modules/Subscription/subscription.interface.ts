import { Document, Model, Types } from "mongoose";

export interface TSubscriptionPlan extends Document {
  name: string;
  description: string;
  features: string[];
  price: number;
  originalPrice?: number;
  duration: number; // in days
  durationType: "days" | "months" | "years";
  trialPeriod: number; // in days
  isActive: boolean;
  isFeatured: boolean;
  category: string;
  maxUsers?: number; // for team plans
  photoUrl?: string; // subscription plan image

  // Access control
  accessLevel: "basic" | "premium" | "enterprise";
  includedProducts: Types.ObjectId[]; // products included in this plan

  // Billing
  billingCycle: "monthly" | "quarterly" | "yearly" | "lifetime";
  setupFee?: number;

  // Analytics
  totalSubscribers: number;
  revenue: number;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  slug: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface TUserSubscription extends Document {
  user: Types.ObjectId;
  subscriptionPlan: Types.ObjectId;
  status: "active" | "inactive" | "cancelled" | "expired" | "trial" | "pending";
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  trialEndDate?: Date;
  autoRenew: boolean;

  // Payment tracking
  paymentMethod?: string;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  paymentHistory: {
    amount: number;
    paymentDate: Date;
    transactionId: string;
    status: "success" | "failed" | "pending";
  }[];

  // Cancellation
  cancellationDate?: Date;
  cancellationReason?: string;

  // Grace period
  gracePeriodEndDate?: Date;

  // Notification tracking
  renewalReminderSent?: boolean;
  finalReminderSent?: boolean;
  trialReminderSent?: boolean;
  expiryNotificationSent7Days?: boolean;
  expiryNotificationSent1Day?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlanModel extends Model<TSubscriptionPlan> {
  isPlanExists(id: string): Promise<TSubscriptionPlan | null>;
}

export interface IUserSubscriptionModel extends Model<TUserSubscription> {
  isUserSubscribed(
    userId: string,
    planId?: string
  ): Promise<TUserSubscription | null>;
  getActiveSubscription(userId: string): Promise<TUserSubscription | null>;
}

export interface TSubscriptionFilter {
  searchTerm?: string;
  category?: string;
  billingCycle?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  accessLevel?: string;
}
