import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriptionServices } from "./subscription.service";

// Subscription Plan Controllers
const createSubscriptionPlan = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.createSubscriptionPlan(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Subscription plan created successfully!",
    data: result,
  });
});

const getAllSubscriptionPlans = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getAllSubscriptionPlans(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plans retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getAllSubscriptionPlansForAdmin = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getAllSubscriptionPlansForAdmin(
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plans retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getSubscriptionPlanById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionServices.getSubscriptionPlanById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plan retrieved successfully!",
    data: result,
  });
});

const getSubscriptionPlanBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const result = await SubscriptionServices.getSubscriptionPlanBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plan retrieved successfully!",
    data: result,
  });
});

const getFeaturedSubscriptionPlans = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
  const result = await SubscriptionServices.getFeaturedSubscriptionPlans(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Featured subscription plans retrieved successfully!",
    data: result,
  });
});

const getSubscriptionPlansByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const result = await SubscriptionServices.getSubscriptionPlansByCategory(
    category,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category subscription plans retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const updateSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionServices.updateSubscriptionPlan(
    id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plan updated successfully!",
    data: result,
  });
});

const deleteSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  await SubscriptionServices.deleteSubscriptionPlan(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription plan deleted successfully!",
    data: null,
  });
});

// User Subscription Controllers
const subscribeToplan = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const userEmail = req.user?.email;
  const userName = req.user?.name;
  const { subscriptionPlan, paymentMethod } = req.body;
  const result = await SubscriptionServices.subscribeToplan(
    userId,
    subscriptionPlan,
    paymentMethod,
    userEmail,
    userName
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: result.paymentSession
      ? "Payment initiated successfully!"
      : "Subscribed to plan successfully!",
    data: result,
  });
});

const getMySubscriptions = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const result = await SubscriptionServices.getUserSubscriptions(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your subscriptions retrieved successfully!",
    data: result,
  });
});

const getMyActiveSubscription = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const result = await SubscriptionServices.getActiveUserSubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Active subscription retrieved successfully!",
    data: result,
  });
});

const getAllUserSubscriptions = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getAllUserSubscriptions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User subscriptions retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const cancelMySubscription = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const { subscriptionId } = req.params;
  const { reason } = req.body;
  const result = await SubscriptionServices.cancelSubscription(
    userId,
    subscriptionId,
    reason
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription cancelled successfully!",
    data: result,
  });
});

const confirmSubscriptionPayment = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const paymentData = req.body;
  const result = await SubscriptionServices.confirmSubscriptionPayment(
    transactionId,
    paymentData
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription payment confirmed successfully!",
    data: result,
  });
});

const processSubscriptionLifecycle = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.processSubscriptionLifecycle();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription lifecycle processed successfully!",
    data: result,
  });
});

const renewSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const { paymentAmount, transactionId } = req.body;
  const result = await SubscriptionServices.renewSubscription(
    subscriptionId,
    paymentAmount,
    transactionId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription renewed successfully!",
    data: result,
  });
});

const approveSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const result = await SubscriptionServices.approveSubscription(subscriptionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription approved successfully!",
    data: result,
  });
});

const rejectSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const { reason } = req.body;
  const result = await SubscriptionServices.rejectSubscription(
    subscriptionId,
    reason
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription rejected successfully!",
    data: result,
  });
});

export const SubscriptionControllers = {
  // Subscription Plan Controllers
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getAllSubscriptionPlansForAdmin,
  getSubscriptionPlanById,
  getSubscriptionPlanBySlug,
  getFeaturedSubscriptionPlans,
  getSubscriptionPlansByCategory,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,

  // User Subscription Controllers
  subscribeToplan,
  confirmSubscriptionPayment,
  processSubscriptionLifecycle,
  getMySubscriptions,
  getMyActiveSubscription,
  getAllUserSubscriptions,
  cancelMySubscription,
  renewSubscription,
  approveSubscription,
  rejectSubscription,
};
