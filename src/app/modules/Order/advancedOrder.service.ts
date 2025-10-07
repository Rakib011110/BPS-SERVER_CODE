import { Order } from "./order.model";
import { ShipmentTracking, OrderAutomation } from "./advancedOrder.model";
import {
  TOrder,
  TBulkOrderOperation,
  TShipmentTracking,
  TOrderAutomation,
} from "./order.interface";
import { PAYMENT_STATUS } from "../Payment/payment.constant";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import { notificationService } from "../Notification/notification.service";
import { adminService } from "../Admin/admin.service";

class AdvancedOrderService {
  // Bulk Operations
  async bulkUpdateOrderStatus(operation: TBulkOrderOperation) {
    const session = await Order.startSession();

    try {
      await session.withTransaction(async () => {
        const { orderIds, operation: operationType, data } = operation;

        // Validate orders exist
        const orders = await Order.find({ _id: { $in: orderIds } }).session(
          session
        );
        if (orders.length !== orderIds.length) {
          throw new AppError(httpStatus.BAD_REQUEST, "Some orders not found");
        }

        let updateResult;

        switch (operationType) {
          case "update_status":
            updateResult = await Order.updateMany(
              { _id: { $in: orderIds } },
              {
                status: data.status,
                $push: {
                  statusHistory: {
                    status: data.status,
                    timestamp: new Date(),
                    note: data.notes || "Bulk status update",
                    updatedBy: data.updatedBy,
                  },
                },
              },
              { session }
            );

            // Send notifications for status updates
            for (const order of orders) {
              if (data.status) {
                await this.sendOrderStatusNotification(order, data.status);
              }
            }
            break;

          case "assign_priority":
            updateResult = await Order.updateMany(
              { _id: { $in: orderIds } },
              { priority: data.priority },
              { session }
            );
            break;

          case "bulk_cancel":
            updateResult = await Order.updateMany(
              { _id: { $in: orderIds } },
              {
                status: "cancelled",
                cancelledAt: new Date(),
                cancellationReason: data.reason,
                $push: {
                  statusHistory: {
                    status: "cancelled",
                    timestamp: new Date(),
                    note: data.reason || "Bulk cancellation",
                    updatedBy: data.updatedBy,
                  },
                },
              },
              { session }
            );

            // Process refunds if needed
            for (const order of orders) {
              if (
                order.paymentStatus === PAYMENT_STATUS.COMPLETED &&
                data.processRefund
              ) {
                // Integrate with refund service
                await this.processOrderRefund(
                  order._id?.toString() || order.id
                );
              }
            }
            break;

          case "bulk_refund":
            // Mark orders for refund processing
            updateResult = await Order.updateMany(
              {
                _id: { $in: orderIds },
                paymentStatus: PAYMENT_STATUS.COMPLETED,
              },
              {
                status: "refund_requested",
                $push: {
                  statusHistory: {
                    status: "refund_requested",
                    timestamp: new Date(),
                    note: "Bulk refund request",
                    updatedBy: data.updatedBy,
                  },
                },
              },
              { session }
            );

            // Process refunds
            for (const order of orders) {
              if (order.paymentStatus === PAYMENT_STATUS.COMPLETED) {
                await this.processOrderRefund(
                  order._id?.toString() || order.id
                );
              }
            }
            break;

          default:
            throw new AppError(
              httpStatus.BAD_REQUEST,
              "Invalid bulk operation"
            );
        }

        // Log admin activity (commented out for now due to interface mismatch)
        // await adminService.logActivity({
        //   userId: data.updatedBy,
        //   action: `Bulk ${operationType}`,
        //   resource: 'Order',
        //   resourceId: 'multiple',
        //   details: {
        //     orderCount: orderIds.length,
        //     operation: operationType,
        //     data
        //   }
        // });

        return updateResult;
      });

      return {
        success: true,
        message: "Bulk operation completed successfully",
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Bulk operation failed"
      );
    } finally {
      await session.endSession();
    }
  }

