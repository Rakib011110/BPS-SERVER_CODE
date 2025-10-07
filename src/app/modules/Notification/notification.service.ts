import { TNotification, TCreateNotification } from './notification.interface';
import { NOTIFICATION_TYPE, NOTIFICATION_STATUS, NOTIFICATION_CHANNEL } from './notification.constant';
import { 
  smsService, 
  sendOrderConfirmationSMS,
  sendPaymentSuccessSMS,
  sendPaymentFailedSMS,
  sendSubscriptionActivatedSMS,
  sendSubscriptionExpiredSMS,
  sendDownloadReadySMS,
  sendPasswordResetSMS,
  sendAccountCreatedSMS 
} from './sms.service';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import sendEmail from '../../utils/sendEmail';
import Notification from './notification.model';

// Notification service for handling all types of notifications
class NotificationService {
  
  // Create a new notification record
  async createNotification(notificationData: TCreateNotification) {
    const notification = await Notification.create(notificationData);
    return notification;
  }

  // Send notification (email, SMS, or both)
  async sendNotification(notificationData: {
    userId: string;
    type: keyof typeof NOTIFICATION_TYPE;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
    sendEmail?: boolean;
    sendSMS?: boolean;
    userEmail?: string;
    userPhone?: string;
  }) {
    const {
      userId,
      type,
      subject,
      message,
      metadata = {},
      sendEmail: shouldSendEmail = true,
      sendSMS: shouldSendSMS = true,
      userEmail,
      userPhone
    } = notificationData;

    try {
      // Create notification record for email
      let emailNotification = null;
      if (shouldSendEmail && userEmail) {
        emailNotification = await this.createNotification({
          user: userId,
          type: NOTIFICATION_TYPE[type],
          channel: NOTIFICATION_CHANNEL.EMAIL,
          recipient: { email: userEmail },
          subject: subject || 'Notification',
          message,
          htmlContent: message,
          metadata
        });
      }

      // Create notification record for SMS
      let smsNotification = null;
      if (shouldSendSMS && userPhone) {
        smsNotification = await this.createNotification({
          user: userId,
          type: NOTIFICATION_TYPE[type],
          channel: NOTIFICATION_CHANNEL.SMS,
          recipient: { phone: userPhone },
          message,
          metadata
        });
      }

      const results = {
        emailNotificationId: emailNotification?._id,
        smsNotificationId: smsNotification?._id,
        emailSent: false,
        smsSent: false,
        emailError: null as string | null,
        smsError: null as string | null
      };

      // Send email notification
      if (shouldSendEmail && userEmail && emailNotification) {
        try {
          const emailSent = await sendEmail(userEmail, subject || 'Notification', message);
          if (emailSent) {
            results.emailSent = true;
            await Notification.findByIdAndUpdate(emailNotification._id, {
              status: NOTIFICATION_STATUS.SENT,
              sentAt: new Date()
            });
          } else {
            results.emailError = 'Email sending failed';
            await Notification.findByIdAndUpdate(emailNotification._id, {
              status: NOTIFICATION_STATUS.FAILED,
              errorMessage: 'Email sending failed'
            });
          }
        } catch (error: any) {
          results.emailError = error.message;
          console.error('Email sending failed:', error);
          await Notification.findByIdAndUpdate(emailNotification._id, {
            status: NOTIFICATION_STATUS.FAILED,
            errorMessage: error.message
          });
        }
      }

      // Send SMS notification
      if (shouldSendSMS && userPhone && smsNotification) {
        try {
          const smsResult = await smsService.sendSMS({
            to: userPhone,
            message: message.replace(/<[^>]*>/g, '') // Strip HTML tags for SMS
          });
          
          if (smsResult.success) {
            results.smsSent = true;
            await Notification.findByIdAndUpdate(smsNotification._id, {
              status: NOTIFICATION_STATUS.SENT,
              sentAt: new Date(),
              metadata: { ...metadata, messageId: smsResult.messageId }
            });
          } else {
            results.smsError = smsResult.error || 'SMS sending failed';
            await Notification.findByIdAndUpdate(smsNotification._id, {
              status: NOTIFICATION_STATUS.FAILED,
              errorMessage: smsResult.error || 'SMS sending failed'
            });
          }
        } catch (error: any) {
          results.smsError = error.message;
          console.error('SMS sending failed:', error);
          await Notification.findByIdAndUpdate(smsNotification._id, {
            status: NOTIFICATION_STATUS.FAILED,
            errorMessage: error.message
          });
        }
      }

      return results;
    } catch (error: any) {
      console.error('Notification sending failed:', error);
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send notification');
    }
  }

