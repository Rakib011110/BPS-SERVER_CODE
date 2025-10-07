import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AnalyticsServices } from "./analytics.service";
import { ANALYTICS_MESSAGES, ANALYTICS_PERIODS } from "./analytics.constant";

// Get sales report
const getSalesReport = catchAsync(async (req, res) => {
  const { period = ANALYTICS_PERIODS.MONTHLY, startDate, endDate } = req.query;

  const result = await AnalyticsServices.generateSalesReport(
    period as string,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.SALES_REPORT_GENERATED,
    data: result,
  });
});

// Get product analytics
const getProductAnalytics = catchAsync(async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await AnalyticsServices.getProductAnalytics(Number(limit));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.ANALYTICS_RETRIEVED,
    data: result,
  });
});

// Get subscription analytics
const getSubscriptionAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getSubscriptionAnalytics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.ANALYTICS_RETRIEVED,
    data: result,
  });
});

// Get user analytics
const getUserAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getUserAnalytics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.ANALYTICS_RETRIEVED,
    data: result,
  });
});

// Get revenue breakdown
const getRevenueBreakdown = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const result = await AnalyticsServices.getRevenueBreakdown(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.ANALYTICS_RETRIEVED,
    data: result,
  });
});

// Get download statistics
const getDownloadStatistics = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getDownloadStatistics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.ANALYTICS_RETRIEVED,
    data: result,
  });
});

// Get comprehensive dashboard analytics
const getDashboardAnalytics = catchAsync(async (req, res) => {
  const { period = ANALYTICS_PERIODS.MONTHLY } = req.query;
  const result = await AnalyticsServices.getDashboardAnalytics(
    period as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: ANALYTICS_MESSAGES.ANALYTICS_RETRIEVED,
    data: result,
  });
});

export const AnalyticsControllers = {
  getSalesReport,
  getProductAnalytics,
  getSubscriptionAnalytics,
  getUserAnalytics,
  getRevenueBreakdown,
  getDownloadStatistics,
  getDashboardAnalytics,
};
