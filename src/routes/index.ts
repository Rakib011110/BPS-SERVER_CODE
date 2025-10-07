import { Router } from "express";
import { UserRoutes } from "../app/modules/User/user.routes";
import { TeamRouter } from "../app/modules/Team/team.routes";
import { AuthRoutes } from "../app/modules/auth/auth.routes";
import { SMSRoutes } from "../app/modules/sms/sms.routes";
import { ProductRoutes } from "../app/modules/Product/product.routes";
import { SubscriptionRoutes } from "../app/modules/Subscription/subscription.routes";
import { OrderRoutes } from "../app/modules/Order/order.routes";
import { CartRoutes } from "../app/modules/Cart/cart.routes";
import { PaymentRoutes } from "../app/modules/Payment/payment.routes";
import { NotificationRoutes } from "../app/modules/Notification/notification.routes";
import { NotificationAdminRoutes } from "../app/modules/Notification/notificationAdmin.routes";
import { couponRoutes } from "../app/modules/Payment/coupon/coupon.routes";
import { installmentPlanRoutes } from "../app/modules/Payment/installmentPlan/installmentPlan.routes";
import { LicenseKeyRoutes } from "../app/modules/LicenseKey/licenseKey.routes";
import { AnalyticsRoutes } from "../app/modules/Analytics/analytics.routes";
import { DigitalDownloadRoutes } from "../app/modules/DigitalDownload/digitalDownload.routes";
import { AdminRoutes } from "../app/modules/Admin/admin.routes";
import { UploadRoutes } from "./upload.routes";

const routes = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },

  {
    path: "/team",
    route: TeamRouter,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },

  {
    path: "/payments",
    route: PaymentRoutes,
  },
  {
    path: "/coupons",
    route: couponRoutes,
  },
  {
    path: "/installment-plans",
    route: installmentPlanRoutes,
  },

  {
    path: "/sms",
    route: SMSRoutes,
  },
  // E-commerce Routes
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/subscriptions",
    route: SubscriptionRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/cart",
    route: CartRoutes,
  },
  // {
  //   path: "/e-payments",
  //   route: EnhancedPaymentRoutes
  // },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/admin/notifications",
    route: NotificationAdminRoutes,
  },
  {
    path: "/license-keys",
    route: LicenseKeyRoutes,
  },
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
  {
    path: "/downloads",
    route: DigitalDownloadRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/upload",
    route: UploadRoutes,
  },
];

moduleRoutes.forEach((route) => routes.use(route.path, route.route));

export default routes;
