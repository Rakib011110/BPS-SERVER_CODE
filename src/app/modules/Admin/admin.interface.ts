import { Types } from "mongoose";

// Dashboard Analytics Interface
export interface TDashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingOrders: number;
  completedOrders: number;
  refundedOrders: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  topSellingProducts: Array<{
    productId: Types.ObjectId;
    productName: string;
    totalSales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    orderId: string;
    customerName: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
  userGrowth: Array<{
    month: string;
    newUsers: number;
    totalUsers: number;
  }>;
  revenueGrowth: Array<{
    month: string;
    revenue: number;
  }>;
}

// User Management Interface
export interface TUserManagement {
  users: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    totalOrders: number;
    totalSpent: number;
    lastLoginAt?: Date;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Product Management Interface
export interface TProductManagement {
  pagination: any;
  products: Array<{
    _id: string;
    name: string;
    description: string;
    shortDescription: string;
    images: string[];
    category: {
      _id: string;
      name: string;
    };
    vendor: {
      _id: string;
      name: string;
      email: string;
    };
    price: number;
    comparePrice?: number;
    costPrice?: number;
    stock: number;
    lowStockThreshold: number;
    sku?: string;
    weight?: number;
    dimensions?: any;
    isActive: boolean;
    isFeatured: boolean;
    tags: string[];
    attributes: any[];
    seoTitle?: string;
    seoDescription?: string;
    digitalProduct?: any;
    totalSold: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    createdAt: string;
    updatedAt: string;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    stats: {
      totalActive: number;
      totalInactive: number;
      lowStockProducts: number;
      outOfStockProducts: number;
      totalRevenue: number;
    };
  };
}

// Order Management Interface
export interface TOrderManagement {
  orders: Array<{
    _id: string;
    orderNumber: string;
    customer: {
      _id: string;
      name: string;
      email: string;
    };
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// System Settings Interface
export interface TSystemSettings {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  currency: string;
  taxRate: number;
  shippingRate: number;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  emailVerificationRequired: boolean;
  paymentGateways: {
    sslcommerz: {
      enabled: boolean;
      testMode: boolean;
    };
    stripe: {
      enabled: boolean;
      testMode: boolean;
    };
    paypal: {
      enabled: boolean;
      testMode: boolean;
    };
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

// Bulk Operations Interface
export interface TBulkOperation {
  operation: "activate" | "deactivate" | "delete" | "feature" | "unfeature";
  targetType: "user" | "product" | "order";
  targetIds: string[];
  reason?: string;
}

export interface TBulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// Activity Log Interface
export interface TActivityLog {
  _id?: string;
  adminUser: Types.ObjectId;
  action: string;
  target: {
    type: "user" | "product" | "order" | "subscription" | "system";
    id: string;
  };
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Export Interfaces
export interface TExportRequest {
  type: "users" | "products" | "orders" | "analytics";
  format: "csv" | "xlsx" | "pdf";
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: Record<string, any>;
}

export interface TExportResult {
  success: boolean;
  fileName: string;
  downloadUrl: string;
  fileSize: number;
  recordCount: number;
  expiresAt: Date;
}

// Subscription Management Interface
export interface TSubscriptionManagement {
  subscriptions: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
    };
    plan: {
      _id: string;
      name: string;
      price: number;
      duration: number;
      features: string[];
    };
    paymentMethod: "sslcommerz" | "form";
    status: "active" | "expired" | "cancelled" | "pending";
    startDate: Date;
    endDate: Date;
    paymentStatus:
      | "completed"
      | "pending"
      | "failed"
      | "cancelled"
      | "refunded"
      | "partially_refunded"
      | "pending_verification"
      | "under_review"
      | "rejected";
    transactionId?: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalActive: number;
    totalExpired: number;
    totalPending: number;
    totalCancelled: number;
    monthlyRevenue: number;
    totalRevenue: number;
  };
}

export interface TSubscriptionDetails {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: any;
  };
  plan: {
    _id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    features: string[];
  };
  paymentMethod: "sslcommerz" | "form";
  status: "active" | "expired" | "cancelled" | "pending";
  startDate: Date;
  endDate: Date;
  paymentStatus:
    | "completed"
    | "pending"
    | "failed"
    | "cancelled"
    | "refunded"
    | "partially_refunded"
    | "pending_verification"
    | "under_review"
    | "rejected";
  transactionId?: string;
  amount: number;
  approvalHistory?: Array<{
    action: "approved" | "rejected";
    adminUser: string;
    reason?: string;
    timestamp: Date;
  }>;
  notificationsSent: Array<{
    type: "email" | "sms" | "ui";
    message: string;
    sentAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TUpdateSubscriptionStatus {
  subscriptionId: string;
  status: "active" | "expired" | "cancelled" | "pending";
  reason?: string;
}
