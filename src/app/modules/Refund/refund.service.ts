import httpStatus from "http-status";
import { Types } from "mongoose";
import { RefundRequest, RefundPolicy, Cancellation } from "./refund.model";
import { Order } from "../Order/order.model";
import { User } from "../User/user.model";
import { SubscriptionPlan } from "../Subscription/subscription.model";
import {
  createPayment,
  verifyPayment,
  processRefund,
  PaymentGateway,
} from "../Payment/paymentGateway.service";
import { notificationService } from "../Notification/notification.service";
import { PAYMENT_STATUS } from "../Payment/payment.constant";
import AppError from "../../error/AppError";
import {
  TRefundRequest,
  TRefundPolicy,
  TCancellation,
  TRefundStats,
  TRefundProcessRequest,
  TRefundResponse,
} from "./refund.interface";

class RefundService {
  // Create refund request
  async createRefundRequest(
    userId: string,
    orderId: string,
    refundData: {
      refundType: "full" | "partial";
      reason: string;
      items?: Array<{
        product?: string;
        subscriptionPlan?: string;
        quantity: number;
        refundAmount: number;
        reason: string;
      }>;
      customerMessage?: string;
    }
  ): Promise<TRefundRequest> {
    // Verify order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
    }).populate("items.product items.subscriptionPlan");

    if (!order) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Order not found or not eligible for refund"
      );
    }

    // Check if refund already exists
    const existingRefund = await RefundRequest.findOne({
      order: orderId,
      status: { $in: ["pending", "approved", "processing"] },
    });

    if (existingRefund) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "A refund request is already pending for this order"
      );
    }

    // Validate refund policy
    await this.validateRefundEligibility(order, refundData);

    // Calculate refund amount
    let refundAmount: number;
    let refundItems: Array<any> = [];

    if (refundData.refundType === "full") {
      refundAmount = order.totalAmount;
      refundItems = order.items.map((item: any) => ({
        product: item.product?._id,
        subscriptionPlan: item.subscriptionPlan?._id,
        quantity: item.quantity,
        refundAmount: item.price * item.quantity,
        reason: refundData.reason,
      }));
    } else {
      // Partial refund
      if (!refundData.items || refundData.items.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Items must be specified for partial refund"
        );
      }

      refundAmount = refundData.items.reduce(
        (total, item) => total + item.refundAmount,
        0
      );
      refundItems = refundData.items.map((item) => ({
        product: item.product ? new Types.ObjectId(item.product) : undefined,
        subscriptionPlan: item.subscriptionPlan
          ? new Types.ObjectId(item.subscriptionPlan)
          : undefined,
        quantity: item.quantity,
        refundAmount: item.refundAmount,
        reason: item.reason,
      }));
    }

    // Create refund request
    const refundRequest = await RefundRequest.create({
      order: orderId,
      user: userId,
      refundType: refundData.refundType,
      amount: refundAmount,
      reason: refundData.reason,
      items: refundItems,
      customerMessage: refundData.customerMessage,
      status: (await this.shouldAutoApprove(refundAmount))
        ? "approved"
        : "pending",
    });

    // Send notification to customer
    await this.sendRefundNotification(refundRequest, "created");

    // Send notification to admin if requires approval
    if (refundRequest.status === "pending") {
      await this.sendAdminRefundNotification(refundRequest);
    }

    return refundRequest;
  }

  // Process refund request (admin action)
  async processRefundRequest(
    refundId: string,
    processData: TRefundProcessRequest,
    adminUserId: string
  ): Promise<TRefundResponse> {
    const refundRequest = await RefundRequest.findById(refundId)
      .populate("order")
      .populate("user");

    if (!refundRequest) {
      throw new AppError(httpStatus.NOT_FOUND, "Refund request not found");
    }

    const { action, adminNotes, refundMethod, customerMessage } = processData;

    // Update refund request
    refundRequest.processedBy = new Types.ObjectId(adminUserId);
    refundRequest.processedAt = new Date();
    refundRequest.adminNotes = adminNotes;
    refundRequest.customerMessage = customerMessage;

    if (action === "approve") {
      refundRequest.status = "approved";
      await refundRequest.save();

      // Send approval notification
      await this.sendRefundNotification(refundRequest, "approved");

      return {
        success: true,
        refundId: refundRequest._id!.toString(),
        message: "Refund request approved successfully",
        status: "approved",
      };
    } else if (action === "reject") {
      refundRequest.status = "rejected";
      await refundRequest.save();

      // Send rejection notification
      await this.sendRefundNotification(refundRequest, "rejected");

      return {
        success: true,
        refundId: refundRequest._id!.toString(),
        message: "Refund request rejected",
        status: "rejected",
      };
    } else if (action === "process") {
      if (refundRequest.status !== "approved") {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Only approved refund requests can be processed"
        );
      }

      return await this.executeRefund(refundRequest, refundMethod);
    }

    throw new AppError(httpStatus.BAD_REQUEST, "Invalid action");
  }

  // Execute actual refund through payment gateway
  async executeRefund(
    refundRequest: any,
    refundMethod?: string
  ): Promise<TRefundResponse> {
    try {
      refundRequest.status = "processing";
      refundRequest.refundMethod = refundMethod || "original_payment";
      await refundRequest.save();

      const order = refundRequest.order;
      let gatewayResponse: any = null;
      let gatewayRefundId: string | undefined;

      // Process refund through payment gateway
      if (refundMethod === "original_payment") {
        switch (order.paymentGateway) {
          case "sslcommerz":
            gatewayResponse = await this.processSSLCommerzRefund(
              order,
              refundRequest.amount
            );
            gatewayRefundId = gatewayResponse.refund_ref_id;
            break;

          default:
            throw new Error(
              `Unsupported payment gateway: ${order.paymentGateway}`
            );
        }
      }

      // Update refund request with gateway response
      refundRequest.status = "completed";
      refundRequest.gatewayRefundId = gatewayRefundId;
      refundRequest.gatewayResponse = gatewayResponse;
      refundRequest.customerNotified = true;
      await refundRequest.save();

      // Update order status
      await this.updateOrderAfterRefund(order, refundRequest);

      // Send completion notification
      await this.sendRefundNotification(refundRequest, "completed");

      return {
        success: true,
        refundId: refundRequest._id.toString(),
        gatewayRefundId,
        amount: refundRequest.amount,
        message: "Refund processed successfully",
        status: "completed",
      };
    } catch (error: any) {
      // Mark refund as failed
      refundRequest.status = "failed";
      refundRequest.gatewayResponse = { error: error.message };
      await refundRequest.save();

      // Send failure notification
      await this.sendRefundNotification(refundRequest, "failed");

      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Refund processing failed: ${error.message}`
      );
    }
  }

  // Create cancellation request
  async createCancellation(
    userId: string,
    cancellationData: {
      type: "order" | "subscription";
      targetId: string;
      reason: string;
      cancellationType?: "immediate" | "end_of_period" | "scheduled";
      scheduledDate?: Date;
    }
  ): Promise<TCancellation> {
    const {
      type,
      targetId,
      reason,
      cancellationType = "immediate",
      scheduledDate,
    } = cancellationData;

    // Verify target exists and belongs to user
    let target: any;
    let refundEligible = false;
    let refundAmount = 0;

    if (type === "order") {
      target = await Order.findOne({ _id: targetId, user: userId });
      if (!target) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
      }

      // Check if order can be cancelled
      if (["completed", "cancelled", "refunded"].includes(target.status)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Order cannot be cancelled in its current status"
        );
      }

      refundEligible = target.paymentStatus === PAYMENT_STATUS.COMPLETED;
      refundAmount = refundEligible ? target.totalAmount : 0;
    } else {
      target = await SubscriptionPlan.findOne({ _id: targetId, user: userId });
      if (!target) {
        throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
      }

      // Check if subscription can be cancelled
      if (["cancelled", "expired"].includes(target.status)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Subscription is already cancelled or expired"
        );
      }

      // Calculate prorated refund if applicable
      refundEligible = await this.calculateSubscriptionRefund(target);
      refundAmount = refundEligible
        ? await this.calculateProratedAmount(target)
        : 0;
    }

    // Create cancellation request
    const cancellation = await Cancellation.create({
      [type]: targetId,
      user: userId,
      type,
      reason,
      cancellationType,
      scheduledDate,
      refundEligible,
      refundAmount,
      status: "requested",
    });

    // Send notification
    await this.sendCancellationNotification(cancellation, "created");

    return cancellation;
  }

  // Process cancellation (admin action)
  async processCancellation(
    cancellationId: string,
    action: "approve" | "reject",
    adminNotes?: string,
    adminUserId?: string
  ): Promise<void> {
    const cancellation = await Cancellation.findById(cancellationId)
      .populate("order")
      .populate("subscription")
      .populate("user");

    if (!cancellation) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Cancellation request not found"
      );
    }

    cancellation.status = action === "approve" ? "approved" : "rejected";
    cancellation.adminNotes = adminNotes;
    cancellation.processedBy = adminUserId
      ? new Types.ObjectId(adminUserId)
      : undefined;
    cancellation.processedAt = new Date();

    await cancellation.save();

    if (action === "approve") {
      // Execute cancellation
      await this.executeCancellation(cancellation);

      // Create refund request if eligible
      if (cancellation.refundEligible && cancellation.refundAmount! > 0) {
        await this.createRefundFromCancellation(cancellation);
      }
    }

    // Send notification
    await this.sendCancellationNotification(cancellation, action);
  }

  // Get refund statistics
  async getRefundStats(dateFrom?: Date, dateTo?: Date): Promise<TRefundStats> {
    const matchStage: any = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = dateFrom;
      if (dateTo) matchStage.createdAt.$lte = dateTo;
    }

    const [stats] = await RefundRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: 1 },
          totalRefundAmount: { $sum: "$amount" },
          pendingRefunds: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          approvedRefunds: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejectedRefunds: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          completedRefunds: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          averageRefundAmount: { $avg: "$amount" },
        },
      },
    ]);

    // Get refunds by reason
    const refundsByReason = await RefundRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$reason",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          reason: "$_id",
          count: 1,
          totalAmount: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      totalRefunds: stats?.totalRefunds || 0,
      totalRefundAmount: stats?.totalRefundAmount || 0,
      pendingRefunds: stats?.pendingRefunds || 0,
      approvedRefunds: stats?.approvedRefunds || 0,
      rejectedRefunds: stats?.rejectedRefunds || 0,
      completedRefunds: stats?.completedRefunds || 0,
      averageRefundAmount: stats?.averageRefundAmount || 0,
      refundsByReason,
      refundsByGateway: [], // Placeholder - would need order data joined
    };
  }

  // Helper Methods
  private async validateRefundEligibility(
    order: any,
    refundData: any
  ): Promise<void> {
    // Check refund window based on product types
    const productTypes = order.items.map((item: any) => {
      if (item.product) return "digital"; // Assuming digital products
      if (item.subscriptionPlan) return "subscription";
      return "digital";
    });

    for (const productType of productTypes) {
      const policy = await RefundPolicy.findOne({
        productType,
        isActive: true,
      });

      if (policy) {
        const orderDate = new Date(order.createdAt);
        const windowEnd = new Date(
          orderDate.getTime() + policy.refundWindow * 24 * 60 * 60 * 1000
        );

        if (new Date() > windowEnd) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Refund window expired for ${productType} products`
          );
        }

        if (
          !policy.allowPartialRefunds &&
          refundData.refundType === "partial"
        ) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Partial refunds not allowed for ${productType} products`
          );
        }
      }
    }
  }

  private async shouldAutoApprove(amount: number): Promise<boolean> {
    const policy = await RefundPolicy.findOne({ isActive: true });
    return policy ? amount <= policy.autoApproveThreshold : false;
  }

  private async processSSLCommerzRefund(
    order: any,
    amount: number
  ): Promise<any> {
    // Placeholder for SSLCommerz refund API integration
    return {
      status: "VALID",
      refund_ref_id: `REF_${Date.now()}`,
      refund_amount: amount,
    };
  }

  private async updateOrderAfterRefund(
    order: any,
    refundRequest: any
  ): Promise<void> {
    if (refundRequest.refundType === "full") {
      order.status = "refunded";
      order.paymentStatus = "refunded";
    } else {
      order.paymentStatus = "partially_refunded";
    }
    await order.save();
  }

  private async executeCancellation(cancellation: any): Promise<void> {
    if (cancellation.type === "order") {
      const order = await Order.findById(cancellation.order);
      if (order) {
        order.status = "cancelled";
        await order.save();
      }
    } else if (cancellation.type === "subscription") {
      const subscription = await SubscriptionPlan.findById(
        cancellation.subscription
      );
      if (subscription) {
        let updateData: any = {};

        if (cancellation.cancellationType === "immediate") {
          updateData = {
            status: "cancelled",
            endDate: new Date(),
          };
        } else if (cancellation.cancellationType === "end_of_period") {
          updateData = {
            autoRenew: false,
          };
        } else if (cancellation.cancellationType === "scheduled") {
          updateData = {
            endDate: cancellation.scheduledDate,
            autoRenew: false,
          };
        }

        await SubscriptionPlan.findByIdAndUpdate(
          cancellation.subscription,
          updateData
        );
      }
    }

    cancellation.status = "processed";
    await cancellation.save();
  }

  private async createRefundFromCancellation(cancellation: any): Promise<void> {
    const refundRequest = await RefundRequest.create({
      order: cancellation.order,
      user: cancellation.user,
      refundType: "full",
      amount: cancellation.refundAmount,
      reason: `Cancellation: ${cancellation.reason}`,
      status: "approved",
      items: [],
    });

    cancellation.refundRequest = refundRequest._id;
    await cancellation.save();
  }

  private async calculateSubscriptionRefund(
    subscription: any
  ): Promise<boolean> {
    // Logic to determine if subscription is eligible for refund
    return (
      subscription.status === "active" &&
      subscription.paymentStatus === PAYMENT_STATUS.COMPLETED
    );
  }

  private async calculateProratedAmount(subscription: any): Promise<number> {
    // Logic to calculate prorated refund amount
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const startDate = new Date(subscription.startDate);

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (subscription.price * remainingDays) / totalDays;
  }

  private async sendRefundNotification(
    refundRequest: any,
    status: string
  ): Promise<void> {
    // Implement email notification logic
    const user = refundRequest.user;
    const subject = `Refund Request ${
      status.charAt(0).toUpperCase() + status.slice(1)
    }`;

    await notificationService.createNotification({
      user: user._id.toString(),
      type: "payment_successful", // Using closest available type
      channel: "email",
      message: `Your refund request has been ${status}. Amount: $${refundRequest.amount}`,
      recipient: {
        email: user.email,
      },
      metadata: {
        refundId: refundRequest._id,
        amount: refundRequest.amount,
        status,
        customerMessage: refundRequest.customerMessage,
      },
    });
  }

  private async sendAdminRefundNotification(refundRequest: any): Promise<void> {
    // Send notification to admin
    await notificationService.createNotification({
      user: "admin", // Admin user ID - would need to be dynamic in real scenario
      type: "admin_alert",
      channel: "email",
      message: `New refund request requires approval. Amount: $${refundRequest.amount}`,
      recipient: {
        email: "admin@bps-ecommerce.com",
      },
      metadata: {
        refundId: refundRequest._id,
        amount: refundRequest.amount,
        reason: refundRequest.reason,
        customerEmail: refundRequest.user.email,
      },
    });
  }

  private async sendCancellationNotification(
    cancellation: any,
    status: string
  ): Promise<void> {
    // Implement cancellation notification logic
    const user = cancellation.user;
    const subject = `Cancellation Request ${
      status.charAt(0).toUpperCase() + status.slice(1)
    }`;

    await notificationService.createNotification({
      user: user._id.toString(),
      type: "order_confirmation", // Using closest available type
      channel: "email",
      message: `Your cancellation request has been ${status}. Type: ${cancellation.type}`,
      recipient: {
        email: user.email,
      },
      metadata: {
        cancellationId: cancellation._id,
        type: cancellation.type,
        status,
        refundEligible: cancellation.refundEligible,
        refundAmount: cancellation.refundAmount,
      },
    });
  }
}

export const refundService = new RefundService();
