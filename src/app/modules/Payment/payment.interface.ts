import { Types, Document } from "mongoose";

// Payment types for e-commerce
export interface TPaymentItem {
  product?: Types.ObjectId;
  subscriptionPlan?: Types.ObjectId;
  type: "product" | "subscription";
  quantity: number;
  price: number;
  originalPrice?: number;
}

// Enhanced payment interface for e-commerce
export interface TPayment {
  _id?: Types.ObjectId;
  transactionId: string;
  user: Types.ObjectId;

  // Order reference for product/subscription purchases
  order?: Types.ObjectId;

  // Legacy course support (maintain compatibility)
  course?: Types.ObjectId;

  // Payment items (for multiple products/subscriptions)
  items: TPaymentItem[];

  // Payment amounts
  amount: number;
  originalAmount?: number;
  discountAmount?: number;

  // Payment status and tracking
  status:
    | "pending"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded"
    | "partially_refunded"
    | "pending_verification"
    | "under_review"
    | "rejected";

  // SSLCommerz specific fields
  bankTransactionId?: string;
  cardType?: string;
  cardIssuer?: string;
  verifiedAt?: Date;
  failureReason?: string;

  // Payment metadata
  paymentMethod?: string;
  paymentGateway: "sslcommerz" | "manual"; // Support SSLCOMMERZ and manual payments
  currency: string;

  // Manual payment specific fields
  manualPaymentDetails?: {
    manualTransactionId?: string;
    paymentMethodType?:
      | "bank_transfer"
      | "bkash"
      | "nagad"
      | "rocket"
      | "upay"
      | "other";
    paymentProof?: string; // File path for uploaded receipt
    adminNotes?: string;
    verificationStatus?:
      | "pending_verification"
      | "approved"
      | "rejected"
      | "under_review";
    verifiedBy?: Types.ObjectId; // Admin who verified
    verifiedAt?: Date;
    rejectionReason?: string;
  };

  // IPN validation tracking
  ipnReceived: boolean;
  ipnValidated: boolean;
  ipnValidationAttempts: number;

  // Gateway session tracking
  sessionId?: string;
  gatewayUrl?: string;

  // Customer information
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Subscription specific fields
  isSubscription: boolean;
  subscriptionId?: Types.ObjectId; // Reference to user subscription
  subscriptionPeriod?: {
    start: Date;
    end: Date;
  };

  // Installment information
  isInstallment: boolean;
  installmentPlan?: string;
  installmentNumber?: number;
  totalInstallments?: number;

  // Coupon and discount information
  couponCode?: string;
  couponDiscount: number;

  // Refund information
  refundAmount?: number;
  refundableAmount?: number;
  refundReason?: string;
  refundedAt?: Date;
  refundTransactionId?: string;

  // Digital delivery information
  downloadLinks?: Array<{
    productId: Types.ObjectId;
    downloadUrl: string;
    expiresAt: Date;
    downloadCount: number;
    maxDownloads: number;
  }>;

  // Subscription access information
  subscriptionAccess?: Array<{
    subscriptionPlanId: Types.ObjectId;
    accessGranted: boolean;
    accessStartDate: Date;
    accessEndDate: Date;
  }>;

  // Webhook and notification tracking
  webhookNotifications?: Array<{
    type: string;
    status: "sent" | "failed";
    sentAt: Date;
    response?: string;
  }>;

  // Additional metadata
  metadata?: Record<string, any>;

  // Computed properties
  isRefundable?: boolean;

  // Audit fields
  createdAt?: Date;
  updatedAt?: Date;
}

// Payment creation interface
export interface TCreatePayment {
  user: string;
  order?: string;
  course?: string; // Legacy support
  items: Omit<TPaymentItem, "_id">[];
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  customerEmail: string;
  customerPhone?: string;
  couponCode?: string;
  couponDiscount?: number;
  isSubscription?: boolean;
  subscriptionId?: string;
  isInstallment?: boolean;
  installmentPlan?: string;
  totalInstallments?: number;
  paymentGateway?: "sslcommerz";
  currency?: string;
  billingAddress?: TPayment["billingAddress"];
  metadata?: Record<string, any>;
}

// Payment session interface (for gateway initiation)
export interface TPaymentSession {
  sessionId: string;
  gatewayUrl: string;
  transactionId: string;
  amount: number;
  currency: string;
  expiresAt: Date;
}

// Payment verification interface
export interface TPaymentVerification {
  transactionId: string;
  isValid: boolean;
  gatewayResponse: Record<string, any>;
  verificationErrors?: string[];
}

// Payment webhook interface
export interface TPaymentWebhook {
  transactionId: string;
  status: string;
  gatewayData: Record<string, any>;
  signature?: string;
  timestamp: Date;
}

// Manual payment creation interface
export interface TCreateManualPayment {
  orderId: string;
  manualTransactionId: string;
  paymentMethodType:
    | "bank_transfer"
    | "bkash"
    | "nagad"
    | "rocket"
    | "upay"
    | "other";
  amountPaid: number;
  paymentProof?: string; // File path for uploaded receipt
  customerNotes?: string;
}

// Manual payment verification interface (for admin)
export interface TManualPaymentVerification {
  paymentId: string;
  action: "approve" | "reject";
  adminNotes?: string;
  rejectionReason?: string;
}

// Model interface for static methods
export interface IPaymentModel extends Document {
  // Instance methods
  markAsCompleted(gatewayResponse: Record<string, any>): Promise<TPayment>;
  markAsFailed(reason: string): Promise<TPayment>;
  processRefund(amount: number, reason: string): Promise<TPayment>;
  addDownloadLink(
    productId: string,
    downloadUrl: string,
    maxDownloads: number
  ): Promise<TPayment>;

  // Manual payment methods
  approveManualPayment(adminId: string, adminNotes?: string): Promise<TPayment>;
  rejectManualPayment(adminId: string, reason: string): Promise<TPayment>;
  grantSubscriptionAccess(
    subscriptionPlanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TPayment>;
}

// Static methods interface
export interface IPaymentStatics {
  findByTransactionId(transactionId: string): Promise<TPayment | null>;
  findByOrderId(orderId: string): Promise<TPayment[]>;
  findByUserId(userId: string): Promise<TPayment[]>;
  findBySubscriptionId(subscriptionId: string): Promise<TPayment[]>;
  generateTransactionId(): string;
  calculateRefundableAmount(paymentId: string): Promise<number>;
}
