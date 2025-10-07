import { Types } from "mongoose";

export interface TRefundRequest {
  _id?: string;
  order: Types.ObjectId;
  user: Types.ObjectId;
  refundType: "full" | "partial";
  amount: number;
  reason: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "failed";
  adminNotes?: string;

  // Refund items details
  items: Array<{
    product?: Types.ObjectId;
    subscriptionPlan?: Types.ObjectId;
    quantity: number;
    refundAmount: number;
    reason: string;
  }>;

  // Processing details
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  refundMethod: "original_payment" | "bank_transfer" | "store_credit" | "other";

  // Gateway specific data
  gatewayRefundId?: string;
  gatewayResponse?: Record<string, any>;

  // Customer communication
  customerNotified: boolean;
  customerMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface TRefundPolicy {
  _id?: string;
  productType: "digital" | "physical" | "subscription";
  refundWindow: number; // days
  allowPartialRefunds: boolean;
  autoApproveThreshold: number; // amount below which refunds are auto-approved
  requiresApproval: boolean;
  conditions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TCancellation {
  _id?: string;
  order?: Types.ObjectId;
  subscription?: Types.ObjectId;
  user: Types.ObjectId;
  type: "order" | "subscription";
  reason: string;
  status: "requested" | "approved" | "rejected" | "processed";

  // Cancellation details
  cancellationType: "immediate" | "end_of_period" | "scheduled";
  scheduledDate?: Date;
  refundEligible: boolean;
  refundAmount?: number;

  // Processing details
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  adminNotes?: string;

  // Related refund request
  refundRequest?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export interface TRefundStats {
  totalRefunds: number;
  totalRefundAmount: number;
  pendingRefunds: number;
  approvedRefunds: number;
  rejectedRefunds: number;
  completedRefunds: number;
  averageRefundAmount: number;
  refundsByReason: Array<{
    reason: string;
    count: number;
    totalAmount: number;
  }>;
  refundsByGateway: Array<{
    gateway: string;
    count: number;
    totalAmount: number;
    successRate: number;
  }>;
}

export interface TRefundProcessRequest {
  refundId: string;
  action: "approve" | "reject" | "process";
  adminNotes?: string;
  refundMethod?:
    | "original_payment"
    | "bank_transfer"
    | "store_credit"
    | "other";
  customerMessage?: string;
}

export interface TRefundResponse {
  success: boolean;
  refundId?: string;
  gatewayRefundId?: string;
  amount?: number;
  message: string;
  status?: string;
}
