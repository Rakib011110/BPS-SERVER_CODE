import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { notificationService } from './notification.service';
import httpStatus from 'http-status';

// Get user notifications
const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const result = await notificationService.getUserNotifications(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result.data,
    meta: result.meta
  });
});

// Mark notification as read
const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const result = await notificationService.markAsRead(notificationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification marked as read',
    data: result
  });
});

// Mark all notifications as read
const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const result = await notificationService.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All notifications marked as read',
    data: result
  });
});

// Delete notification
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const result = await notificationService.deleteNotification(notificationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification deleted successfully',
    data: result
  });
});

// Get notification statistics
const getNotificationStats = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const result = await notificationService.getNotificationStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Notification statistics retrieved successfully',
    data: result
  });
});

// Send test notification (admin only)
const sendTestNotification = catchAsync(async (req: Request, res: Response) => {
  const { type, subject, message, userEmail, userPhone } = req.body;
  const { userId } = req.user!;

  const result = await notificationService.sendNotification({
    userId,
    type,
    subject,
    message,
    userEmail,
    userPhone
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Test notification sent successfully',
    data: result
  });
});

// Send bulk notification (admin only)
const sendBulkNotification = catchAsync(async (req: Request, res: Response) => {
  const { userIds, type, subject, message, metadata } = req.body;

  const result = await notificationService.sendBulkNotification({
    userIds,
    type,
    subject,
    message,
    metadata
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bulk notifications sent successfully',
    data: result
  });
});

// Test SMS service (admin only)
const testSMSService = catchAsync(async (req: Request, res: Response) => {
  const result = await notificationService.testSMSService();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SMS service test completed',
    data: result
  });
});

export const NotificationController = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  sendTestNotification,
  sendBulkNotification,
  testSMSService
};