import { Schema, model } from "mongoose";
import { TShipmentTracking, TOrderAutomation } from "./order.interface";

// Shipment Tracking Schema
const shipmentTrackingSchema = new Schema<TShipmentTracking>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    trackingUrl: {
      type: String,
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
    shippingMethod: {
      type: String,
      required: true,
      trim: true,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },
    events: [
      {
        status: {
          type: String,
          required: true,
          trim: true,
        },
        location: {
          type: String,
          trim: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    currentStatus: {
      type: String,
      enum: [
        "label_created",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
      ],
      default: "label_created",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Order Automation Schema
const orderAutomationSchema = new Schema<TOrderAutomation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggers: {
      event: {
        type: String,
        enum: [
          "order_created",
          "payment_received",
          "status_changed",
          "time_based",
        ],
        required: true,
      },
      conditions: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    actions: [
      {
        type: {
          type: String,
          enum: [
            "update_status",
            "send_notification",
            "assign_tracking",
            "create_task",
            "webhook",
          ],
          required: true,
        },
        parameters: {
          type: Schema.Types.Mixed,
          required: true,
        },
        delay: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    executionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastExecuted: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
shipmentTrackingSchema.index({ order: 1 });
shipmentTrackingSchema.index({ trackingNumber: 1 });
shipmentTrackingSchema.index({ carrier: 1, currentStatus: 1 });
shipmentTrackingSchema.index({ estimatedDelivery: 1 });

orderAutomationSchema.index({ isActive: 1 });
orderAutomationSchema.index({ "triggers.event": 1 });

// Methods for ShipmentTracking
shipmentTrackingSchema.methods.addEvent = function (
  status: string,
  location?: string,
  description?: string
) {
  this.events.push({
    status,
    location,
    timestamp: new Date(),
    description,
  });
  this.currentStatus = status;
  return this.save();
};

shipmentTrackingSchema.methods.updateDeliveryStatus = function (
  delivered: boolean,
  actualDelivery?: Date
) {
  if (delivered) {
    this.currentStatus = "delivered";
    this.actualDelivery = actualDelivery || new Date();
  }
  return this.save();
};

// Methods for OrderAutomation
orderAutomationSchema.methods.incrementExecution = function () {
  this.executionCount += 1;
  this.lastExecuted = new Date();
  return this.save();
};

export const ShipmentTracking = model<TShipmentTracking>(
  "ShipmentTracking",
  shipmentTrackingSchema
);
export const OrderAutomation = model<TOrderAutomation>(
  "OrderAutomation",
  orderAutomationSchema
);
