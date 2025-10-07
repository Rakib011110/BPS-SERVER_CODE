import httpStatus from "http-status";
import { SubscriptionPlan, UserSubscription } from "./subscription.model";
import {
  TSubscriptionPlan,
  TUserSubscription,
  TSubscriptionFilter,
} from "./subscription.interface";
import { SubscriptionPlanSearchableFields } from "./subscription.constant";
import { SUBSCRIPTION_STATUS } from "./subscription.constant";
import AppError from "../../error/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import {
  createPayment,
  PaymentGateway,
} from "../Payment/paymentGateway.service";
import { SubscriptionNotificationService } from "../Notification/subscriptionNotification.service";
import { enhancedNotificationService } from "../Notification/enhancedNotification.service";
import { User } from "../User/user.model";

// Subscription Plan Services
const createSubscriptionPlan = async (
  payload: TSubscriptionPlan
): Promise<TSubscriptionPlan> => {
  try {
    // Check if slug already exists
    if (payload.slug) {
      const existingPlan = await SubscriptionPlan.findOne({
        slug: payload.slug,
      });
      if (existingPlan) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Subscription plan with this slug already exists"
        );
      }
    }

    const result = await SubscriptionPlan.create(payload);
    return result;
  } catch (error) {
    throw error;
  }
};

