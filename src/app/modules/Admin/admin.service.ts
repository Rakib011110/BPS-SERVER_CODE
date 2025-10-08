import httpStatus from "http-status";
import { User } from "../User/user.model";
import { Product } from "../Product/product.model";
import { Order } from "../Order/order.model";
import { SubscriptionPlan } from "../Subscription/subscription.model";
import { ActivityLog, SystemSettings } from "./admin.model";
import { PAYMENT_STATUS } from "../Payment/payment.constant";
import AppError from "../../error/AppError";
import { Types } from "mongoose";
import {
  TDashboardStats,
  TUserManagement,
  TProductManagement,
  TOrderManagement,
  TBulkOperation,
  TBulkOperationResult,
  TActivityLog,
  TSystemSettings,
  TExportRequest,
  TExportResult,
} from "./admin.interface";

class AdminService {
  // Dashboard Analytics
  async getDashboardStats(): Promise<TDashboardStats> {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    const currentDate = new Date();
    const startOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Previous month for growth calculation
    const startOfPreviousMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    const endOfPreviousMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      0
    );

    // Parallel execution for better performance
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalSubscriptions,
      activeSubscriptions,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      previousMonthRevenue,
      previousMonthOrders,
      previousMonthUsers,
      previousMonthSubscriptions,
      topSellingProducts,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      SubscriptionPlan.countDocuments(),
      SubscriptionPlan.countDocuments({ isActive: true }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "completed" }),
      Order.countDocuments({ status: "cancelled" }),
      this.getRevenueForPeriod(startOfCurrentMonth, endOfCurrentMonth),
      this.getRevenueForPeriod(startOfWeek, new Date()),
      this.getRevenueForPeriod(startOfToday, new Date()),
      this.getRevenueForPeriod(startOfPreviousMonth, endOfPreviousMonth),
      Order.countDocuments({
        createdAt: {
          $gte: startOfPreviousMonth,
          $lte: endOfPreviousMonth,
        },
      }),
      User.countDocuments({
        createdAt: {
          $gte: startOfPreviousMonth,
          $lte: endOfPreviousMonth,
        },
      }),
      (async () => {
        const { UserSubscription } = await import(
          "../Subscription/subscription.model"
        );
        return await UserSubscription.countDocuments({
          createdAt: {
            $gte: startOfPreviousMonth,
            $lte: endOfPreviousMonth,
          },
        });
      })(),
      this.getTopSellingProducts(10),
      this.getRecentOrders(10),
    ]);

    // Calculate total revenue
    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Get revenue chart data (last 6 months)
    const revenueChart = await this.getRevenueChartData(6);

    // Get current month data for growth calculation
    const currentMonthOrders = await Order.countDocuments({
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: endOfCurrentMonth,
      },
    });

    const currentMonthUsers = await User.countDocuments({
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: endOfCurrentMonth,
      },
    });

    const { UserSubscription } = await import(
      "../Subscription/subscription.model"
    );
    const currentMonthSubscriptions = await UserSubscription.countDocuments({
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: endOfCurrentMonth,
      },
    });

    // Calculate monthly growth percentages
    const revenueGrowth =
      previousMonthRevenue > 0
        ? (((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
            100).toFixed(1)
        : "0";

    const ordersGrowth =
      previousMonthOrders > 0
        ? (
            ((currentMonthOrders - previousMonthOrders) / previousMonthOrders) *
            100
          ).toFixed(1)
        : "0";

    const usersGrowth =
      previousMonthUsers > 0
        ? (((currentMonthUsers - previousMonthUsers) / previousMonthUsers) *
            100).toFixed(1)
        : "0";

    const subscriptionsGrowth =
      previousMonthSubscriptions > 0
        ? (
            ((currentMonthSubscriptions - previousMonthSubscriptions) /
              previousMonthSubscriptions) *
            100
          ).toFixed(1)
        : "0";

    // Format top selling products
    const formattedTopSellingProducts = topSellingProducts.map((product) => ({
      _id: product._id.toString(),
      name: product.productName,
      image: "",
      totalSold: product.totalSales || 0,
      revenue: product.revenue || 0,
    }));

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      totalProducts,
      totalSubscriptions,
      activeSubscriptions,
      pendingOrders,
      completedOrders,
      refundedOrders: 0,
      cancelledOrders,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      monthlyGrowth: {
        revenue: parseFloat(revenueGrowth),
        orders: parseFloat(ordersGrowth),
        users: parseFloat(usersGrowth),
        subscriptions: parseFloat(subscriptionsGrowth),
      },
      topSellingProducts: formattedTopSellingProducts,
      recentOrders,
      userGrowth: [],
      revenueGrowth: [],
      revenueChart,
    };
  }

  // User Management
  async getUsers(
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<TUserManagement> {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Apply filters
    if (filters.role) query.role = filters.role;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.emailVerified !== undefined)
      query.emailVerified = filters.emailVerified;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
        { phone: { $regex: filters.search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "user",
            as: "orders",
          },
        },
        {
          $addFields: {
            totalOrders: { $size: "$orders" },
            totalSpent: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: "$orders",
                      cond: {
                        $eq: ["$$this.paymentStatus", PAYMENT_STATUS.COMPLETED],
                      },
                    },
                  },
                  as: "order",
                  in: "$$order.totalAmount",
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            phone: 1,
            role: 1,
            isActive: 1,
            emailVerified: 1,
            totalOrders: 1,
            totalSpent: 1,
            lastLoginAt: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Product Management
  async getProducts(
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<TProductManagement> {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Apply filters
    if (filters.category) query.category = filters.category;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.isFeatured !== undefined) query.isFeatured = filters.isFeatured;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
        { tags: { $in: [new RegExp(filters.search, "i")] } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: "vendor",
          select: "name email",
          model: "User",
        })
        .select(
          "title description shortDescription images category vendor price originalPrice costPrice stock lowStockThreshold sku weight dimensions isActive isFeatured tags attributes seoTitle seoDescription digitalProduct totalSales revenue rating totalReviews createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    // Filter out null or invalid products
    const filteredProducts = products.filter(
      (product: any) => product && product._id
    );

    return {
      products: filteredProducts.map((product: any) => ({
        _id: product._id.toString(),
        name: product.title,
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        images: product.images || [],
        category:
          product.category && product.category._id
            ? {
                _id: product.category._id.toString(),
                name: product.category.name || "Unknown Category",
              }
            : {
                _id: "unknown",
                name: "Unknown Category",
              },
        vendor: product.vendor
          ? {
              _id: product.vendor._id?.toString() || product.vendor.toString(),
              name: product.vendor.name || "Unknown Vendor",
              email: product.vendor.email || "",
            }
          : {
              _id: "unknown",
              name: "Unknown Vendor",
              email: "",
            },
        price: product.price,
        comparePrice: product.originalPrice || undefined,
        costPrice: product.costPrice || undefined,
        stock: product.stock || 0,
        lowStockThreshold: product.lowStockThreshold || 10,
        sku: product.sku || undefined,
        weight: product.weight || undefined,
        dimensions: product.dimensions || undefined,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        tags: product.tags || [],
        attributes: product.attributes || [],
        seoTitle: product.seoTitle || undefined,
        seoDescription: product.seoDescription || undefined,
        digitalProduct: product.digitalProduct
          ? {
              isDigital: true,
              downloadUrl: product.digitalProduct.downloadUrl,
              downloadLimit: product.digitalProduct.downloadLimit,
              downloadExpiry: product.digitalProduct.downloadExpiry,
            }
          : undefined,
        totalSold: product.totalSales || 0,
        totalRevenue: product.revenue || 0,
        averageRating: product.rating || 0,
        totalReviews: product.totalReviews || 0,
        createdAt: product.createdAt
          ? new Date(product.createdAt).toISOString()
          : new Date().toISOString(),
        updatedAt: product.updatedAt
          ? new Date(product.updatedAt).toISOString()
          : new Date().toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        stats: {
          totalActive: filteredProducts.filter((p: any) => p.isActive).length,
          totalInactive: filteredProducts.filter((p: any) => !p.isActive)
            .length,
          lowStockProducts: filteredProducts.filter(
            (p: any) => p.stock < (p.lowStockThreshold || 10)
          ).length,
          outOfStockProducts: filteredProducts.filter((p: any) => p.stock === 0)
            .length,
          totalRevenue: filteredProducts.reduce(
            (sum: number, p: any) => sum + (p.revenue || 0),
            0
          ),
        },
      },
    };
  }

  // Order Management
  async getOrders(
    page: number = 1,
    limit: number = 10,
    filters: any = {}
  ): Promise<TOrderManagement> {
    const skip = (page - 1) * limit;
    const query: any = {};

    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .populate("items.product", "title")
        .select(
          "orderNumber user items totalAmount status paymentStatus paymentMethod createdAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders: orders.map((order: any) => ({
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: {
          _id: order.user._id.toString(),
          name: order.user.name,
          email: order.user.email,
        },
        items: order.items.map((item: any) => ({
          productName: item.product?.title || "Unknown Product",
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: order.totalAmount,
        status: order.status,
        orderStatus: order.status,

        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Bulk Operations
  async performBulkOperation(
    operation: TBulkOperation,
    adminUserId: string
  ): Promise<TBulkOperationResult> {
    const { operation: op, targetType, targetIds, reason } = operation;
    let processedCount = 0;
    let failedCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    try {
      // Log the bulk operation
      await this.logActivity({
        adminUser: new Types.ObjectId(adminUserId),
        action: `bulk_${op}_${targetType}`,
        target: { type: "system", id: "bulk_operation" },
        details: { operation, targetCount: targetIds.length, reason },
      });

      for (const targetId of targetIds) {
        try {
          await this.performSingleOperation(op, targetType, targetId);
          processedCount++;
        } catch (error: any) {
          failedCount++;
          errors.push({ id: targetId, error: error.message });
        }
      }

      return {
        success: true,
        processedCount,
        failedCount,
        errors,
      };
    } catch (error: any) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Bulk operation failed: ${error.message}`
      );
    }
  }

  // System Settings
  async getSystemSettings(): Promise<TSystemSettings> {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await SystemSettings.create({});
    }

    return settings;
  }

  async updateSystemSettings(
    updates: Partial<TSystemSettings>,
    adminUserId: string
  ): Promise<TSystemSettings> {
    const settings = await SystemSettings.findOneAndUpdate({}, updates, {
      new: true,
      upsert: true,
    });

    // Log the settings update
    await this.logActivity({
      adminUser: new Types.ObjectId(adminUserId),
      action: "update_system_settings",
      target: { type: "system", id: "settings" },
      details: { updatedFields: Object.keys(updates) },
    });

    return settings!;
  }

  // Activity Logging
  async logActivity(
    activityData: Omit<TActivityLog, "_id" | "createdAt">
  ): Promise<void> {
    await ActivityLog.create(activityData);
  }

  async getActivityLogs(
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ) {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filters.adminUser) query.adminUser = filters.adminUser;
    if (filters.action)
      query.action = { $regex: filters.action, $options: "i" };
    if (filters.targetType) query["target.type"] = filters.targetType;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate("adminUser", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Detailed User Information
  async getUserDetails(userId: string) {
    const user = await User.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user",
          as: "orders",
        },
      },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "_id",
          foreignField: "user",
          as: "subscriptions",
        },
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    cond: {
                      $eq: ["$$this.paymentStatus", PAYMENT_STATUS.COMPLETED],
                    },
                  },
                },
                as: "order",
                in: "$$order.totalAmount",
              },
            },
          },
          recentOrders: {
            $slice: [
              {
                $sortArray: {
                  input: "$orders",
                  sortBy: { createdAt: -1 },
                },
              },
              5,
            ],
          },
          activeSubscriptions: {
            $size: {
              $filter: {
                input: "$subscriptions",
                cond: { $eq: ["$$this.isActive", true] },
              },
            },
          },
        },
      },
      {
        $project: {
          password: 0,
          refreshToken: 0,
        },
      },
    ]);

    return user[0] || null;
  }

  // Detailed Product Information
  async getProductDetails(productId: string) {
    const product = await Product.aggregate([
      { $match: { _id: new Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "users",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorInfo",
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "items.product",
          as: "orderHistory",
        },
      },
      {
        $addFields: {
          vendor: { $arrayElemAt: ["$vendorInfo", 0] },
          salesHistory: {
            $slice: [
              {
                $sortArray: {
                  input: "$orderHistory",
                  sortBy: { createdAt: -1 },
                },
              },
              10,
            ],
          },
          monthlyRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orderHistory",
                    cond: {
                      $and: [
                        {
                          $eq: [
                            "$$this.paymentStatus",
                            PAYMENT_STATUS.COMPLETED,
                          ],
                        },
                        {
                          $gte: [
                            "$$this.createdAt",
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth(),
                              1
                            ),
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "order",
                in: {
                  $multiply: [
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$$order.items",
                                cond: {
                                  $eq: [
                                    "$$this.product",
                                    new Types.ObjectId(productId),
                                  ],
                                },
                              },
                            },
                            as: "item",
                            in: "$$item.price",
                          },
                        },
                        0,
                      ],
                    },
                    {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: "$$order.items",
                                cond: {
                                  $eq: [
                                    "$$this.product",
                                    new Types.ObjectId(productId),
                                  ],
                                },
                              },
                            },
                            as: "item",
                            in: "$$item.quantity",
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          vendorInfo: 0,
        },
      },
    ]);

    return product[0] || null;
  }

  // Detailed Order Information
  async getOrderDetails(orderId: string) {
    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate("items.product", "title price category")
      .populate("items.subscriptionPlan", "name price duration")
      .lean();

    return order;
  }

  // User Management Actions
  async updateUserStatus(
    userId: string,
    isActive: boolean,
    adminUserId: string
  ) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Log the action
    await this.logActivity({
      adminUser: new Types.ObjectId(adminUserId),
      action: isActive ? "activate_user" : "deactivate_user",
      target: { type: "user", id: userId },
      details: { isActive },
    });

    return user;
  }

  // Product Management Actions
  async updateProductStatus(
    productId: string,
    updates: { isActive?: boolean; isFeatured?: boolean },
    adminUserId: string
  ) {
    const product = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
    }).populate("vendor", "name email");

    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Log the action
    await this.logActivity({
      adminUser: new Types.ObjectId(adminUserId),
      action: "update_product_status",
      target: { type: "product", id: productId },
      details: updates,
    });

    return product;
  }

  // Order Management Actions
  async updateOrderStatus(
    orderId: string,
    updates: { status?: string; paymentStatus?: string },
    adminUserId: string
  ) {
    const order = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
    }).populate("user", "name email");

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Log the action
    await this.logActivity({
      adminUser: new Types.ObjectId(adminUserId),
      action: "update_order_status",
      target: { type: "order", id: orderId },
      details: updates,
    });

    return order;
  }

  // Data Export
  async exportData(request: TExportRequest): Promise<TExportResult> {
    // This is a placeholder implementation
    // In a real application, you would generate CSV/Excel/PDF files
    const fileName = `${request.type}_export_${Date.now()}.${request.format}`;
    const downloadUrl = `/api/admin/exports/${fileName}`;

    return {
      success: true,
      fileName,
      downloadUrl,
      fileSize: 1024, // Placeholder
      recordCount: 100, // Placeholder
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // System Health Check
  async getSystemHealth() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      activeSubscriptions,
      errorLogs,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      SubscriptionPlan.countDocuments({ isActive: true }),
      ActivityLog.countDocuments({
        action: { $regex: "error", $options: "i" },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    return {
      status: "healthy",
      timestamp: new Date(),
      database: "connected",
      services: {
        users: { count: totalUsers, status: "operational" },
        products: { count: totalProducts, status: "operational" },
        orders: { count: totalOrders, status: "operational" },
        subscriptions: { count: activeSubscriptions, status: "operational" },
      },
      errors: {
        last24Hours: errorLogs,
        status: errorLogs > 50 ? "warning" : "good",
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  // Reports and Analytics
  async getAdminReports(params: {
    reportType?: "sales" | "users" | "subscriptions" | "products" | "all";
    dateFrom?: string;
    dateTo?: string;
    granularity?: "day" | "week" | "month" | "year";
  }) {
    const { UserSubscription } = await import(
      "../Subscription/subscription.model"
    );

    const reportType = params.reportType || "all";
    const granularity = params.granularity || "month";

    // Sales Report
    const salesReport = await this.generateSalesReport(granularity);

    // User Report
    const userReport = await this.generateUserReport(granularity);

    // Subscription Report
    const subscriptionReport = await this.generateSubscriptionReport(
      granularity
    );

    // Product Report
    const productReport = await this.generateProductReport();

    return {
      salesReport,
      userReport,
      subscriptionReport,
      productReport,
    };
  }

  private async generateSalesReport(granularity: string) {
    // Get sales by month
    const salesByMonth = await Order.aggregate([
      {
        $match: {
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  [
                    "",
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                  "$_id.month",
                ],
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          sales: 1,
          orders: 1,
        },
      },
    ]);

    // Get sales by category
    const salesByCategory = await Order.aggregate([
      {
        $match: {
          paymentStatus: PAYMENT_STATUS.COMPLETED,
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $project: {
          category: { $ifNull: ["$_id", "Uncategorized"] },
          sales: 1,
        },
      },
      { $sort: { sales: -1 } },
    ]);

    const totalSales = salesByCategory.reduce(
      (sum, item) => sum + item.sales,
      0
    );

    const salesByCategoryWithPercentage = salesByCategory.map((item) => ({
      category: item.category,
      sales: item.sales,
      percentage: totalSales > 0 ? ((item.sales / totalSales) * 100).toFixed(1) : "0",
    }));

    // Get top products
    const topProducts = await Order.aggregate([
      {
        $match: {
          paymentStatus: PAYMENT_STATUS.COMPLETED,
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$items.product",
          product: { $first: "$productInfo.title" },
          sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          quantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
    ]);

    const totalOrders = await Order.countDocuments({
      paymentStatus: PAYMENT_STATUS.COMPLETED,
    });

    const averageOrderValue =
      totalOrders > 0
        ? (
            await Order.aggregate([
              { $match: { paymentStatus: PAYMENT_STATUS.COMPLETED } },
              { $group: { _id: null, avg: { $avg: "$totalAmount" } } },
            ])
          )[0]?.avg || 0
        : 0;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      salesByMonth,
      salesByCategory: salesByCategoryWithPercentage,
      topProducts,
    };
  }

  private async generateUserReport(granularity: string) {
    const userGrowth = await this.getUserGrowthData(6);

    const usersByLocation = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$address.country", "Unknown"] },
          users: { $sum: 1 },
        },
      },
      { $sort: { users: -1 } },
      { $limit: 10 },
    ]);

    const totalUsers = await User.countDocuments();

    const usersByLocationWithPercentage = usersByLocation.map((item) => ({
      country: item._id,
      users: item.users,
      percentage: totalUsers > 0 ? ((item.users / totalUsers) * 100).toFixed(1) : "0",
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const activeUsers = await User.countDocuments({
      lastLoginAt: { $gte: thirtyDaysAgo },
    });

    return {
      totalUsers,
      newUsers,
      activeUsers,
      userGrowth,
      usersByLocation: usersByLocationWithPercentage,
    };
  }

  private async generateSubscriptionReport(granularity: string) {
    const { UserSubscription } = await import(
      "../Subscription/subscription.model"
    );

    // Get subscription growth
    const subscriptionGrowth = await UserSubscription.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          newSubscriptions: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  [
                    "",
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                  "$_id.month",
                ],
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          newSubscriptions: "$newSubscriptions",
          churnedSubscriptions: { $literal: 0 },
          netGrowth: "$newSubscriptions",
        },
      },
    ]);

    // Plan distribution
    const planDistribution = await UserSubscription.aggregate([
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "subscriptionPlan",
          foreignField: "_id",
          as: "planInfo",
        },
      },
      { $unwind: "$planInfo" },
      {
        $group: {
          _id: "$subscriptionPlan",
          plan: { $first: "$planInfo.name" },
          subscriptions: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { subscriptions: -1 } },
    ]);

    const totalSubscriptionRevenue = planDistribution.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    const planDistributionWithPercentage = planDistribution.map((item) => ({
      plan: item.plan,
      subscriptions: item.subscriptions,
      revenue: item.revenue,
      percentage:
        totalSubscriptionRevenue > 0
          ? ((item.revenue / totalSubscriptionRevenue) * 100).toFixed(1)
          : "0",
    }));

    const totalSubscriptions = await UserSubscription.countDocuments();
    const activeSubscriptions = await UserSubscription.countDocuments({
      status: "active",
    });

    const monthlyRecurringRevenue = await UserSubscription.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "subscriptionPlan",
          foreignField: "_id",
          as: "planInfo",
        },
      },
      { $unwind: "$planInfo" },
      {
        $group: {
          _id: null,
          total: { $sum: "$planInfo.price" },
        },
      },
    ]);

    const churnRate =
      totalSubscriptions > 0
        ? (
            ((totalSubscriptions - activeSubscriptions) / totalSubscriptions) *
            100
          ).toFixed(1)
        : "0";

    return {
      totalSubscriptions,
      activeSubscriptions,
      monthlyRecurringRevenue: monthlyRecurringRevenue[0]?.total || 0,
      churnRate: parseFloat(churnRate),
      subscriptionGrowth,
      planDistribution: planDistributionWithPercentage,
    };
  }

  private async generateProductReport() {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lt: ["$stock", "$lowStockThreshold"] },
    });

    // Top selling products
    const topSellingProducts = await Product.aggregate([
      { $match: { totalSales: { $gt: 0 } } },
      {
        $project: {
          product: "$title",
          sold: "$totalSales",
          revenue: "$revenue",
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 10 },
    ]);

    // Category performance
    const categoryPerformance = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          products: { $sum: 1 },
          sales: { $sum: "$totalSales" },
          revenue: { $sum: "$revenue" },
        },
      },
      {
        $project: {
          category: { $ifNull: ["$_id", "Uncategorized"] },
          products: 1,
          sales: 1,
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      topSellingProducts,
      categoryPerformance,
    };
  }

  // Helper Methods
  private async getRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await Order.aggregate([
      {
        $match: {
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getTopSellingProducts(limit: number) {
    return await Product.aggregate([
      { $match: { totalSales: { $gt: 0 } } },
      {
        $project: {
          productId: "$_id",
          productName: "$title",
          totalSales: 1,
          revenue: 1,
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: limit },
    ]);
  }

  private async getRecentOrders(limit: number) {
    return await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          orderId: "$orderNumber",
          customerName: "$customer.name",
          amount: "$totalAmount",
          status: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);
  }

  private async getUserGrowthData(months: number) {
    const growthData = [];
    for (let i = months - 1; i >= 0; i--) {
      const currentDate = new Date();
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0
      );

      const [newUsers, totalUsers] = await Promise.all([
        User.countDocuments({
          createdAt: { $gte: monthStart, $lte: monthEnd },
        }),
        User.countDocuments({
          createdAt: { $lte: monthEnd },
        }),
      ]);

      growthData.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        newUsers,
        totalUsers,
      });
    }
    return growthData;
  }

  private async getRevenueGrowthData(months: number) {
    const growthData = [];
    for (let i = months - 1; i >= 0; i--) {
      const currentDate = new Date();
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0
      );

      const revenue = await this.getRevenueForPeriod(monthStart, monthEnd);

      growthData.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue,
      });
    }
    return growthData;
  }

  private async getRevenueChartData(months: number) {
    const chartData = [];
    for (let i = months - 1; i >= 0; i--) {
      const currentDate = new Date();
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0
      );

      const [revenue, orders] = await Promise.all([
        this.getRevenueForPeriod(monthStart, monthEnd),
        Order.countDocuments({
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          createdAt: { $gte: monthStart, $lte: monthEnd },
        }),
      ]);

      chartData.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
        }),
        revenue,
        orders,
      });
    }
    return chartData;
  }

  private async performSingleOperation(
    operation: string,
    targetType: string,
    targetId: string
  ): Promise<void> {
    switch (targetType) {
      case "user":
        await this.performUserOperation(operation, targetId);
        break;
      case "product":
        await this.performProductOperation(operation, targetId);
        break;
      case "order":
        await this.performOrderOperation(operation, targetId);
        break;
      default:
        throw new Error(`Unsupported target type: ${targetType}`);
    }
  }

  private async performUserOperation(
    operation: string,
    targetId: string
  ): Promise<void> {
    switch (operation) {
      case "activate":
        await User.findByIdAndUpdate(targetId, { isActive: true });
        break;
      case "deactivate":
        await User.findByIdAndUpdate(targetId, { isActive: false });
        break;
      case "delete":
        await User.findByIdAndDelete(targetId);
        break;
      default:
        throw new Error(`Unsupported operation for user: ${operation}`);
    }
  }

  private async performProductOperation(
    operation: string,
    targetId: string
  ): Promise<void> {
    switch (operation) {
      case "activate":
        await Product.findByIdAndUpdate(targetId, { isActive: true });
        break;
      case "deactivate":
        await Product.findByIdAndUpdate(targetId, { isActive: false });
        break;
      case "delete":
        await Product.findByIdAndDelete(targetId);
        break;
      case "feature":
        await Product.findByIdAndUpdate(targetId, { isFeatured: true });
        break;
      case "unfeature":
        await Product.findByIdAndUpdate(targetId, { isFeatured: false });
        break;
      default:
        throw new Error(`Unsupported operation for product: ${operation}`);
    }
  }

  private async performOrderOperation(
    operation: string,
    targetId: string
  ): Promise<void> {
    switch (operation) {
      case "delete":
        await Order.findByIdAndDelete(targetId);
        break;
      default:
        throw new Error(`Unsupported operation for order: ${operation}`);
    }
  }

  // Subscription Management
  async getSubscriptions(
    page: number = 1,
    limit: number = 10,
    filters: {
      search?: string;
      status?: string;
      plan?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: "startDate" | "endDate" | "totalPaid" | "createdAt";
      sortOrder?: "asc" | "desc";
    }
  ): Promise<{
    result: any[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { UserSubscription } = await import(
      "../Subscription/subscription.model"
    );

    const query: any = {};

    // Apply filters
    if (filters.search) {
      query.$or = [
        { "user.name": { $regex: filters.search, $options: "i" } },
        { "user.email": { $regex: filters.search, $options: "i" } },
        { "subscriptionPlan.name": { $regex: filters.search, $options: "i" } },
      ];
    }

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }

    if (filters.plan) {
      query.subscriptionPlan = new Types.ObjectId(filters.plan);
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    const sortOptions: any = {};
    sortOptions[filters.sortBy || "createdAt"] =
      filters.sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    const subscriptions = await UserSubscription.find(query)
      .populate("user", "name email mobileNumber")
      .populate("subscriptionPlan", "name price billingCycle")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await UserSubscription.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      result: subscriptions,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    const { UserSubscription } = await import(
      "../Subscription/subscription.model"
    );

    const subscription = await UserSubscription.findById(subscriptionId)
      .populate("user", "name email mobileNumber profilePhoto")
      .populate("subscriptionPlan")
      .lean();

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    return subscription;
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: string
  ): Promise<any> {
    const { UserSubscription } = await import(
      "../Subscription/subscription.model"
    );

    const subscription = await UserSubscription.findById(subscriptionId);

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    subscription.status = status as any;
    await subscription.save();

    return subscription.populate("user subscriptionPlan");
  }
}

export const adminService = new AdminService();
