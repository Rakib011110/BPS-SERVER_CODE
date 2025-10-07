import { UserSubscription } from "../Subscription/subscription.model";
import { User } from "../User/user.model";
import { SubscriptionPlan } from "../Subscription/subscription.model";
import { sendEmail } from "../../utils/sendEmail";
import Notification from "./notification.model";
import { NOTIFICATION_TYPE } from "./notification.constant";
import { smsService } from "./sms.service";

// Automated subscription notification service
export class SubscriptionNotificationService {
  // Send subscription renewal reminder (7 days before expiry)
  static async sendRenewalReminder7Days() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSoon = await UserSubscription.find({
      status: "ACTIVE",
      endDate: {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      },
      renewalReminderSent: { $ne: true },
    }).populate("user subscriptionPlan");

    for (const subscription of expiringSoon) {
      const user = subscription.user as any;
      const plan = subscription.subscriptionPlan as any;

      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Subscription Renewal Reminder</h2>
          <p>Dear ${user.name},</p>
          
          <p>Your <strong>${
            plan.name
          }</strong> subscription will expire in 7 days on <strong>${subscription.endDate.toDateString()}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Subscription Details:</h3>
            <ul>
              <li><strong>Plan:</strong> ${plan.name}</li>
              <li><strong>Expiry Date:</strong> ${subscription.endDate.toDateString()}</li>
              <li><strong>Renewal Price:</strong> $${plan.price}</li>
            </ul>
          </div>
          
          <p>To continue enjoying uninterrupted access to all features, please renew your subscription before it expires.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{FRONTEND_URL}}/subscriptions/renew/${subscription._id}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Renew Now
            </a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The BPS E-Commerce Team</p>
        </div>
      `;

      try {
        // Send email notification
        await sendEmail(
          user.email,
          `Renewal Reminder: Your ${plan.name} subscription expires in 7 days`,
          emailTemplate
        );

        // Send SMS notification
        const smsMessage = `BPS E-Commerce: Your ${
          plan.name
        } subscription expires in 7 days (${subscription.endDate.toDateString()}). Renew now at $${
          plan.price
        }.`;
        try {
          await smsService.sendSMS({
            to: user.mobileNumber || "",
            message: smsMessage,
          });
        } catch (smsError) {
          console.error(
            `❌ Failed to send SMS reminder to ${user.mobileNumber}:`,
            smsError
          );
        }

        // Mark as reminder sent
        await UserSubscription.findByIdAndUpdate(subscription._id, {
          renewalReminderSent: true,
        });

        // Create notification record
        await Notification.create({
          user: subscription.user,
          type: NOTIFICATION_TYPE.SUBSCRIPTION_RENEWAL_REMINDER,
          subject: `Renewal Reminder: Your ${plan.name} subscription expires in 7 days`,
          message: `Your ${plan.name} subscription will expire in 7 days. Renew now to continue enjoying all features.`,
          metadata: {
            subscriptionId: subscription._id,
            planName: plan.name,
            expiryDate: subscription.endDate,
          },
        });

        console.log(`✅ Renewal reminder sent to ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to send renewal reminder to ${user.email}:`,
          error
        );
      }
    }

    console.log(
      `📧 Processed ${expiringSoon.length} renewal reminders (7 days)`
    );
  }

  // Send subscription renewal reminder (1 day before expiry)
  static async sendRenewalReminder1Day() {
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const expiringTomorrow = await UserSubscription.find({
      status: "ACTIVE",
      endDate: {
        $gte: new Date(),
        $lte: oneDayFromNow,
      },
      finalReminderSent: { $ne: true },
    }).populate("user subscriptionPlan");

    for (const subscription of expiringTomorrow) {
      const user = subscription.user as any;
      const plan = subscription.subscriptionPlan as any;

      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">⚠️ Final Renewal Notice</h2>
          <p>Dear ${user.name},</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>URGENT:</strong> Your <strong>${
              plan.name
            }</strong> subscription expires <strong>tomorrow</strong> (${subscription.endDate.toDateString()}).
          </div>
          
          <p>This is your final reminder to renew your subscription before it expires and you lose access to:</p>
          
          <ul>
            ${plan.features
              .map((feature: string) => `<li>${feature}</li>`)
              .join("")}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{FRONTEND_URL}}/subscriptions/renew/${subscription._id}" 
               style="background-color: #dc3545; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              RENEW NOW - $${plan.price}
            </a>
          </div>
          
          <p><small>After expiry, you'll need to resubscribe and may lose any accumulated benefits.</small></p>
          
          <p>Questions? Contact support immediately.</p>
          
          <p>Best regards,<br>The BPS E-Commerce Team</p>
        </div>
      `;

