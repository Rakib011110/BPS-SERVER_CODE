import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../User/user.constant";
import { SubscriptionControllers } from "./subscription.controller";
import { SubscriptionValidations } from "./subscription.validation";

const router = express.Router();

// Public routes - Subscription Plans
router.get("/plans", SubscriptionControllers.getAllSubscriptionPlans);

router.get(
  "/plans/featured",
  SubscriptionControllers.getFeaturedSubscriptionPlans
);

router.get(
  "/plans/category/:category",
  SubscriptionControllers.getSubscriptionPlansByCategory
);

router.get(
  "/plans/slug/:slug",
  SubscriptionControllers.getSubscriptionPlanBySlug
);

router.get("/plans/:id", SubscriptionControllers.getSubscriptionPlanById);

// Authenticated User routes - Subscriptions
router.post(
  "/subscribe",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  validateRequest(SubscriptionValidations.subscribeToplanValidationSchema),
  SubscriptionControllers.subscribeToplan
);

router.post(
  "/confirm-payment/:transactionId",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  SubscriptionControllers.confirmSubscriptionPayment
);

router.post(
  "/process-lifecycle",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.processSubscriptionLifecycle
);

router.get(
  "/my-subscriptions",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  SubscriptionControllers.getMySubscriptions
);

router.get(
  "/my-active-subscription",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  SubscriptionControllers.getMyActiveSubscription
);

router.put(
  "/cancel/:subscriptionId",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  SubscriptionControllers.cancelMySubscription
);

router.put(
  "/renew/:subscriptionId",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.renewSubscription
);

router.put(
  "/approve/:subscriptionId",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.approveSubscription
);

router.put(
  "/reject/:subscriptionId",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.rejectSubscription
);

// Admin only routes - Subscription Plans Management
router.post(
  "/plans",
  auth(USER_ROLE.ADMIN),
  validateRequest(
    SubscriptionValidations.createSubscriptionPlanValidationSchema
  ),
  SubscriptionControllers.createSubscriptionPlan
);

router.get(
  "/admin/plans",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.getAllSubscriptionPlansForAdmin
);

router.get(
  "/admin/user-subscriptions",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.getAllUserSubscriptions
);

router.put(
  "/plans/:id",
  auth(USER_ROLE.ADMIN),
  validateRequest(
    SubscriptionValidations.updateSubscriptionPlanValidationSchema
  ),
  SubscriptionControllers.updateSubscriptionPlan
);

router.delete(
  "/plans/:id",
  auth(USER_ROLE.ADMIN),
  SubscriptionControllers.deleteSubscriptionPlan
);

export const SubscriptionRoutes = router;
