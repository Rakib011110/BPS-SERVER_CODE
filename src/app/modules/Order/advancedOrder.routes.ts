import express from "express";
import { AdvancedOrderController } from "./advancedOrder.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AdvancedOrderValidations } from "./advancedOrder.validation";

const router = express.Router();

// Bulk Operations Routes
router.post(
  "/bulk-update",
  auth("ADMIN"),
  validateRequest(AdvancedOrderValidations.bulkOrderOperationValidation),
  AdvancedOrderController.bulkUpdateOrderStatus
);

// Shipment Tracking Routes
router.post(
  "/tracking",
  auth("ADMIN"),
  validateRequest(AdvancedOrderValidations.createShipmentTrackingValidation),
  AdvancedOrderController.createShipmentTracking
);

router.patch(
  "/tracking/:trackingId",
  auth("ADMIN"),
  validateRequest(AdvancedOrderValidations.updateShipmentTrackingValidation),
  AdvancedOrderController.updateShipmentTracking
);

router.post(
  "/tracking/:trackingId/events",
  auth("ADMIN"),
  validateRequest(AdvancedOrderValidations.addTrackingEventValidation),
  AdvancedOrderController.addTrackingEvent
);

// Order Automation Routes
router.post(
  "/automation",
  auth("ADMIN"),
  validateRequest(AdvancedOrderValidations.createOrderAutomationValidation),
  AdvancedOrderController.createOrderAutomation
);

// Priority Management Routes
router.patch(
  "/:orderId/priority",
  auth("ADMIN"),
  validateRequest(AdvancedOrderValidations.updateOrderPriorityValidation),
  AdvancedOrderController.updateOrderPriority
);

router.get(
  "/priority/:priority",
  auth("ADMIN"),
  AdvancedOrderController.getOrdersByPriority
);

// Analytics Routes
router.get(
  "/analytics/advanced",
  auth("ADMIN"),
  AdvancedOrderController.getAdvancedOrderAnalytics
);

export const AdvancedOrderRoutes = router;
