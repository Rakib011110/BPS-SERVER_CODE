import { z } from "zod";

// Bulk operation validation
const bulkOrderOperationValidation = z.object({
  body: z.object({
    orderIds: z.array(z.string().min(1, "Order ID is required")),
    operation: z.enum([
      "update_status",
      "assign_tracking",
      "update_priority",
      "send_notifications",
      "mark_review",
      "bulk_cancel",
      "bulk_refund",
      "assign_priority",
    ]),
    data: z.object({
      status: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      trackingNumber: z.string().optional(),
      carrier: z.string().optional(),
      notificationType: z.string().optional(),
      requiresReview: z.boolean().optional(),
      notes: z.string().optional(),
      reason: z.string().optional(),
      updatedBy: z.string().optional(),
      processRefund: z.boolean().optional(),
    }),
  }),
});

// Shipment tracking validation
const createShipmentTrackingValidation = z.object({
  body: z.object({
    order: z.string().min(1, "Order ID is required"),
    trackingNumber: z.string().min(1, "Tracking number is required"),
    carrier: z.string().min(1, "Carrier is required"),
    trackingUrl: z.string().url().optional(),
    estimatedDelivery: z.string().optional(),
    shippingMethod: z.string().min(1, "Shipping method is required"),
    shippingCost: z.number().min(0, "Shipping cost must be non-negative"),
  }),
});

const updateShipmentTrackingValidation = z.object({
  body: z.object({
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
    trackingUrl: z.string().url().optional(),
    estimatedDelivery: z.string().optional(),
    actualDelivery: z.string().optional(),
    shippingMethod: z.string().optional(),
    shippingCost: z.number().min(0).optional(),
    currentStatus: z
      .enum([
        "label_created",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
      ])
      .optional(),
  }),
});

const addTrackingEventValidation = z.object({
  body: z.object({
    status: z.string().min(1, "Status is required"),
    location: z.string().optional(),
    description: z.string().optional(),
  }),
});

// Order automation validation
const createOrderAutomationValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Automation name is required"),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    triggers: z.object({
      event: z.enum([
        "order_created",
        "payment_received",
        "status_changed",
        "time_based",
      ]),
      conditions: z.record(z.any()).optional(),
    }),
    actions: z
      .array(
        z.object({
          type: z.enum([
            "update_status",
            "send_notification",
            "assign_tracking",
            "create_task",
            "webhook",
          ]),
          parameters: z.record(z.any()),
          delay: z.number().min(0).optional(),
        })
      )
      .min(1, "At least one action is required"),
  }),
});

// Priority management validation
const updateOrderPriorityValidation = z.object({
  body: z.object({
    priority: z.enum(["low", "medium", "high", "urgent"]),
  }),
});

// Analytics validation
const advancedAnalyticsValidation = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const AdvancedOrderValidations = {
  bulkOrderOperationValidation,
  createShipmentTrackingValidation,
  updateShipmentTrackingValidation,
  addTrackingEventValidation,
  createOrderAutomationValidation,
  updateOrderPriorityValidation,
  advancedAnalyticsValidation,
};