const getAllSubscriptionPlans = async (query: Record<string, unknown>) => {
  try {
    // Map 'featured' parameter to 'isFeatured' and 'active' to 'isActive' for database query
    const processedQuery = { ...query };
    if (processedQuery.featured !== undefined) {
      processedQuery.isFeatured = processedQuery.featured;
      delete processedQuery.featured;
    }
    if (processedQuery.active !== undefined) {
      processedQuery.isActive = processedQuery.active;
      delete processedQuery.active;
    }

    const planQuery = new QueryBuilder(
      SubscriptionPlan.find({ isActive: true }).populate(
        "includedProducts",
        "title price"
      ),
      processedQuery
    )
      .search(SubscriptionPlanSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await planQuery.modelQuery;
    const meta = await planQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getAllSubscriptionPlansForAdmin = async (
  query: Record<string, unknown>
) => {
  try {
    const planQuery = new QueryBuilder(
      SubscriptionPlan.find().populate("includedProducts", "title price"),
      query
    )
      .search(SubscriptionPlanSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await planQuery.modelQuery;
    const meta = await planQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getSubscriptionPlanById = async (
  id: string
): Promise<TSubscriptionPlan> => {
  try {
    const result = await SubscriptionPlan.findById(id).populate(
      "includedProducts",
      "title price thumbnailImage"
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getSubscriptionPlanBySlug = async (
  slug: string
): Promise<TSubscriptionPlan> => {
  try {
    const result = await SubscriptionPlan.findOne({
      slug,
      isActive: true,
    }).populate("includedProducts", "title price thumbnailImage");

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getFeaturedSubscriptionPlans = async (limit: number = 6) => {
  try {
    const result = await SubscriptionPlan.find({
      isActive: true,
      isFeatured: true,
    })
      .populate("includedProducts", "title price thumbnailImage")
      .sort({ createdAt: -1 })
      .limit(limit);

    return result;
  } catch (error) {
    throw error;
  }
};

const getSubscriptionPlansByCategory = async (
  category: string,
  query: Record<string, unknown>
) => {
  try {
    const planQuery = new QueryBuilder(
      SubscriptionPlan.find({ category, isActive: true }).populate(
        "includedProducts",
        "title price"
      ),
      query
    )
      .search(SubscriptionPlanSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await planQuery.modelQuery;
    const meta = await planQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const updateSubscriptionPlan = async (
  id: string,
  payload: Partial<TSubscriptionPlan>
): Promise<TSubscriptionPlan> => {
  try {
    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    // Check slug uniqueness if being updated
    if (payload.slug && payload.slug !== plan.slug) {
      const existingPlan = await SubscriptionPlan.findOne({
        slug: payload.slug,
      });
      if (existingPlan) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Subscription plan with this slug already exists"
        );
      }
    }

    const result = await SubscriptionPlan.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).populate("includedProducts", "title price");

    return result!;
  } catch (error) {
    throw error;
  }
};

const deleteSubscriptionPlan = async (id: string): Promise<void> => {
  try {
    const plan = await SubscriptionPlan.findById(id);

    if (!plan) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");
    }

    // Check if there are active subscriptions to this plan
    const activeSubscriptions = await UserSubscription.countDocuments({
      subscriptionPlan: id,
      status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL] },
    });

    if (activeSubscriptions > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot delete plan with active subscriptions"
      );
    }

    await SubscriptionPlan.findByIdAndDelete(id);
  } catch (error) {
    throw error;
  }
};

// User Subscription Services
const subscribeToplan = async (
  userId: string,
  planId: string,
  paymentMethod?: string,
  userEmail?: string,
  userName?: string
): Promise<{
  subscription?: TUserSubscription;
  paymentSession?: {
    sessionId: string;
    gatewayUrl: string;
    transactionId: string;
  };
}> => {
  try {
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Subscription plan not found or inactive"
      );
    }

    // Check if user already has an active subscription to this plan
    const existingSubscription = await UserSubscription.findOne({
      user: userId,
      subscriptionPlan: planId,
      status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL] },
    });

    if (existingSubscription) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You already have an active subscription to this plan"
      );
    }

    const startDate = new Date();
    const endDate = new Date();

    // Calculate end date based on plan duration
    switch (plan.durationType) {
      case "days":
        endDate.setDate(endDate.getDate() + plan.duration);
        break;
      case "months":
        endDate.setMonth(endDate.getMonth() + plan.duration);
        break;
      case "years":
        endDate.setFullYear(endDate.getFullYear() + plan.duration);
        break;
    }

    const trialEndDate =
      plan.trialPeriod > 0
        ? new Date(startDate.getTime() + plan.trialPeriod * 24 * 60 * 60 * 1000)
        : undefined;

    // If plan has trial period, create subscription immediately
    if (plan.trialPeriod > 0) {
      const subscriptionData = {
        user: userId,
        subscriptionPlan: planId,
        status: SUBSCRIPTION_STATUS.TRIAL,
        startDate,
        endDate,
        nextBillingDate: trialEndDate,
        trialEndDate,
        paymentMethod,
        autoRenew: true,
      };

      const result = await UserSubscription.create(subscriptionData);

      // Update plan subscriber count
      await SubscriptionPlan.findByIdAndUpdate(planId, {
        $inc: { totalSubscribers: 1 },
      });

      const populatedSubscription = (await UserSubscription.findById(
        result._id
      ).populate("subscriptionPlan")) as TUserSubscription;

      // Send subscription activated notification
      try {
        const user = await User.findById(userId);
        if (user) {
          await enhancedNotificationService.sendSubscriptionActivatedNotification(
            populatedSubscription,
            user,
            plan
          );
        }
      } catch (notificationError) {
        console.error(
          "Failed to send subscription activated notification:",
          notificationError
        );
      }

      return {
        subscription: populatedSubscription,
      };
    }

    // For paid subscriptions without trial, handle payment based on method
    if (paymentMethod === "form") {
      // For form/manual payment, create subscription with pending status for admin approval
      const subscriptionData = {
        user: userId,
        subscriptionPlan: planId,
        status: SUBSCRIPTION_STATUS.PENDING,
        startDate,
        endDate,
        nextBillingDate: endDate,
        trialEndDate,
        paymentMethod: "form",
        autoRenew: true,
        transactionId: `FORM-${Date.now()}-${userId}`,
      };

      const result = await UserSubscription.create(subscriptionData);

      return {
        subscription: (await UserSubscription.findById(result._id).populate(
          "subscriptionPlan"
        )) as TUserSubscription,
        paymentSession: undefined, // No payment session for form payments
      };
    } else {
      // For gateway payments (SSLCommerz, etc.), initiate payment
      const paymentData = {
        gateway: PaymentGateway.SSLCOMMERZ,
        amount: plan.price,
        currency: "BDT",
        description: `Subscription to ${plan.name}`,
        orderId: `SUB-${Date.now()}-${userId}`,
        customerEmail: userEmail,
        customerName: userName,
        successUrl: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/success?type=subscription&subscriptionId=pending`,
        cancelUrl: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/payment/cancel?type=subscription`,
        metadata: {
          subscriptionPlanId: planId,
          userId: userId,
          type: "subscription",
        },
      };

      const paymentResponse = await createPayment(paymentData);

      // Create subscription with pending status
      const subscriptionData = {
        user: userId,
        subscriptionPlan: planId,
        status: SUBSCRIPTION_STATUS.PENDING,
        startDate,
        endDate,
        nextBillingDate: endDate,
        trialEndDate,
        paymentMethod: paymentMethod || "sslcommerz",
        autoRenew: true,
        transactionId: paymentResponse.transactionId,
      };

      const result = await UserSubscription.create(subscriptionData);

      return {
        subscription: (await UserSubscription.findById(result._id).populate(
          "subscriptionPlan"
        )) as TUserSubscription,
        paymentSession: {
          sessionId: paymentResponse.transactionId!,
          gatewayUrl:
            (paymentResponse as any).paymentUrl ||
            (paymentResponse as any).GatewayPageURL ||
            "",
          transactionId: paymentResponse.transactionId!,
        },
      };
    }
  } catch (error) {
    throw error;
  }
};

const confirmSubscriptionPayment = async (
  transactionId: string,
  paymentData: any
): Promise<TUserSubscription> => {
  try {
    // Find subscription by transaction ID
    const subscription = await UserSubscription.findOne({ transactionId });

    if (!subscription) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Subscription not found for this transaction"
      );
    }

    if (subscription.status !== SUBSCRIPTION_STATUS.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Subscription is not in pending status"
      );
    }

    // Update subscription status to active
    const updatedSubscription = await UserSubscription.findByIdAndUpdate(
      subscription._id,
      {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        paymentStatus: "completed",
        paymentDetails: paymentData,
      },
      { new: true }
    ).populate("subscriptionPlan");

    // Update plan subscriber count
    await SubscriptionPlan.findByIdAndUpdate(subscription.subscriptionPlan, {
      $inc: { totalSubscribers: 1 },
    });

    // Send subscription activated notification
    try {
      const user = await User.findById(subscription.user);
      const plan = await SubscriptionPlan.findById(
        subscription.subscriptionPlan
      );
      if (user && plan) {
        await enhancedNotificationService.sendSubscriptionActivatedNotification(
          updatedSubscription,
          user,
          plan
        );
      }
    } catch (notificationError) {
      console.error(
        "Failed to send subscription activated notification:",
        notificationError
      );
    }

    return updatedSubscription as TUserSubscription;
  } catch (error) {
    throw error;
  }
};

