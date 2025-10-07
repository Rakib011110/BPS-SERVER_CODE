import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { advancedOrderService } from "./advancedOrder.service";
import { TBulkOrderOperation } from "./order.interface";

// Bulk Operations
const bulkUpdateOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const bulkOperation: TBulkOrderOperation = req.body;

    const result = await advancedOrderService.bulkUpdateOrderStatus(
      bulkOperation
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Bulk order operation completed successfully",
      data: result,
    });
  }
);

// Shipment Tracking
const createShipmentTracking = catchAsync(
  async (req: Request, res: Response) => {
    const trackingData = req.body;

    const result = await advancedOrderService.createShipmentTracking(
      trackingData
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Shipment tracking created successfully",
      data: result,
    });
  }
);

const updateShipmentTracking = catchAsync(
  async (req: Request, res: Response) => {
    const { trackingId } = req.params;
    const updateData = req.body;

    const result = await advancedOrderService.updateShipmentTracking(
      trackingId,
      updateData
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Shipment tracking updated successfully",
      data: result,
    });
  }
);

const addTrackingEvent = catchAsync(async (req: Request, res: Response) => {
  const { trackingId } = req.params;
  const { status, location, description } = req.body;

  const result = await advancedOrderService.addTrackingEvent(
    trackingId,
    status,
    location,
    description
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tracking event added successfully",
    data: result,
  });
});

// Order Automation
const createOrderAutomation = catchAsync(
  async (req: Request, res: Response) => {
    const automationData = req.body;

    const result = await advancedOrderService.createOrderAutomation(
      automationData
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Order automation created successfully",
      data: result,
    });
  }
);

// Priority Management
const updateOrderPriority = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { priority } = req.body;

  const result = await advancedOrderService.updateOrderPriority(
    orderId,
    priority
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order priority updated successfully",
    data: result,
  });
});

const getOrdersByPriority = catchAsync(async (req: Request, res: Response) => {
  const { priority } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const result = await advancedOrderService.getOrdersByPriority(
    priority as "low" | "medium" | "high" | "urgent",
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

// Analytics
const getAdvancedOrderAnalytics = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const result = await advancedOrderService.getAdvancedOrderAnalytics(
      start,
      end
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Advanced order analytics retrieved successfully",
      data: result,
    });
  }
);

export const AdvancedOrderController = {
  bulkUpdateOrderStatus,
  createShipmentTracking,
  updateShipmentTracking,
  addTrackingEvent,
  createOrderAutomation,
  updateOrderPriority,
  getOrdersByPriority,
  getAdvancedOrderAnalytics,
};
