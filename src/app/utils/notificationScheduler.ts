import { SubscriptionNotificationService } from "../modules/Notification/subscriptionNotification.service";

// Simple cron job scheduler (in production, you'd use node-cron or similar)
export class NotificationScheduler {
  private static intervals: NodeJS.Timeout[] = [];

  // Start all notification schedules
  static start() {
    console.log("🚀 Starting notification scheduler...");

    // Run subscription notifications every hour
    const subscriptionInterval = setInterval(() => {
      this.runSubscriptionNotifications();
    }, 60 * 60 * 1000); // Every hour

    // Run at startup
    this.runSubscriptionNotifications();

    this.intervals.push(subscriptionInterval);
  }

  // Stop all scheduled notifications
  static stop() {
    console.log("🛑 Stopping notification scheduler...");
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
  }

  // Run subscription notifications
  private static async runSubscriptionNotifications() {
    console.log("🔔 Running scheduled subscription notifications...");
    try {
      await SubscriptionNotificationService.runAutomatedNotifications();
    } catch (error) {
      console.error("❌ Error in scheduled notifications:", error);
    }
  }

  // Manual trigger for testing
  static async triggerSubscriptionNotifications() {
    await this.runSubscriptionNotifications();
  }
}
