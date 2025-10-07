export interface TSalesReport {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  period: string;
  startDate: Date;
  endDate: Date;
  revenueGrowth?: number;
  orderGrowth?: number;
}

export interface TProductAnalytics {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
  totalDownloads: number;
  averageRating?: number;
  conversionRate: number;
}

export interface TSubscriptionAnalytics {
  totalActiveSubscriptions: number;
  totalInactiveSubscriptions: number;
  totalRevenue: number;
  churnRate: number;
  growthRate: number;
  averageLifetimeValue: number;
  subscriptionsByPlan: Array<{
    planId: string;
    planName: string;
    activeCount: number;
    revenue: number;
  }>;
}

export interface TUserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: { [role: string]: number };
  userGrowthTrend: Array<{
    date: string;
    count: number;
  }>;
}

export interface TRevenueBreakdown {
  oneTimeProducts: {
    revenue: number;
    count: number;
    percentage: number;
  };
  subscriptions: {
    revenue: number;
    count: number;
    percentage: number;
  };
  totalRevenue: number;
}

export interface TDownloadStatistics {
  totalDownloads: number;
  downloadsByProduct: Array<{
    productId: string;
    productName: string;
    downloadCount: number;
  }>;
  downloadsByPeriod: Array<{
    date: string;
    downloads: number;
  }>;
}

export interface TDashboardAnalytics {
  salesReport: TSalesReport;
  subscriptionAnalytics: TSubscriptionAnalytics;
  userAnalytics: TUserAnalytics;
  revenueBreakdown: TRevenueBreakdown;
  topProducts: TProductAnalytics[];
  downloadStatistics: TDownloadStatistics;
}
