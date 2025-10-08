import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { adminService } from "./admin.service";
import AppError from "../../error/AppError";
import { TBulkOperation } from "./admin.interface";

// Dashboard Analytics
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard statistics retrieved successfully",
    data: stats,
  });
});

// User Management
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    emailVerified,
    search,
  } = req.query;

  const filters = {
    role: role as string,
    isActive:
      isActive === "true" ? true : isActive === "false" ? false : undefined,
    emailVerified:
      emailVerified === "true"
        ? true
        : emailVerified === "false"
        ? false
        : undefined,
    search: search as string,
  };

  const result = await adminService.getUsers(
    Number(page),
    Number(limit),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    meta: result.pagination,
    data: result.users,
  });
});

// Product Management
const getProducts = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    category,
    isActive,
    isFeatured,
    search,
  } = req.query;

  const filters = {
    category: category as string,
    isActive:
      isActive === "true" ? true : isActive === "false" ? false : undefined,
    isFeatured:
      isFeatured === "true" ? true : isFeatured === "false" ? false : undefined,
    search: search as string,
  };

  const result = await adminService.getProducts(
    Number(page),
    Number(limit),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully",
    meta: result.pagination,
    data: result.products,
  });
});

// Order Management
const getOrders = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    paymentMethod,
    dateFrom,
    dateTo,
  } = req.query;

  const filters = {
    status: status as string,
    paymentStatus: paymentStatus as string,
    paymentMethod: paymentMethod as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
  };

  const result = await adminService.getOrders(
    Number(page),
    Number(limit),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.pagination,
    data: result.orders,
  });
});

// Bulk Operations
const performBulkOperation = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user?._id;

  if (!adminUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
  }

  const bulkOperation: TBulkOperation = req.body;

  const result = await adminService.performBulkOperation(
    bulkOperation,
    adminUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bulk operation completed",
    data: result,
  });
});

// System Settings
const getSystemSettings = catchAsync(async (req: Request, res: Response) => {
  const settings = await adminService.getSystemSettings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System settings retrieved successfully",
    data: settings,
  });
});

const updateSystemSettings = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user?._id;

  if (!adminUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
  }

  const updates = req.body;
  const settings = await adminService.updateSystemSettings(
    updates,
    adminUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System settings updated successfully",
    data: settings,
  });
});

// Activity Logs
const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    adminUser,
    action,
    targetType,
    dateFrom,
    dateTo,
  } = req.query;

  const filters = {
    adminUser: adminUser as string,
    action: action as string,
    targetType: targetType as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
  };

  const result = await adminService.getActivityLogs(
    Number(page),
    Number(limit),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity logs retrieved successfully",
    meta: result.pagination,
    data: result.logs,
  });
});

// User Details
const getUserDetails = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await adminService.getUserDetails(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User details retrieved successfully",
    data: user,
  });
});

// Product Details
const getProductDetails = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const product = await adminService.getProductDetails(productId);

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product details retrieved successfully",
    data: product,
  });
});

// Order Details
const getOrderDetails = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await adminService.getOrderDetails(orderId);

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order details retrieved successfully",
    data: order,
  });
});

// User Actions
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { isActive } = req.body;
  const adminUserId = req.user?._id;

  if (!adminUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
  }

  const result = await adminService.updateUserStatus(
    userId,
    isActive,
    adminUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    data: result,
  });
});

// Product Actions
const updateProductStatus = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { isActive, isFeatured } = req.body;
  const adminUserId = req.user?._id;

  if (!adminUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
  }

  const result = await adminService.updateProductStatus(
    productId,
    { isActive, isFeatured },
    adminUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product status updated successfully",
    data: result,
  });
});

// Order Actions
const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;
  const adminUserId = req.user?._id;

  if (!adminUserId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin user not authenticated");
  }

  const result = await adminService.updateOrderStatus(
    orderId,
    { status, paymentStatus },
    adminUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated successfully",
    data: result,
  });
});

// Data Export
const exportData = catchAsync(async (req: Request, res: Response) => {
  const { type, format, dateRange, filters } = req.body;

  const result = await adminService.exportData({
    type,
    format,
    dateRange,
    filters,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Data export generated successfully",
    data: result,
  });
});

// System Health Check
const getSystemHealth = catchAsync(async (req: Request, res: Response) => {
  const health = await adminService.getSystemHealth();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "System health check completed",
    data: health,
  });
});

// Subscription Management
const getSubscriptions = catchAsync(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    plan,
    dateFrom,
    dateTo,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const filters = {
    search: search as string,
    status: status as string,
    plan: plan as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    sortBy: sortBy as "startDate" | "endDate" | "totalPaid" | "createdAt",
    sortOrder: sortOrder as "asc" | "desc",
  };

  const result = await adminService.getSubscriptions(
    Number(page),
    Number(limit),
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscriptions retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

const getSubscriptionDetails = catchAsync(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params;
    const subscription = await adminService.getSubscriptionDetails(
      subscriptionId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription details retrieved successfully",
      data: subscription,
    });
  }
);

const updateSubscriptionStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { subscriptionId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "cancelled", "pending"].includes(status)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid status");
    }

    const subscription = await adminService.updateSubscriptionStatus(
      subscriptionId,
      status
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription status updated successfully",
      data: subscription,
    });
  }
);

// Get Admin Reports
const getAdminReports = catchAsync(async (req: Request, res: Response) => {
  const { reportType, dateFrom, dateTo, granularity } = req.query;

  const params = {
    reportType: reportType as
      | "sales"
      | "users"
      | "subscriptions"
      | "products"
      | "all",
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    granularity: granularity as "day" | "week" | "month" | "year",
  };

  const reports = await adminService.getAdminReports(params);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin reports retrieved successfully",
    data: reports,
  });
});

export const AdminController = {
  getDashboardStats,
  getUsers,
  getProducts,
  getOrders,
  performBulkOperation,
  getSystemSettings,
  updateSystemSettings,
  getActivityLogs,
  getUserDetails,
  getProductDetails,
  getOrderDetails,
  updateUserStatus,
  updateProductStatus,
  updateOrderStatus,
  getSubscriptions,
  getSubscriptionDetails,
  updateSubscriptionStatus,
  exportData,
  getSystemHealth,
  getAdminReports,
};
