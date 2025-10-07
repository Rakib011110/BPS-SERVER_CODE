import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../User/user.constant";
import validateRequest from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = express.Router();

// All admin routes require ADMIN role
router.use(auth(USER_ROLE.ADMIN));

// Dashboard Analytics
router.get("/dashboard/stats", AdminController.getDashboardStats);

// User Management
router.get("/users", AdminController.getUsers);
router.get("/users/:userId", AdminController.getUserDetails);
router.patch(
  "/users/:userId/status",
  validateRequest(AdminValidation.updateUserStatusValidation),
  AdminController.updateUserStatus
);

// Product Management
router.get("/products", AdminController.getProducts);
router.get("/products/:productId", AdminController.getProductDetails);
router.patch(
  "/products/:productId/status",
  validateRequest(AdminValidation.updateProductStatusValidation),
  AdminController.updateProductStatus
);

// Order Management
router.get("/orders", AdminController.getOrders);
router.get("/orders/:orderId", AdminController.getOrderDetails);
router.patch(
  "/orders/:orderId/status",
  validateRequest(AdminValidation.updateOrderStatusValidation),
  AdminController.updateOrderStatus
);

// Subscription Management
router.get("/subscriptions", AdminController.getSubscriptions);
router.get(
  "/subscriptions/:subscriptionId",
  AdminController.getSubscriptionDetails
);
router.patch(
  "/subscriptions/:subscriptionId/status",
  validateRequest(AdminValidation.updateSubscriptionStatusValidation),
  AdminController.updateSubscriptionStatus
);

// Bulk Operations
router.post(
  "/bulk-operation",
  validateRequest(AdminValidation.bulkOperationValidation),
  AdminController.performBulkOperation
);

// System Settings
router.get("/settings", AdminController.getSystemSettings);
router.patch(
  "/settings",
  validateRequest(AdminValidation.updateSystemSettingsValidation),
  AdminController.updateSystemSettings
);

// Activity Logs
router.get("/activity-logs", AdminController.getActivityLogs);

// Data Export
router.post(
  "/export",
  validateRequest(AdminValidation.exportDataValidation),
  AdminController.exportData
);

// System Health
router.get("/system/health", AdminController.getSystemHealth);

export const AdminRoutes = router;