const processSubscriptionLifecycle = async (): Promise<{
  trialToActive: number;
  expiredSubscriptions: number;
  renewedSubscriptions: number;
}> => {
  try {
    const now = new Date();
    let trialToActive = 0;
    let expiredSubscriptions = 0;
    let renewedSubscriptions = 0;

    // 1. Convert trial subscriptions to active when trial period ends
    const trialSubscriptions = await UserSubscription.find({
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndDate: { $lte: now },
    });

    for (const subscription of trialSubscriptions) {
      await UserSubscription.findByIdAndUpdate(subscription._id, {
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });
      trialToActive++;
    }

    // 2. Expire subscriptions that have passed their end date
    const expiredSubs = await UserSubscription.find({
      status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIAL] },
      endDate: { $lte: now },
    });

    for (const subscription of expiredSubs) {
      await UserSubscription.findByIdAndUpdate(subscription._id, {
        status: SUBSCRIPTION_STATUS.EXPIRED,
      });

      // Decrease subscriber count
      await SubscriptionPlan.findByIdAndUpdate(subscription.subscriptionPlan, {
        $inc: { totalSubscribers: -1 },
      });

      expiredSubscriptions++;
    }

    // 3. Auto-renew subscriptions (if enabled and payment method exists)
    // This is a simplified version - in production you'd integrate with payment gateway
    const renewableSubscriptions = await UserSubscription.find({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      autoRenew: true,
      endDate: { $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }, // Expires within 7 days
      paymentMethod: { $exists: true },
    });

    // For now, just mark them as renewed (in production, charge the payment method)
    for (const subscription of renewableSubscriptions) {
      const plan = await SubscriptionPlan.findById(
        subscription.subscriptionPlan
      );
      if (plan) {
        const newEndDate = new Date(subscription.endDate);
        switch (plan.durationType) {
          case "days":
            newEndDate.setDate(newEndDate.getDate() + plan.duration);
            break;
          case "months":
            newEndDate.setMonth(newEndDate.getMonth() + plan.duration);
            break;
          case "years":
            newEndDate.setFullYear(newEndDate.getFullYear() + plan.duration);
            break;
        }

        await UserSubscription.findByIdAndUpdate(subscription._id, {
          endDate: newEndDate,
          nextBillingDate: newEndDate,
          lastPaymentDate: now,
          lastPaymentAmount: plan.price,
        });

        renewedSubscriptions++;
      }
    }

    // Send automated notifications
    try {
      await SubscriptionNotificationService.runAutomatedNotifications();
    } catch (notificationError) {
      console.error(
        "Error sending automated notifications:",
        notificationError
      );
    }

    return {
      trialToActive,
      expiredSubscriptions,
      renewedSubscriptions,
    };
  } catch (error) {
    throw error;
  }
};