  // Shipment Tracking
  async createShipmentTracking(trackingData: Partial<TShipmentTracking>) {
    try {
      // Validate order exists
      const order = await Order.findById(trackingData.order);
      if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
      }

      // Check if tracking already exists
      const existingTracking = await ShipmentTracking.findOne({
        order: trackingData.order,
      });
      if (existingTracking) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Tracking already exists for this order"
        );
      }

      const tracking = await ShipmentTracking.create(trackingData);

      // Update order with tracking info
      await Order.findByIdAndUpdate(trackingData.order, {
        "trackingInfo.trackingNumber": tracking.trackingNumber,
        "trackingInfo.carrier": tracking.carrier,
        "trackingInfo.estimatedDelivery": tracking.estimatedDelivery,
        status: "shipped",
        $push: {
          statusHistory: {
            status: "shipped",
            timestamp: new Date(),
            note: `Tracking number: ${tracking.trackingNumber}`,
          },
        },
      });

      // Send notification
      await this.sendOrderStatusNotification(order, "shipped");

      return tracking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create shipment tracking"
      );
    }
  }

  async updateShipmentTracking(
    trackingId: string,
    updateData: Partial<TShipmentTracking>
  ) {
    try {
      const tracking = await ShipmentTracking.findById(trackingId);
      if (!tracking) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment tracking not found");
      }

      const updatedTracking = await ShipmentTracking.findByIdAndUpdate(
        trackingId,
        updateData,
        { new: true, runValidators: true }
      );

      // If delivery status updated, update order
      if (updateData.currentStatus === "delivered") {
        await Order.findByIdAndUpdate(tracking.order, {
          status: "delivered",
          deliveredAt: new Date(),
          $push: {
            statusHistory: {
              status: "delivered",
              timestamp: new Date(),
              note: "Package delivered",
            },
          },
        });

        // Send delivery notification
        const order = await Order.findById(tracking.order);
        if (order) {
          await this.sendOrderStatusNotification(order, "delivered");
        }
      }

      return updatedTracking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update shipment tracking"
      );
    }
  }

  async addTrackingEvent(
    trackingId: string,
    status: string,
    location?: string,
    description?: string
  ) {
    try {
      const tracking = await ShipmentTracking.findById(trackingId);
      if (!tracking) {
        throw new AppError(httpStatus.NOT_FOUND, "Shipment tracking not found");
      }

      // Add tracking event
      tracking.events.push({
        status,
        location,
        timestamp: new Date(),
        description,
      });
      tracking.currentStatus = status as any;

      await tracking.save();

      // Auto-update order status based on tracking events
      if (status === "delivered") {
        // Update delivery status
        tracking.currentStatus = "delivered";
        tracking.actualDelivery = new Date();
        await tracking.save();

        await Order.findByIdAndUpdate(tracking.order, {
          status: "delivered",
          deliveredAt: new Date(),
          $push: {
            statusHistory: {
              status: "delivered",
              timestamp: new Date(),
              note: `Delivered at ${location || "destination"}`,
            },
          },
        });
      }

      return tracking;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to add tracking event"
      );
    }
  }

  // Order Automation
  async createOrderAutomation(automationData: Partial<TOrderAutomation>) {
    try {
      const automation = await OrderAutomation.create(automationData);
      return automation;
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to create order automation"
      );
    }
  }

  async executeOrderAutomation(event: string, orderData: any) {
    try {
      const automations = await OrderAutomation.find({
        isActive: true,
        "triggers.event": event,
      });

      for (const automation of automations) {
        // Check if conditions match
        if (
          this.checkAutomationConditions(
            automation.triggers.conditions,
            orderData
          )
        ) {
          await this.executeAutomationActions(automation, orderData);

          // Increment execution count
          automation.executionCount += 1;
          automation.lastExecuted = new Date();
          await automation.save();
        }
      }
    } catch (error) {
      console.error("Order automation execution failed:", error);
    }
  }

  private checkAutomationConditions(conditions: any, orderData: any): boolean {
    // Simple condition checking - can be enhanced
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [key, value] of Object.entries(conditions)) {
      if (orderData[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private async executeAutomationActions(
    automation: TOrderAutomation,
    orderData: any
  ) {
    for (const action of automation.actions) {
      // Add delay if specified
      if (action.delay && action.delay > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, (action.delay || 0) * 1000)
        );
      }

      switch (action.type) {
        case "update_status":
          await Order.findByIdAndUpdate(orderData._id, {
            status: action.parameters.status,
            $push: {
              statusHistory: {
                status: action.parameters.status,
                timestamp: new Date(),
                note: `Automated status update: ${automation.name}`,
              },
            },
          });
          break;

        case "send_notification":
          await notificationService.createNotification({
            user: action.parameters.userId || orderData.user,
            type: action.parameters.notificationType || "order_confirmation",
            channel: action.parameters.channel || "email",
            message: action.parameters.message || "Order status updated",
            recipient: {
              email: action.parameters.email,
            },
            metadata: { orderId: orderData._id },
          });
          break;

        case "assign_tracking":
          if (action.parameters.trackingData) {
            await this.createShipmentTracking({
              ...action.parameters.trackingData,
              order: orderData._id,
            });
          }
          break;

        // Add more action types as needed
      }
    }
  }

  // Priority Management
  async updateOrderPriority(
    orderId: string,
    priority: "low" | "medium" | "high" | "urgent"
  ) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { priority },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
      }

      return order;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update order priority"
      );
    }
  }

  // Get orders by priority
  async getOrdersByPriority(
    priority: "low" | "medium" | "high" | "urgent",
    page = 1,
    limit = 10
  ) {
    try {
      const skip = (page - 1) * limit;

      const orders = await Order.find({ priority })
        .populate("user", "name email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Order.countDocuments({ priority });

      return {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch orders by priority"
      );
    }
  }

  // Analytics for advanced order management
  async getAdvancedOrderAnalytics(startDate?: Date, endDate?: Date) {
    try {
      const matchStage: any = {};
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      const analytics = await Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            averageProcessingTime: { $avg: "$processingTime" },
            priorityDistribution: {
              $push: {
                priority: "$priority",
                status: "$status",
              },
            },
            fulfillmentStats: {
              $push: {
                fulfillmentStatus: "$fulfillmentStatus",
                status: "$status",
              },
            },
          },
        },
        {
          $project: {
            totalOrders: 1,
            averageProcessingTime: 1,
            priorityBreakdown: {
              $reduce: {
                input: "$priorityDistribution",
                initialValue: { low: 0, medium: 0, high: 0, urgent: 0 },
                in: {
                  low: {
                    $cond: [
                      { $eq: ["$$this.priority", "low"] },
                      { $add: ["$$value.low", 1] },
                      "$$value.low",
                    ],
                  },
                  medium: {
                    $cond: [
                      { $eq: ["$$this.priority", "medium"] },
                      { $add: ["$$value.medium", 1] },
                      "$$value.medium",
                    ],
                  },
                  high: {
                    $cond: [
                      { $eq: ["$$this.priority", "high"] },
                      { $add: ["$$value.high", 1] },
                      "$$value.high",
                    ],
                  },
                  urgent: {
                    $cond: [
                      { $eq: ["$$this.priority", "urgent"] },
                      { $add: ["$$value.urgent", 1] },
                      "$$value.urgent",
                    ],
                  },
                },
              },
            },
            fulfillmentBreakdown: {
              $reduce: {
                input: "$fulfillmentStats",
                initialValue: {
                  pending: 0,
                  processing: 0,
                  shipped: 0,
                  delivered: 0,
                  cancelled: 0,
                },
                in: {
                  pending: {
                    $cond: [
                      { $eq: ["$$this.fulfillmentStatus", "pending"] },
                      { $add: ["$$value.pending", 1] },
                      "$$value.pending",
                    ],
                  },
                  processing: {
                    $cond: [
                      { $eq: ["$$this.fulfillmentStatus", "processing"] },
                      { $add: ["$$value.processing", 1] },
                      "$$value.processing",
                    ],
                  },
                  shipped: {
                    $cond: [
                      { $eq: ["$$this.fulfillmentStatus", "shipped"] },
                      { $add: ["$$value.shipped", 1] },
                      "$$value.shipped",
                    ],
                  },
                  delivered: {
                    $cond: [
                      { $eq: ["$$this.fulfillmentStatus", "delivered"] },
                      { $add: ["$$value.delivered", 1] },
                      "$$value.delivered",
                    ],
                  },
                  cancelled: {
                    $cond: [
                      { $eq: ["$$this.fulfillmentStatus", "cancelled"] },
                      { $add: ["$$value.cancelled", 1] },
                      "$$value.cancelled",
                    ],
                  },
                },
              },
            },
          },
        },
      ]);

      return analytics[0] || {};
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to fetch advanced order analytics"
      );
    }
  }

  // Helper methods
  private async sendOrderStatusNotification(order: any, status: string) {
    try {
      const statusMessages = {
        shipped: "Your order has been shipped!",
        delivered: "Your order has been delivered!",
        cancelled: "Your order has been cancelled.",
        refund_requested: "Refund has been requested for your order.",
        refunded: "Your order has been refunded.",
      };

      if (statusMessages[status as keyof typeof statusMessages]) {
        await notificationService.createNotification({
          user: order.user,
          type:
            status === "shipped"
              ? "order_shipped"
              : status === "delivered"
              ? "order_delivered"
              : "order_confirmation",
          channel: "email",
          message: statusMessages[status as keyof typeof statusMessages],
          recipient: {
            email: order.userEmail,
          },
          metadata: { orderId: order._id, status },
        });
      }
    } catch (error) {
      console.error("Failed to send order status notification:", error);
    }
  }

  private async processOrderRefund(orderId: string) {
    // This would integrate with the refund service
    // Implementation depends on the refund service structure
    try {
      // Import and use RefundService when available
      console.log(`Processing refund for order: ${orderId}`);
    } catch (error) {
      console.error("Failed to process order refund:", error);
    }
  }
}

export const advancedOrderService = new AdvancedOrderService();