      try {
        // Send email notification
        await sendEmail(
          user.email,
          `🚨 FINAL NOTICE: ${plan.name} expires tomorrow!`,
          emailTemplate
        );

        // Send SMS notification
        const smsMessage = `🚨 BPS E-Commerce: FINAL NOTICE - Your ${
          plan.name
        } subscription expires TOMORROW (${subscription.endDate.toDateString()}). Renew immediately at $${
          plan.price
        } to avoid service interruption.`;
        try {
          await smsService.sendSMS({
            to: user.mobileNumber || "",
            message: smsMessage,
          });
        } catch (smsError) {
          console.error(
            `❌ Failed to send SMS final reminder to ${user.mobileNumber}:`,
            smsError
          );
        }

        // Mark as final reminder sent
        await UserSubscription.findByIdAndUpdate(subscription._id, {
          finalReminderSent: true,
        });

        console.log(`🚨 Final reminder sent to ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to send final reminder to ${user.email}:`,
          error
        );
      }
    }

    console.log(
      `🚨 Processed ${expiringTomorrow.length} final reminders (1 day)`
    );
  }

  // Send subscription expiry notification
  static async sendExpiryNotifications() {
    const now = new Date();

    const expiredSubscriptions = await UserSubscription.find({
      status: "ACTIVE",
      endDate: { $lt: now },
    }).populate("user subscriptionPlan");

    for (const subscription of expiredSubscriptions) {
      const user = subscription.user as any;
      const plan = subscription.subscriptionPlan as any;

      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Subscription Expired</h2>
          <p>Dear ${user.name},</p>
          
          <p>Your <strong>${
            plan.name
          }</strong> subscription has expired as of ${subscription.endDate.toDateString()}.</p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Access Restricted:</strong> Some features may no longer be available to you.
          </div>
          
          <p>Good news! You can reactivate your subscription at any time and continue where you left off.</p>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Special Offer - 20% Off Renewal!</h4>
            <p>Renew within the next 7 days and get 20% off your next subscription.</p>
            <p><strong>Use code:</strong> WELCOME_BACK20</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{FRONTEND_URL}}/subscriptions/renew/${
              subscription._id
            }?discount=WELCOME_BACK20" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reactivate with 20% Off
            </a>
          </div>
          
          <p>Thank you for being a valued customer. We hope to see you back soon!</p>
          
          <p>Best regards,<br>The BPS E-Commerce Team</p>
        </div>
      `;

      try {
        await sendEmail(
          user.email,
          `Subscription Expired - Special 20% Off Renewal Offer`,
          emailTemplate
        );

        // Update subscription status to EXPIRED
        await UserSubscription.findByIdAndUpdate(subscription._id, {
          status: "EXPIRED",
        });

        console.log(`💔 Expiry notification sent to ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to send expiry notification to ${user.email}:`,
          error
        );
      }
    }

    console.log(
      `💔 Processed ${expiredSubscriptions.length} expiry notifications`
    );
  }

  // Send trial expiry reminders
  static async sendTrialExpiryReminders() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const trialExpiringSoon = await UserSubscription.find({
      status: "TRIAL",
      endDate: {
        $gte: new Date(),
        $lte: threeDaysFromNow,
      },
      trialReminderSent: { $ne: true },
    }).populate("user subscriptionPlan");

    for (const subscription of trialExpiringSoon) {
      const user = subscription.user as any;
      const plan = subscription.subscriptionPlan as any;

      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #fd7e14;">Your Free Trial is Ending Soon!</h2>
          <p>Dear ${user.name},</p>
          
          <p>Your free trial of <strong>${
            plan.name
          }</strong> will end in 3 days on ${subscription.endDate.toDateString()}.</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Don't lose access to:</h4>
            <ul>
              ${plan.features
                .map((feature: string) => `<li>${feature}</li>`)
                .join("")}
            </ul>
          </div>
          
          <p>Continue your journey with us by upgrading to the full subscription.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{FRONTEND_URL}}/subscriptions/upgrade/${
              subscription._id
            }" 
               style="background-color: #fd7e14; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Upgrade Now - Only $${plan.price}/month
            </a>
          </div>
          
          <p>Questions about upgrading? Our support team is here to help!</p>
          
          <p>Best regards,<br>The BPS E-Commerce Team</p>
        </div>
      `;

      try {
        await sendEmail(
          user.email,
          `⏰ Your free trial ends in 3 days - Upgrade now!`,
          emailTemplate
        );

        // Mark as trial reminder sent
        await UserSubscription.findByIdAndUpdate(subscription._id, {
          trialReminderSent: true,
        });

        console.log(`⏰ Trial reminder sent to ${user.email}`);
      } catch (error) {
        console.error(
          `❌ Failed to send trial reminder to ${user.email}:`,
          error
        );
      }
    }

    console.log(`⏰ Processed ${trialExpiringSoon.length} trial reminders`);
  }

  // Run all automated notifications (to be called by cron job)
  static async runAutomatedNotifications() {
    console.log("🔄 Starting automated subscription notifications...");

    try {
      await Promise.all([
        this.sendRenewalReminder7Days(),
        this.sendRenewalReminder1Day(),
        this.sendExpiryNotifications(),
        this.sendTrialExpiryReminders(),
      ]);

      console.log(
        "✅ All automated subscription notifications completed successfully"
      );
    } catch (error) {
      console.error("❌ Error in automated notifications:", error);
    }
  }
}