const getUserSubscriptions = async (userId: string) => {
  try {
    const result = await UserSubscription.find({ user: userId })
      .populate("subscriptionPlan", "name price duration durationType features")
      .sort({ createdAt: -1 });

    return result;
  } catch (error) {
    throw error;
  }
};

const getActiveUserSubscription = async (userId: string) => {
  try {
    const result = await UserSubscription.getActiveSubscription(userId);
    return result;
  } catch (error) {
    throw error;
  }
};

const getAllUserSubscriptions = async (query: Record<string, unknown>) => {
  try {
    const subscriptionQuery = new QueryBuilder(
      UserSubscription.find()
        .populate("user", "name email")
        .populate("subscriptionPlan", "name price"),
      query
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await subscriptionQuery.modelQuery;
    const meta = await subscriptionQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const cancelSubscription = async (
  userId: string,
  subscriptionId: string,
  reason?: string
) => {
  try {
    const subscription = await UserSubscription.findOne({
      _id: subscriptionId,
      user: userId,
    });

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Subscription is already cancelled"
      );
    }

    const result = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: SUBSCRIPTION_STATUS.CANCELLED,
        cancellationDate: new Date(),
        cancellationReason: reason,
        autoRenew: false,
      },
      { new: true }
    ).populate("subscriptionPlan");

    // Update plan subscriber count
    await SubscriptionPlan.findByIdAndUpdate(subscription.subscriptionPlan, {
      $inc: { totalSubscribers: -1 },
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const renewSubscription = async (
  subscriptionId: string,
  paymentAmount: number,
  transactionId: string
) => {
  try {
    const subscription = await UserSubscription.findById(
      subscriptionId
    ).populate("subscriptionPlan");

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    const plan = subscription.subscriptionPlan as any;
    const newEndDate = new Date(subscription.endDate);

    // Extend subscription based on plan duration
    switch (plan.durationType) {
      case "days":
        newEndDate.setDate(newEndDate.getDate() + plan.duration);
        break;
      case "months":
        newEndDate.setMonth(newEndDate.getMonth() + plan.duration);
        break;
      case "years":
        newEndDate.setFullYear(newEndDate.getFullYear() + plan.duration);
        break;
    }

    const paymentRecord = {
      amount: paymentAmount,
      paymentDate: new Date(),
      transactionId,
      status: "success" as const,
    };

    const result = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: newEndDate,
        nextBillingDate: newEndDate,
        lastPaymentDate: new Date(),
        lastPaymentAmount: paymentAmount,
        $push: { paymentHistory: paymentRecord },
      },
      { new: true }
    ).populate("subscriptionPlan");

    return result;
  } catch (error) {
    throw error;
  }
};

// Convert trial subscription to paid subscription
const convertTrialToPaid = async (
  subscriptionId: string,
  paymentMethod?: string
): Promise<TUserSubscription> => {
  try {
    const subscription = await UserSubscription.findById(
      subscriptionId
    ).populate("subscriptionPlan");

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    if (subscription.status !== SUBSCRIPTION_STATUS.TRIAL) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Subscription is not in trial status"
      );
    }

    const plan = subscription.subscriptionPlan as any;
    const now = new Date();

    // Calculate new end date from now
    const newEndDate = new Date();
    switch (plan.durationType) {
      case "days":
        newEndDate.setDate(newEndDate.getDate() + plan.duration);
        break;
      case "months":
        newEndDate.setMonth(newEndDate.getMonth() + plan.duration);
        break;
      case "years":
        newEndDate.setFullYear(newEndDate.getFullYear() + plan.duration);
        break;
    }

    // Update subscription to active
    const updatedSubscription = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: newEndDate,
        nextBillingDate: newEndDate,
        paymentMethod,
        lastPaymentDate: now,
        lastPaymentAmount: plan.price,
        $push: {
          paymentHistory: {
            amount: plan.price,
            paymentDate: now,
            transactionId: `trial_conversion_${Date.now()}`,
            status: "success",
          },
        },
      },
      { new: true }
    ).populate("subscriptionPlan user");

    return updatedSubscription as TUserSubscription;
  } catch (error) {
    throw error;
  }
};

