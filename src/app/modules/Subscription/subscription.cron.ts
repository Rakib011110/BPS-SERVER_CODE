import cron from 'node-cron';
import { UserSubscription, SubscriptionPlan } from './subscription.model';
import { User } from '../User/user.model';
import { SUBSCRIPTION_STATUS } from './subscription.constant';
import { enhancedNotificationService } from '../Notification/enhancedNotification.service';

/**
 * Check for subscriptions expiring soon and send notifications
 * Runs daily at 9:00 AM
 */
export const checkExpiringSubscriptions = cron.schedule(
  '0 9 * * *', // Daily at 9:00 AM
  async () => {
    console.log('[CRON] Checking for expiring subscriptions...');

    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find active subscriptions expiring in 7 days
      const subscriptionsExpiring7Days = await UserSubscription.find({
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: {
          $gte: new Date(sevenDaysFromNow.setHours(0, 0, 0, 0)),
          $lte: new Date(sevenDaysFromNow.setHours(23, 59, 59, 999)),
        },
        expiryNotificationSent7Days: { $ne: true },
      })
        .populate('user')
        .populate('subscriptionPlan');

      console.log(
        `[CRON] Found ${subscriptionsExpiring7Days.length} subscriptions expiring in 7 days`
      );

      // Send 7-day expiry notifications
      for (const subscription of subscriptionsExpiring7Days) {
        try {
          const user = subscription.user as any;
          const plan = subscription.subscriptionPlan as any;

          if (user && plan) {
            await enhancedNotificationService.sendSubscriptionExpiringNotification(
              subscription,
              user,
              plan,
              7
            );

            // Mark notification as sent
            await UserSubscription.findByIdAndUpdate(subscription._id, {
              expiryNotificationSent7Days: true,
            });

            console.log(
              `[CRON] Sent 7-day expiry notification to ${user.email} for ${plan.name}`
            );
          }
        } catch (error) {
          console.error(
            `[CRON] Failed to send 7-day expiry notification for subscription ${subscription._id}:`,
            error
          );
        }
      }

      // Find active subscriptions expiring in 1 day
      const subscriptionsExpiring1Day = await UserSubscription.find({
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: {
          $gte: new Date(oneDayFromNow.setHours(0, 0, 0, 0)),
          $lte: new Date(oneDayFromNow.setHours(23, 59, 59, 999)),
        },
        expiryNotificationSent1Day: { $ne: true },
      })
        .populate('user')
        .populate('subscriptionPlan');

      console.log(
        `[CRON] Found ${subscriptionsExpiring1Day.length} subscriptions expiring in 1 day`
      );

      // Send 1-day expiry notifications
      for (const subscription of subscriptionsExpiring1Day) {
        try {
          const user = subscription.user as any;
          const plan = subscription.subscriptionPlan as any;

          if (user && plan) {
            await enhancedNotificationService.sendSubscriptionExpiringNotification(
              subscription,
              user,
              plan,
              1
            );

            // Mark notification as sent
            await UserSubscription.findByIdAndUpdate(subscription._id, {
              expiryNotificationSent1Day: true,
            });

            console.log(
              `[CRON] Sent 1-day expiry notification to ${user.email} for ${plan.name}`
            );
          }
        } catch (error) {
          console.error(
            `[CRON] Failed to send 1-day expiry notification for subscription ${subscription._id}:`,
            error
          );
        }
      }

      // Find and expire subscriptions that have passed their end date
      const expiredSubscriptions = await UserSubscription.find({
        status: SUBSCRIPTION_STATUS.ACTIVE,
        endDate: { $lt: now },
        autoRenew: false, // Only expire if not set to auto-renew
      }).populate('subscriptionPlan');

      console.log(
        `[CRON] Found ${expiredSubscriptions.length} subscriptions to expire`
      );

      // Expire subscriptions
      for (const subscription of expiredSubscriptions) {
        try {
          await UserSubscription.findByIdAndUpdate(subscription._id, {
            status: SUBSCRIPTION_STATUS.EXPIRED,
          });

          // Decrease subscriber count
          const plan = subscription.subscriptionPlan as any;
          if (plan) {
            await SubscriptionPlan.findByIdAndUpdate(plan._id, {
              $inc: { totalSubscribers: -1 },
            });
          }

          console.log(
            `[CRON] Expired subscription ${subscription._id} for plan ${plan?.name || 'Unknown'}`
          );
        } catch (error) {
          console.error(
            `[CRON] Failed to expire subscription ${subscription._id}:`,
            error
          );
        }
      }

      console.log('[CRON] Subscription expiry check completed');
    } catch (error) {
      console.error('[CRON] Error checking expiring subscriptions:', error);
    }
  },
  {
    scheduled: false, // Don't start immediately, will be started manually in app.ts
    timezone: 'Asia/Dhaka', // Adjust to your timezone
  }
);

/**
 * Start the subscription expiry cron job
 */
export const startSubscriptionCron = () => {
  console.log('[CRON] Starting subscription expiry cron job (daily at 9:00 AM)');
  checkExpiringSubscriptions.start();
};

/**
 * Stop the subscription expiry cron job
 */
export const stopSubscriptionCron = () => {
  console.log('[CRON] Stopping subscription expiry cron job');
  checkExpiringSubscriptions.stop();
};
