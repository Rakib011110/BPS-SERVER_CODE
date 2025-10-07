import express from "express";
import { requireAdmin } from "../../middlewares/auth";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriptionNotificationService } from "./subscriptionNotification.service";
import { NotificationScheduler } from "../../utils/notificationScheduler";
import httpStatus from "http-status";

const router = express.Router();

// All notification admin routes require admin access
router.use(requireAdmin);

// Manually trigger subscription notifications
const triggerSubscriptionNotifications = catchAsync(async (req, res) => {
  await SubscriptionNotificationService.runAutomatedNotifications();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription notifications triggered successfully",
    data: null,
  });
});

// Trigger specific notification types
const triggerRenewalReminders = catchAsync(async (req, res) => {
  await SubscriptionNotificationService.sendRenewalReminder7Days();
  await SubscriptionNotificationService.sendRenewalReminder1Day();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Renewal reminders sent successfully",
    data: null,
  });
});

const triggerExpiryNotifications = catchAsync(async (req, res) => {
  await SubscriptionNotificationService.sendExpiryNotifications();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expiry notifications sent successfully",
    data: null,
  });
});

const triggerTrialReminders = catchAsync(async (req, res) => {
  await SubscriptionNotificationService.sendTrialExpiryReminders();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trial reminders sent successfully",
    data: null,
  });
});

// Test notification scheduler
const testScheduler = catchAsync(async (req, res) => {
  await NotificationScheduler.triggerSubscriptionNotifications();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification scheduler tested successfully",
    data: null,
  });
});

// Routes
router.post("/trigger-all", triggerSubscriptionNotifications);
router.post("/trigger-renewals", triggerRenewalReminders);
router.post("/trigger-expiry", triggerExpiryNotifications);
router.post("/trigger-trials", triggerTrialReminders);
router.post("/test-scheduler", testScheduler);

export const NotificationAdminRoutes = router;
