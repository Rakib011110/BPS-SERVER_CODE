import { Document, Model, Types } from "mongoose";

export interface TOrderItem {
  product?: Types.ObjectId;
  subscriptionPlan?: Types.ObjectId;
  type: "product" | "subscription";
  quantity: number;
  price: number;
  originalPrice?: number;
  discountAmount?: number;
}

export interface TOrder extends Document {
  orderNumber: string;
  user: Types.ObjectId;
  items: TOrderItem[];

  // Pricing
  subtotal: number;
  tax: number;
  shipping: number;
  couponDiscount: number;
  totalAmount: number;

  // Order status
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled"
    | "refunded";
  paymentStatus:
    | "pending"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded"
    | "partially_refunded"
    | "pending_verification"
    | "under_review"
    | "rejected";

  // Payment details
  transactionId?: string;
  paymentMethod?: string;
  paymentGateway?: string;
  paymentDate?: Date;

  // SSLCommerz specific fields
  bankTransactionId?: string;
  cardType?: string;
  cardIssuer?: string;
  sessionId?: string;

  // Coupon details
  couponCode?: string;
  couponType?: "percentage" | "fixed";

  // Customer details
  customerEmail: string;
  customerPhone?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  // Shipping details
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    name?: string;
    phone?: string;
  };

  // Order processing
  processedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Refund details
  refundAmount?: number;
  refundReason?: string;
  refundDate?: Date;
  refundTransactionId?: string;

  // Digital delivery
  downloadLinks?: {
    product: Types.ObjectId;
    downloadUrl: string;
    expiresAt: Date;
    downloadCount: number;
    maxDownloads: number;
  }[];

  // Tracking and shipment
  trackingInfo?: {
    trackingNumber?: string;
    carrier?: string;
    trackingUrl?: string;
    estimatedDelivery?: Date;
    shippingMethod?: string;
    shippingCost?: number;
  };

  // Status history
  statusHistory: Array<{
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy?: Types.ObjectId;
  }>;

  // Priority and processing
  priority: "low" | "medium" | "high" | "urgent";
  processingTime?: number; // in minutes
  estimatedProcessingTime?: number;

  // Fulfillment
  fulfillmentStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "failed";
  fulfillmentNotes?: string;

  // Customer communication
  customerNotifications: {
    orderConfirmation: {
      sent: boolean;
      sentAt?: Date;
    };
    paymentConfirmation: {
      sent: boolean;
      sentAt?: Date;
    };
    shippingNotification: {
      sent: boolean;
      sentAt?: Date;
    };
    deliveryNotification: {
      sent: boolean;
      sentAt?: Date;
    };
  };

  // Automation flags
  automationFlags: {
    autoProcessing: boolean;
    autoShipping: boolean;
    requiresReview: boolean;
    highRiskOrder: boolean;
  };

  // Notes and tracking
  notes?: string;
  adminNotes?: string;
  internalNotes?: string;

  // Legacy automation fields (for backward compatibility)
  autoProcessingEnabled: boolean;
  requiresManualReview: boolean;
  fraudCheckPassed?: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsCompleted(paymentData?: any): Promise<TOrder>;
  markAsFailed(reason?: string): Promise<TOrder>;
  processRefund(
    amount: number,
    reason?: string,
    transactionId?: string
  ): Promise<TOrder>;
  updateStatus(
    status: string,
    notes?: string,
    updatedBy?: string
  ): Promise<TOrder>;
  addStatusHistory(
    status: string,
    notes?: string,
    updatedBy?: string
  ): Promise<void>;
  sendNotification(type: string, channel?: string): Promise<boolean>;
}

export interface IOrderModel extends Model<TOrder> {
  generateOrderNumber(): Promise<string>;
  calculateOrderTotal(
    items: TOrderItem[],
    couponDiscount?: number,
    tax?: number,
    shipping?: number
  ): number;
  bulkUpdateStatus(
    orderIds: string[],
    status: string,
    notes?: string
  ): Promise<any>;
  getOrdersByStatus(status: string): Promise<TOrder[]>;
  getOverdueOrders(): Promise<TOrder[]>;
  autoProcessEligibleOrders(): Promise<any>;
}

export interface TOrderFilter {
  searchTerm?: string;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  priority?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  requiresManualReview?: boolean;
}

export interface TOrderStats {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  averageProcessingTime: number;
  overdueOrders: number;
  highPriorityOrders: number;
}

export interface TBulkOrderOperation {
  orderIds: string[];
  operation:
    | "update_status"
    | "update_priority"
    | "assign_tracking"
    | "send_notifications"
    | "mark_review"
    | "bulk_cancel"
    | "bulk_refund"
    | "assign_priority";
  data: {
    status?: string;
    priority?: string;
    trackingNumber?: string;
    carrier?: string;
    notificationType?: string;
    requiresReview?: boolean;
    notes?: string;
    reason?: string;
    updatedBy?: string;
    processRefund?: boolean;
  };
}

export interface TShipmentTracking {
  _id?: string;
  order: Types.ObjectId;
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingMethod: string;
  shippingCost: number;

  // Tracking events
  events: Array<{
    status: string;
    location?: string;
    timestamp: Date;
    description?: string;
  }>;

  // Status
  currentStatus:
    | "label_created"
    | "picked_up"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "exception";
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface TOrderAutomation {
  _id?: string;
  name: string;
  description: string;
  isActive: boolean;

  // Trigger conditions
  triggers: {
    event:
      | "order_created"
      | "payment_received"
      | "status_changed"
      | "time_based";
    conditions: Record<string, any>;
  };

  // Actions to perform
  actions: Array<{
    type:
      | "update_status"
      | "send_notification"
      | "assign_tracking"
      | "create_task"
      | "webhook";
    parameters: Record<string, any>;
    delay?: number; // in minutes
  }>;

  // Statistics
  executionCount: number;
  lastExecuted?: Date;

  createdAt: Date;
  updatedAt: Date;
}
