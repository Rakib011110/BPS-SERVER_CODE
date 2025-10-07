import express from "express";
import { NotificationController } from "./notification.controller";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../User/user.constant";

const router = express.Router();

// Get user notifications
router.get(
  "/",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  NotificationController.getUserNotifications
);

// Get notification statistics
router.get(
  "/stats",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  NotificationController.getNotificationStats
);

// Mark all notifications as read
router.patch(
  "/mark-all-read",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  NotificationController.markAllAsRead
);

// Mark specific notification as read
router.patch(
  "/:notificationId/read",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  NotificationController.markAsRead
);

// Delete notification
router.delete(
  "/:notificationId",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  NotificationController.deleteNotification
);

// Admin routes
router.post(
  "/test",
  auth(USER_ROLE.ADMIN),
  NotificationController.sendTestNotification
);

router.post(
  "/bulk",
  auth(USER_ROLE.ADMIN),
  NotificationController.sendBulkNotification
);

router.get(
  "/test-sms",
  auth(USER_ROLE.ADMIN),
  NotificationController.testSMSService
);

export const NotificationRoutes = router;
