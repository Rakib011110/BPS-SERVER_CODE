import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../User/user.constant";
import { OrderControllers } from "./order.controller";
import { OrderValidations } from "./order.validation";
import { AdvancedOrderRoutes } from "./advancedOrder.routes";

const router = express.Router();

// Mount advanced order management routes
router.use("/advanced", AdvancedOrderRoutes);

// Customer routes - Create and manage orders
router.post(
  "/",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  validateRequest(OrderValidations.createOrderValidationSchema),
  OrderControllers.createOrder
);

router.get(
  "/my-orders",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  OrderControllers.getMyOrders
);

router.get(
  "/number/:orderNumber",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  OrderControllers.getOrderByNumber
);

router.get(
  "/:orderId/download/:productId",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  OrderControllers.generateDownloadLink
);

// Admin routes - Order management
router.get("/", auth(USER_ROLE.ADMIN), OrderControllers.getAllOrders);

router.get("/stats", auth(USER_ROLE.ADMIN), OrderControllers.getOrderStats);

router.get(
  "/user/:userId/purchased-products",
  auth(USER_ROLE.ADMIN),
  OrderControllers.getUserPurchasedProducts
);

router.get(
  "/user/:userId/orders-for-license",
  auth(USER_ROLE.ADMIN),
  OrderControllers.getUserOrdersForLicense
);

router.get("/:id", auth(USER_ROLE.ADMIN), OrderControllers.getOrderById);

router.put(
  "/:id/status",
  auth(USER_ROLE.ADMIN),
  validateRequest(OrderValidations.updateOrderStatusValidationSchema),
  OrderControllers.updateOrderStatus
);

router.put(
  "/payment/:orderNumber",
  auth(USER_ROLE.ADMIN),
  validateRequest(OrderValidations.updatePaymentStatusValidationSchema),
  OrderControllers.updatePaymentStatus
);

router.post(
  "/:id/refund",
  auth(USER_ROLE.ADMIN),
  validateRequest(OrderValidations.processRefundValidationSchema),
  OrderControllers.processRefund
);

export const OrderRoutes = router;