  // Send order confirmation notification
  async sendOrderConfirmation(orderData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    userName: string;
    orderId: string;
    orderTotal: number;
    items: any[];
  }) {
    const { userId, userEmail, userPhone, userName, orderId, orderTotal, items } = orderData;

    // Create detailed HTML email message using your existing email styling
    const emailMessage = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .container {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                  margin: -30px -30px 20px -30px;
              }
              .order-details {
                  background: white;
                  padding: 20px;
                  border-radius: 5px;
                  margin: 20px 0;
              }
              .item {
                  border-bottom: 1px solid #eee;
                  padding: 10px 0;
              }
              .total {
                  font-size: 24px;
                  font-weight: bold;
                  color: #28a745;
                  text-align: center;
                  margin-top: 20px;
              }
              .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                  color: #666;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Order Confirmation</h1>
              </div>
              
              <p>Dear ${userName},</p>
              <p>Thank you for your order! We're excited to confirm that your order has been received and is being processed.</p>
              
              <div class="order-details">
                  <h3>📋 Order Details</h3>
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                  
                  <h4>Items Ordered:</h4>
                  ${items.map(item => `
                      <div class="item">
                          <strong>${item.name}</strong><br>
                          Quantity: ${item.quantity} × ৳${item.price} = ৳${item.price * item.quantity}
                      </div>
                  `).join('')}
                  
                  <div class="total">Total Amount: ৳${orderTotal}</div>
              </div>
              
              <p>🚀 <strong>What's Next?</strong></p>
              <ul>
                  <li>You will receive a payment confirmation email once payment is processed</li>
                  <li>Digital products will be available for download immediately after payment</li>
                  <li>You can track your order status in your account dashboard</li>
              </ul>
              
              <div class="footer">
                  <p>Thank you for choosing our digital store!</p>
                  <p>Best regards,<br>Digital Store Team</p>
                  <p>Need help? Reply to this email or contact support.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    // Send notification
    await this.sendNotification({
      userId,
      type: 'ORDER_CONFIRMATION',
      subject: `Order Confirmation - ${orderId}`,
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { orderId, orderTotal, items }
    });

    // Send specific SMS
    await sendOrderConfirmationSMS(userPhone, orderId, orderTotal);
  }

  // Send payment success notification
  async sendPaymentSuccess(paymentData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    userName: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
  }) {
    const { userId, userEmail, userPhone, userName, orderId, amount, paymentMethod, transactionId } = paymentData;

    const emailMessage = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .container {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                  margin: -30px -30px 20px -30px;
              }
              .payment-details {
                  background: white;
                  padding: 20px;
                  border-radius: 5px;
                  margin: 20px 0;
              }
              .success-badge {
                  background: #28a745;
                  color: white;
                  padding: 5px 15px;
                  border-radius: 20px;
                  font-weight: bold;
              }
              .download-section {
                  background: #e3f2fd;
                  padding: 20px;
                  border-radius: 5px;
                  margin: 20px 0;
                  text-align: center;
              }
              .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                  color: #666;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>✅ Payment Successful</h1>
              </div>
              
              <p>Dear ${userName},</p>
              <p>Great news! Your payment has been processed successfully.</p>
              
              <div class="payment-details">
                  <h3>💳 Payment Details</h3>
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Amount Paid:</strong> ৳${amount}</p>
                  <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                  <p><strong>Transaction ID:</strong> ${transactionId}</p>
                  <p><strong>Payment Status:</strong> <span class="success-badge">✅ Completed</span></p>
                  <p><strong>Payment Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="download-section">
                  <h3>📥 Download Your Products</h3>
                  <p>Your digital products are now ready for download!</p>
                  <p>Check your account dashboard or look for download links in upcoming emails.</p>
                  <p><em>Download links are valid for 7 days from purchase date.</em></p>
              </div>
              
              <p>🎊 <strong>Thank you for your purchase!</strong></p>
              <p>We hope you enjoy your digital products. If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <div class="footer">
                  <p>Thank you for choosing our digital store!</p>
                  <p>Best regards,<br>Digital Store Team</p>
                  <p>Need help? Reply to this email or contact support.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    await this.sendNotification({
      userId,
      type: 'PAYMENT_SUCCESSFUL',
      subject: `Payment Successful - Order ${orderId}`,
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { orderId, amount, paymentMethod, transactionId }
    });

    await sendPaymentSuccessSMS(userPhone, orderId, amount);
  }

  // Send payment failed notification
  async sendPaymentFailed(paymentData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    orderId: string;
    amount: number;
    reason: string;
  }) {
    const { userId, userEmail, userPhone, orderId, amount, reason } = paymentData;

    const emailMessage = `
      <h2>Payment Failed</h2>
      <p>Unfortunately, your payment could not be processed.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Amount:</strong> ৳${amount}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please try again or contact our support team for assistance.</p>
    `;

    await this.sendNotification({
      userId,
      type: 'PAYMENT_FAILED',
      subject: 'Payment Failed',
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { orderId, amount, reason }
    });

    await sendPaymentFailedSMS(userPhone, orderId);
  }

  // Send subscription activated notification
  async sendSubscriptionActivated(subscriptionData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    subscriptionName: string;
    validUntil: Date;
    benefits: string[];
  }) {
    const { userId, userEmail, userPhone, subscriptionName, validUntil, benefits } = subscriptionData;

    const emailMessage = `
      <h2>Subscription Activated</h2>
      <p>Your ${subscriptionName} subscription is now active!</p>
      <p><strong>Valid Until:</strong> ${validUntil.toLocaleDateString()}</p>
      <h3>Your Benefits:</h3>
      <ul>
        ${benefits.map(benefit => `<li>${benefit}</li>`).join('')}
      </ul>
      <p>Enjoy your premium features!</p>
    `;

    await this.sendNotification({
      userId,
      type: 'SUBSCRIPTION_ACTIVATED',
      subject: 'Subscription Activated',
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { subscriptionName, validUntil, benefits }
    });

    await sendSubscriptionActivatedSMS(userPhone, subscriptionName);
  }

  // Send download ready notification
  async sendDownloadReady(downloadData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    productName: string;
    downloadLink: string;
    expiresAt: Date;
  }) {
    const { userId, userEmail, userPhone, productName, downloadLink, expiresAt } = downloadData;

    const emailMessage = `
      <h2>Download Ready</h2>
      <p>Your ${productName} is ready for download!</p>
      <p><strong>Download Link:</strong> <a href="${downloadLink}">${downloadLink}</a></p>
      <p><strong>Link Expires:</strong> ${expiresAt.toLocaleString()}</p>
      <p>Please download your file before the link expires.</p>
    `;

    await this.sendNotification({
      userId,
      type: 'DOWNLOAD_READY',
      subject: 'Download Ready',
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { productName, downloadLink, expiresAt }
    });

    await sendDownloadReadySMS(userPhone, productName);
  }

  // Send password reset notification
  async sendPasswordReset(resetData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    resetCode: string;
    resetLink: string;
  }) {
    const { userId, userEmail, userPhone, resetCode, resetLink } = resetData;

    const emailMessage = `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your account.</p>
      <p><strong>Reset Code:</strong> ${resetCode}</p>
      <p><strong>Reset Link:</strong> <a href="${resetLink}">${resetLink}</a></p>
      <p>This code is valid for 10 minutes. If you didn't request this, please ignore this message.</p>
    `;

    await this.sendNotification({
      userId,
      type: 'PASSWORD_RESET',
      subject: 'Password Reset',
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { resetCode, resetLink }
    });

    await sendPasswordResetSMS(userPhone, resetCode);
  }

  // Send account created notification
  async sendAccountCreated(accountData: {
    userId: string;
    userEmail: string;
    userPhone: string;
    userName: string;
    activationLink?: string;
  }) {
    const { userId, userEmail, userPhone, userName, activationLink } = accountData;

    const emailMessage = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .container {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 10px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                  margin: -30px -30px 20px -30px;
              }
              .welcome-section {
                  background: white;
                  padding: 20px;
                  border-radius: 5px;
                  margin: 20px 0;
              }
              .features {
                  background: #e8f5e8;
                  padding: 20px;
                  border-radius: 5px;
                  margin: 20px 0;
              }
              .button {
                  display: inline-block;
                  background: #007bff;
                  color: white;
                  padding: 12px 25px;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 10px 0;
              }
              .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                  color: #666;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Welcome to Digital Store!</h1>
              </div>
              
              <div class="welcome-section">
                  <p>Dear ${userName},</p>
                  <p>Welcome to our digital marketplace! We're thrilled to have you join our community of digital product enthusiasts.</p>
                  
                  ${activationLink ? `
                  <div style="text-align: center; margin: 20px 0;">
                      <a href="${activationLink}" class="button">Activate Your Account</a>
                  </div>
                  ` : ''}
              </div>
              
              <div class="features">
                  <h3>🚀 What You Can Do:</h3>
                  <ul>
                      <li>📚 Browse thousands of digital products</li>
                      <li>💎 Subscribe to premium plans for exclusive content</li>
                      <li>⚡ Enjoy instant downloads after purchase</li>
                      <li>📊 Track your orders and downloads</li>
                      <li>🎯 Get personalized product recommendations</li>
                      <li>🔔 Receive notifications about new releases</li>
                  </ul>
              </div>
              
              <p><strong>🛡️ Your Account Security:</strong></p>
              <ul>
                  <li>Your password is securely encrypted</li>
                  <li>We'll never share your personal information</li>
                  <li>You can update your preferences anytime</li>
              </ul>
              
              <p>Ready to start exploring? Browse our collection and discover amazing digital products!</p>
              
              <div class="footer">
                  <p>Happy shopping! 🛒</p>
                  <p>Best regards,<br>Digital Store Team</p>
                  <p>Need help? Reply to this email or contact support.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    await this.sendNotification({
      userId,
      type: 'ACCOUNT_CREATED',
      subject: 'Welcome to Digital Store - Your Account is Ready!',
      message: emailMessage,
      userEmail,
      userPhone,
      metadata: { userName, activationLink }
    });

    await sendAccountCreatedSMS(userPhone, userName);
  }

  // Get user notifications with pagination
  async getUserNotifications(userId: string, query: Record<string, unknown>) {
    const notificationQuery = new QueryBuilder(
      Notification.find({ user: userId }).sort({ createdAt: -1 }),
      query
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const notifications = await notificationQuery.modelQuery;
    const meta = await notificationQuery.countTotal();

    return {
      data: notifications,
      meta
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { 
        status: NOTIFICATION_STATUS.READ,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
    }

    return notification;
  }

  // Mark all user notifications as read
  async markAllAsRead(userId: string) {
    await Notification.updateMany(
      { 
        user: userId, 
        status: { $nin: [NOTIFICATION_STATUS.READ] } 
      },
      { 
        status: NOTIFICATION_STATUS.READ,
        readAt: new Date()
      }
    );

    return { message: 'All notifications marked as read' };
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
    }

    return notification;
  }

  // Get notification statistics
  async getNotificationStats(userId: string) {
    const stats = await Notification.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Notification.countDocuments({ user: userId });
    const unread = await Notification.countDocuments({ 
      user: userId, 
      status: { $nin: [NOTIFICATION_STATUS.READ] } 
    });

    return {
      total,
      unread,
      read: total - unread,
      breakdown: stats
    };
  }

  // Test SMS service
  async testSMSService() {
    return await smsService.testConnection();
  }

  // Send bulk notifications
  async sendBulkNotification(notificationData: {
    userIds: string[];
    type: keyof typeof NOTIFICATION_TYPE;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    const { userIds, type, subject, message, metadata = {} } = notificationData;

    const notifications = userIds.map(userId => ({
      user: userId,
      type: NOTIFICATION_TYPE[type],
      channel: NOTIFICATION_CHANNEL.EMAIL,
      recipient: {},
      subject: subject || 'Notification',
      message,
      htmlContent: message,
      metadata,
      status: NOTIFICATION_STATUS.SENT,
      sentAt: new Date()
    }));

    const result = await Notification.insertMany(notifications);
    return result;
  }
}

export const notificationService = new NotificationService();
export default notificationService;