import { Order } from "../Order/order.model";
import { User } from "../User/user.model";
import { Product } from "../Product/product.model";
import {
  SubscriptionPlan,
  UserSubscription,
} from "../Subscription/subscription.model";
import { Payment } from "../Payment/payment.model";
import {
  TSalesReport,
  TProductAnalytics,
  TSubscriptionAnalytics,
  TUserAnalytics,
  TRevenueBreakdown,
  TDownloadStatistics,
  TDashboardAnalytics,
} from "./analytics.interface";
import { ANALYTICS_PERIODS } from "./analytics.constant";
import AppError from "../../error/AppError";
import httpStatus from "http-status";

// Helper function to get date range
const getDateRange = (period: string, customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (customStart && customEnd) {
    startDate = customStart;
    endDate = customEnd;
  } else {
    switch (period) {
      case ANALYTICS_PERIODS.DAILY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case ANALYTICS_PERIODS.WEEKLY:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case ANALYTICS_PERIODS.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case ANALYTICS_PERIODS.YEARLY:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  return { startDate, endDate };
};

// Generate sales report
const generateSalesReport = async (
  period: string = ANALYTICS_PERIODS.MONTHLY,
  customStart?: Date,
  customEnd?: Date
): Promise<TSalesReport> => {
  const { startDate, endDate } = getDateRange(period, customStart, customEnd);

  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: "COMPLETED",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: "$totalAmount" },
        uniqueCustomers: { $addToSet: "$customer" },
      },
    },
  ]);

  const current = salesData[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    uniqueCustomers: [],
  };

  // Calculate growth rates (compare with previous period)
  const periodDuration = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodDuration);
  const prevEndDate = startDate;

  const prevSalesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: prevStartDate, $lte: prevEndDate },
        orderStatus: "COMPLETED",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const previous = prevSalesData[0] || { totalRevenue: 0, totalOrders: 0 };

  const revenueGrowth = previous.totalRevenue
    ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) *
      100
    : 0;

  const orderGrowth = previous.totalOrders
    ? ((current.totalOrders - previous.totalOrders) / previous.totalOrders) *
      100
    : 0;

  return {
    totalRevenue: current.totalRevenue,
    totalOrders: current.totalOrders,
    totalCustomers: current.uniqueCustomers.length,
    averageOrderValue: current.averageOrderValue || 0,
    period,
    startDate,
    endDate,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    orderGrowth: Math.round(orderGrowth * 100) / 100,
  };
};

// Get product analytics
const getProductAnalytics = async (
  limit = 10
): Promise<TProductAnalytics[]> => {
  const productStats = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: {
        orderStatus: "COMPLETED",
        "items.type": "PRODUCT",
      },
    },
    {
      $group: {
        _id: "$items.product",
        totalSales: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.price", "$items.quantity"] },
        },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        productId: "$_id",
        productName: "$productInfo.title",
        totalSales: 1,
        totalRevenue: 1,
        totalDownloads: "$productInfo.downloadCount",
        conversionRate: {
          $multiply: [
            {
              $divide: [
                "$totalSales",
                { $ifNull: ["$productInfo.viewCount", 1] },
              ],
            },
            100,
          ],
        },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
  ]);

  return productStats;
};

// Get subscription analytics
const getSubscriptionAnalytics = async (): Promise<TSubscriptionAnalytics> => {
  const subscriptionStats = await UserSubscription.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: "$totalPaid" },
      },
    },
  ]);

  const planStats = await UserSubscription.aggregate([
    {
      $match: { status: "ACTIVE" },
    },
    {
      $group: {
        _id: "$subscriptionPlan",
        activeCount: { $sum: 1 },
        revenue: { $sum: "$totalPaid" },
      },
    },
    {
      $lookup: {
        from: "subscriptionplans",
        localField: "_id",
        foreignField: "_id",
        as: "planInfo",
      },
    },
    { $unwind: "$planInfo" },
    {
      $project: {
        planId: "$_id",
        planName: "$planInfo.name",
        activeCount: 1,
        revenue: 1,
      },
    },
  ]);

  const activeCount =
    subscriptionStats.find((s) => s._id === "ACTIVE")?.count || 0;
  const inactiveCount =
    subscriptionStats.find((s) => s._id === "INACTIVE")?.count || 0;
  const totalRevenue = subscriptionStats.reduce(
    (sum, s) => sum + (s.revenue || 0),
    0
  );

  // Calculate churn rate (simplified)
  const totalSubscriptions = activeCount + inactiveCount;
  const churnRate =
    totalSubscriptions > 0 ? (inactiveCount / totalSubscriptions) * 100 : 0;

  return {
    totalActiveSubscriptions: activeCount,
    totalInactiveSubscriptions: inactiveCount,
    totalRevenue,
    churnRate: Math.round(churnRate * 100) / 100,
    growthRate: 0, // Would need historical data to calculate
    averageLifetimeValue: activeCount > 0 ? totalRevenue / activeCount : 0,
    subscriptionsByPlan: planStats,
  };
};