const approveSubscription = async (
  subscriptionId: string
): Promise<TUserSubscription> => {
  try {
    const subscription = await UserSubscription.findById(subscriptionId);

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    if (subscription.status !== SUBSCRIPTION_STATUS.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Subscription is not in pending status"
      );
    }

    // Update subscription status to active
    const updatedSubscription = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        paymentStatus: "completed",
        approvedAt: new Date(),
        approvedBy: "admin", // You might want to pass the admin ID
      },
      { new: true }
    ).populate("subscriptionPlan user");

    // Update plan subscriber count
    await SubscriptionPlan.findByIdAndUpdate(subscription.subscriptionPlan, {
      $inc: { totalSubscribers: 1 },
    });

    return updatedSubscription as TUserSubscription;
  } catch (error) {
    throw error;
  }
};

const rejectSubscription = async (
  subscriptionId: string,
  reason?: string
): Promise<TUserSubscription> => {
  try {
    const subscription = await UserSubscription.findById(subscriptionId);

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, "Subscription not found");
    }

    if (subscription.status !== SUBSCRIPTION_STATUS.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Subscription is not in pending status"
      );
    }

    // Update subscription status to rejected
    const updatedSubscription = await UserSubscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: SUBSCRIPTION_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason || "Rejected by admin",
      },
      { new: true }
    ).populate("subscriptionPlan user");

    return updatedSubscription as TUserSubscription;
  } catch (error) {
    throw error;
  }
};

export const SubscriptionServices = {
  // Subscription Plan Services
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getAllSubscriptionPlansForAdmin,
  getSubscriptionPlanById,
  getSubscriptionPlanBySlug,
  getFeaturedSubscriptionPlans,
  getSubscriptionPlansByCategory,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,

  // User Subscription Services
  subscribeToplan,
  confirmSubscriptionPayment,
  processSubscriptionLifecycle,
  convertTrialToPaid,
  getUserSubscriptions,
  getActiveUserSubscription,
  getAllUserSubscriptions,
  cancelSubscription,
  renewSubscription,
  approveSubscription,
  rejectSubscription,
};
