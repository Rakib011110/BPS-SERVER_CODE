import fs from "fs";
import path from "path";
import { sendEmail } from "../../utils/sendEmail";
import { SMSService } from "../sms/sms.service";

interface TemplateData {
  [key: string]: any;
}

class EnhancedNotificationService {
  private templatesPath = path.join(__dirname, "templates");

  /**
   * Load and populate email template
   */
  private loadEmailTemplate(templateName: string, data: TemplateData): string {
    try {
      const templatePath = path.join(
        this.templatesPath,
        "email",
        `${templateName}.html`
      );
      let template = fs.readFileSync(templatePath, "utf-8");

      // Replace placeholders
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        template = template.replace(regex, data[key] || "");
      });

      // Handle conditional blocks (basic implementation)
      template = template.replace(
        /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
        (match, key, content) => {
          return data[key] ? content : "";
        }
      );

      // Handle loops (basic implementation)
      template = template.replace(
        /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g,
        (match, key, content) => {
          if (Array.isArray(data[key])) {
            return data[key]
              .map((item) => {
                return content.replace(/{{this}}/g, item);
              })
              .join("");
          }
          return "";
        }
      );

      return template;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      return "";
    }
  }

  /**
   * Load and populate SMS template
   */
  private loadSMSTemplate(templateName: string, data: TemplateData): string {
    try {
      const templatePath = path.join(
        this.templatesPath,
        "sms",
        `${templateName}.txt`
      );
      let template = fs.readFileSync(templatePath, "utf-8");

      // Replace placeholders
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        template = template.replace(regex, data[key] || "");
      });

      return template;
    } catch (error) {
      console.error(`Error loading SMS template ${templateName}:`, error);
      return "";
    }
  }

  /**
   * Send Order Confirmed Notification
   */
  async sendOrderConfirmedNotification(order: any, user: any) {
    try {
      const templateData = {
        userName: user.name,
        orderNumber: order.orderNumber,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        totalAmount: order.totalAmount.toFixed(2),
        paymentStatus: order.paymentStatus,
        itemCount: order.items.length,
        orderUrl: `${process.env.FRONTEND_URL}/user-profile/orders/${order.orderNumber}`,
        siteName: process.env.SITE_NAME || "BPS E-Commerce",
        year: new Date().getFullYear(),
        shortUrl: `${process.env.FRONTEND_URL}/orders/${order.orderNumber}`,
      };

      // Send Email
      const emailContent = this.loadEmailTemplate(
        "order-confirmed",
        templateData
      );
      if (emailContent) {
        await sendEmail(user.email, "Order Confirmed", emailContent);
      }

      // Send SMS
      if (user.phone) {
        const smsContent = this.loadSMSTemplate(
          "order-confirmed",
          templateData
        );
        if (smsContent) {
          await SMSService.sendSMS(user.phone, smsContent);
        }
      }

      console.log(`Order confirmed notification sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending order confirmed notification:", error);
    }
  }

  /**
   * Send Payment Completed Notification
   */
  async sendPaymentCompletedNotification(payment: any, user: any, order?: any) {
    try {
      const templateData = {
        userName: user.name,
        transactionId: payment.transactionId,
        amount: payment.amount.toFixed(2),
        paymentMethod: payment.paymentMethod || "N/A",
        paymentDate: new Date(payment.createdAt).toLocaleDateString(),
        orderNumber: order?.orderNumber || "N/A",
        orderUrl: order
          ? `${process.env.FRONTEND_URL}/user-profile/orders/${order.orderNumber}`
          : `${process.env.FRONTEND_URL}/user-profile/payments`,
        siteName: process.env.SITE_NAME || "BPS E-Commerce",
        year: new Date().getFullYear(),
        shortUrl: order
          ? `${process.env.FRONTEND_URL}/orders/${order.orderNumber}`
          : `${process.env.FRONTEND_URL}/payments`,
      };

      // Send Email
      const emailContent = this.loadEmailTemplate(
        "payment-completed",
        templateData
      );
      if (emailContent) {
        await sendEmail(user.email, "Payment Successful", emailContent);
      }

      // Send SMS
      if (user.phone) {
        const smsContent = this.loadSMSTemplate(
          "payment-completed",
          templateData
        );
        if (smsContent) {
          await SMSService.sendSMS(user.phone, smsContent);
        }
      }

      console.log(`Payment completed notification sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending payment completed notification:", error);
    }
  }

  /**
   * Send Digital Product Ready Notification
   */
  async sendDigitalProductReadyNotification(
    order: any,
    user: any,
    product: any,
    downloadUrl: string
  ) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry

      const templateData = {
        userName: user.name,
        productName: product.title,
        orderNumber: order.orderNumber,
        expiryDate: expiryDate.toLocaleDateString(),
        expiryHours: 168, // 7 days in hours
        downloadUrl: downloadUrl,
        shortUrl: downloadUrl,
        siteName: process.env.SITE_NAME || "BPS E-Commerce",
        year: new Date().getFullYear(),
      };

      // Send Email
      const emailContent = this.loadEmailTemplate(
        "digital-product-ready",
        templateData
      );
      if (emailContent) {
        await sendEmail(user.email, "Your Download is Ready", emailContent);
      }

      // Send SMS
      if (user.phone) {
        const smsContent = this.loadSMSTemplate(
          "digital-product-ready",
          templateData
        );
        if (smsContent) {
          await SMSService.sendSMS(user.phone, smsContent);
        }
      }

      console.log(`Digital product ready notification sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending digital product ready notification:", error);
    }
  }

  /**
   * Send License Key Generated Notification
   */
  async sendLicenseKeyNotification(
    order: any,
    user: any,
    product: any,
    licenseKey: any
  ) {
    try {
      const templateData = {
        userName: user.name,
        productName: product.title,
        orderNumber: order.orderNumber,
        licenseKey: licenseKey.key,
        maxActivations: licenseKey.maxActivations,
        expiryDate: licenseKey.expiresAt
          ? new Date(licenseKey.expiresAt).toLocaleDateString()
          : null,
        orderUrl: `${process.env.FRONTEND_URL}/user-profile/orders/${order.orderNumber}`,
        siteName: process.env.SITE_NAME || "BPS E-Commerce",
        year: new Date().getFullYear(),
      };

      // Send Email
      const emailContent = this.loadEmailTemplate(
        "license-key-generated",
        templateData
      );
      if (emailContent) {
        await sendEmail(user.email, "Your License Key", emailContent);
      }

      console.log(`License key notification sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending license key notification:", error);
    }
  }

  /**
   * Send Subscription Activated Notification
   */
  async sendSubscriptionActivatedNotification(
    subscription: any,
    user: any,
    plan: any
  ) {
    try {
      const templateData = {
        userName: user.name,
        planName: plan.name,
        billingCycle: plan.billingCycle,
        startDate: new Date(subscription.startDate).toLocaleDateString(),
        nextBillingDate: new Date(subscription.endDate).toLocaleDateString(),
        amount: subscription.amount.toFixed(2),
        features: plan.features || [],
        subscriptionUrl: `${process.env.FRONTEND_URL}/user-profile/subscriptions`,
        siteName: process.env.SITE_NAME || "BPS E-Commerce",
        year: new Date().getFullYear(),
        shortUrl: `${process.env.FRONTEND_URL}/subscriptions`,
      };

      // Send Email
      const emailContent = this.loadEmailTemplate(
        "subscription-activated",
        templateData
      );
      if (emailContent) {
        await sendEmail(user.email, "Subscription Activated", emailContent);
      }

      // Send SMS
      if (user.phone) {
        const smsContent = this.loadSMSTemplate(
          "subscription-activated",
          templateData
        );
        if (smsContent) {
          await SMSService.sendSMS(user.phone, smsContent);
        }
      }

      console.log(`Subscription activated notification sent to ${user.email}`);
    } catch (error) {
      console.error(
        "Error sending subscription activated notification:",
        error
      );
    }
  }

  /**
   * Send Subscription Expiring Notification
   */
  async sendSubscriptionExpiringNotification(
    subscription: any,
    user: any,
    plan: any,
    daysLeft: number
  ) {
    try {
      const templateData = {
        userName: user.name,
        planName: plan.name,
        daysLeft: daysLeft.toString(),
        expiryDate: new Date(subscription.endDate).toLocaleDateString(),
        features: plan.features || [],
        renewUrl: `${process.env.FRONTEND_URL}/user-profile/subscriptions`,
        siteName: process.env.SITE_NAME || "BPS E-Commerce",
        year: new Date().getFullYear(),
        shortUrl: `${process.env.FRONTEND_URL}/subscriptions/renew`,
      };

      // Send Email
      const emailContent = this.loadEmailTemplate(
        "subscription-expiring",
        templateData
      );
      if (emailContent) {
        await sendEmail(
          user.email,
          `Subscription Expiring in ${daysLeft} Days`,
          emailContent
        );
      }

      // Send SMS
      if (user.phone) {
        const smsContent = this.loadSMSTemplate(
          "subscription-expiring",
          templateData
        );
        if (smsContent) {
          await SMSService.sendSMS(user.phone, smsContent);
        }
      }

      console.log(
        `Subscription expiring notification sent to ${user.email} (${daysLeft} days)`
      );
    } catch (error) {
      console.error("Error sending subscription expiring notification:", error);
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