// Get user analytics
const getUserAnalytics = async (): Promise<TUserAnalytics> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    usersByRole,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const roleDistribution = usersByRole.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {} as { [role: string]: number });

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek: newUsersWeek,
    newUsersThisMonth: newUsersMonth,
    usersByRole: roleDistribution,
    userGrowthTrend: [], // Would need historical data
  };
};

// Get revenue breakdown
const getRevenueBreakdown = async (
  startDate?: Date,
  endDate?: Date
): Promise<TRevenueBreakdown> => {
  const dateFilter =
    startDate && endDate
      ? { createdAt: { $gte: startDate, $lte: endDate } }
      : {};

  const [oneTimeRevenue, subscriptionRevenue] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: "COMPLETED",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.type": "PRODUCT",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          count: { $sum: "$items.quantity" },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: "COMPLETED",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.type": "SUBSCRIPTION",
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          count: { $sum: "$items.quantity" },
        },
      },
    ]),
  ]);

  const oneTime = oneTimeRevenue[0] || { revenue: 0, count: 0 };
  const subscription = subscriptionRevenue[0] || { revenue: 0, count: 0 };
  const totalRevenue = oneTime.revenue + subscription.revenue;

  return {
    oneTimeProducts: {
      revenue: oneTime.revenue,
      count: oneTime.count,
      percentage: totalRevenue > 0 ? (oneTime.revenue / totalRevenue) * 100 : 0,
    },
    subscriptions: {
      revenue: subscription.revenue,
      count: subscription.count,
      percentage:
        totalRevenue > 0 ? (subscription.revenue / totalRevenue) * 100 : 0,
    },
    totalRevenue,
  };
};

// Get download statistics
const getDownloadStatistics = async (): Promise<TDownloadStatistics> => {
  const downloadStats = await Product.aggregate([
    {
      $project: {
        _id: 1,
        title: 1,
        downloadCount: { $ifNull: ["$downloadCount", 0] },
      },
    },
    { $sort: { downloadCount: -1 } },
    { $limit: 10 },
  ]);

  const totalDownloads = await Product.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$downloadCount", 0] } },
      },
    },
  ]);

  return {
    totalDownloads: totalDownloads[0]?.total || 0,
    downloadsByProduct: downloadStats.map((product) => ({
      productId: product._id.toString(),
      productName: product.title,
      downloadCount: product.downloadCount,
    })),
    downloadsByPeriod: [], // Would need historical tracking
  };
};

// Get comprehensive dashboard analytics
const getDashboardAnalytics = async (
  period: string = ANALYTICS_PERIODS.MONTHLY
): Promise<TDashboardAnalytics> => {
  const [
    salesReport,
    subscriptionAnalytics,
    userAnalytics,
    revenueBreakdown,
    topProducts,
    downloadStatistics,
  ] = await Promise.all([
    generateSalesReport(period),
    getSubscriptionAnalytics(),
    getUserAnalytics(),
    getRevenueBreakdown(),
    getProductAnalytics(5),
    getDownloadStatistics(),
  ]);

  return {
    salesReport,
    subscriptionAnalytics,
    userAnalytics,
    revenueBreakdown,
    topProducts,
    downloadStatistics,
  };
};

export const AnalyticsServices = {
  generateSalesReport,
  getProductAnalytics,
  getSubscriptionAnalytics,
  getUserAnalytics,
  getRevenueBreakdown,
  getDownloadStatistics,
  getDashboardAnalytics,
};
