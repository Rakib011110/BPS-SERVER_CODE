import express from "express";
import { requireAdmin } from "../../middlewares/auth";
import { AnalyticsControllers } from "./analytics.controller";

const router = express.Router();

// All analytics routes require admin access
router.use(requireAdmin);

// Sales Analytics
router.get("/sales-report", AnalyticsControllers.getSalesReport);

// Product Analytics
router.get("/products", AnalyticsControllers.getProductAnalytics);

// Subscription Analytics
router.get("/subscriptions", AnalyticsControllers.getSubscriptionAnalytics);

// User Analytics
router.get("/users", AnalyticsControllers.getUserAnalytics);

// Revenue Analytics
router.get("/revenue-breakdown", AnalyticsControllers.getRevenueBreakdown);

// Download Statistics
router.get("/downloads", AnalyticsControllers.getDownloadStatistics);

// Comprehensive Dashboard Analytics
router.get("/dashboard", AnalyticsControllers.getDashboardAnalytics);

export const AnalyticsRoutes = router;
