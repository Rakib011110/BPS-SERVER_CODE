import { Types } from "mongoose";

// Notification types
export type TNotificationType =
  | "order_confirmation"
  | "payment_successful"
  | "payment_failed"
  | "order_shipped"
  | "order_delivered"
  | "subscription_activated"
  | "subscription_renewed"
  | "subscription_expired"
  | "subscription_cancelled"
  | "subscription_renewal_reminder"
  | "subscription_trial_expiring"
  | "download_ready"
  | "account_created"
  | "password_reset"
  | "profile_updated"
  | "new_product_available"
  | "price_drop_alert"
  | "low_stock_alert"
  | "admin_alert"
  | "security_alert";

// Notification channels
export type TNotificationChannel = "email" | "sms" | "push" | "in_app";

// Notification priority levels
export type TNotificationPriority = "low" | "medium" | "high" | "critical";

// Notification status
export type TNotificationStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced";

// Email template data interface
export interface TEmailTemplateData {
  // User information
  userName?: string;
  userEmail?: string;

  // Order related data
  orderId?: string;
  orderTotal?: number;
  orderItems?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;

  // Payment related data
  paymentAmount?: number;
  paymentMethod?: string;
  transactionId?: string;

  // Subscription related data
  subscriptionName?: string;
  subscriptionPrice?: number;
  renewalDate?: Date;
  expiryDate?: Date;

  // Product related data
  productName?: string;
  productPrice?: number;
  downloadLink?: string;

  // Generic data
  message?: string;
  actionUrl?: string;
  actionText?: string;

  // Additional metadata
  [key: string]: any;
}

// SMS template data interface
export interface TSMSTemplateData {
  userName?: string;
  orderId?: string;
  amount?: number;
  message?: string;
  actionCode?: string;
  [key: string]: any;
}

// Notification template interface
export interface TNotificationTemplate {
  _id?: Types.ObjectId;
  type: TNotificationType;
  channel: TNotificationChannel;
  name: string;
  subject?: string; // For email
  template: string; // HTML for email, text for SMS
  variables: string[]; // List of template variables
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Notification interface
export interface TNotification {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  type: TNotificationType;
  channel: TNotificationChannel;
  priority: TNotificationPriority;

  // Recipient information
  recipient: {
    email?: string;
    phone?: string;
    deviceToken?: string; // For push notifications
  };

  // Notification content
  subject?: string;
  message: string;
  htmlContent?: string; // For rich email content

  // Template information
  template?: Types.ObjectId;
  templateData?: Record<string, any>;

  // Delivery information
  status: TNotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;

  // Error tracking
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // Related entities
  relatedOrder?: Types.ObjectId;
  relatedPayment?: Types.ObjectId;
  relatedSubscription?: Types.ObjectId;
  relatedProduct?: Types.ObjectId;

  // Scheduling
  scheduledAt?: Date;
  expiresAt?: Date;

  // Metadata
  metadata?: Record<string, any>;

  // Audit fields
  createdAt?: Date;
  updatedAt?: Date;
}

// Notification creation interface
export interface TCreateNotification {
  user: string;
  type: TNotificationType;
  channel: TNotificationChannel;
  priority?: TNotificationPriority;
  recipient: {
    email?: string;
    phone?: string;
    deviceToken?: string;
  };
  subject?: string;
  message: string;
  htmlContent?: string;
  template?: string;
  templateData?: Record<string, any>;
  relatedOrder?: string;
  relatedPayment?: string;
  relatedSubscription?: string;
  relatedProduct?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// Bulk notification interface
export interface TBulkNotification {
  users: string[];
  type: TNotificationType;
  channel: TNotificationChannel;
  priority?: TNotificationPriority;
  subject?: string;
  message: string;
  htmlContent?: string;
  template?: string;
  templateData?: Record<string, any>;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

// Notification preferences interface
export interface TNotificationPreferences {
  _id?: Types.ObjectId;
  user: Types.ObjectId;

  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;

  // Type preferences
  orderNotifications: boolean;
  paymentNotifications: boolean;
  subscriptionNotifications: boolean;
  productNotifications: boolean;
  marketingNotifications: boolean;
  securityNotifications: boolean;

  // Frequency settings
  digestFrequency: "immediate" | "daily" | "weekly" | "monthly";
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };

  // Marketing preferences
  marketingOptIn: boolean;
  thirdPartyOptIn: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

// Email provider interface
export interface TEmailProvider {
  send(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType: string;
    }>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// SMS provider interface
export interface TSMSProvider {
  send(options: {
    to: string;
    message: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Push notification provider interface
export interface TPushProvider {
  send(options: {
    deviceToken: string;
    title: string;
    body: string;
    data?: Record<string, any>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Notification delivery result
export interface TNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryable?: boolean;
}

// Model interfaces for static methods
export interface INotificationModel {
  // Instance methods
  retry(): Promise<TNotification>;
  markAsRead(): Promise<TNotification>;
  markAsDelivered(): Promise<TNotification>;
  markAsFailed(error: string): Promise<TNotification>;
}

export interface INotificationStatics {
  findPendingNotifications(limit?: number): Promise<TNotification[]>;
  findByUser(userId: string): Promise<TNotification[]>;
  findByType(type: TNotificationType): Promise<TNotification[]>;
  markAllAsRead(userId: string): Promise<number>;
  getUnreadCount(userId: string): Promise<number>;
  cleanupExpiredNotifications(): Promise<number>;
}
