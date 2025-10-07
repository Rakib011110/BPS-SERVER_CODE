import axios from 'axios';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

// BulkSMSBD Service Configuration
const BULK_SMS_API_KEY = process.env.BULK_SMS_API_KEY;
const BULK_SMS_SENDER_ID = process.env.BULK_SMS_SENDER_ID;
const BULK_SMS_BASE_URL = process.env.BULK_SMS_BASE_URL;

// SMS Service Interface
interface TSMSData {
  to: string;
  message: string;
  from?: string;
}

interface TSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  response?: any;
}

// BulkSMSBD API Service
class BulkSMSService {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string;

  constructor() {
    if (!BULK_SMS_API_KEY || !BULK_SMS_SENDER_ID || !BULK_SMS_BASE_URL) {
      throw new Error('BulkSMS configuration is missing. Please check environment variables.');
    }

    this.apiKey = BULK_SMS_API_KEY;
    this.senderId = BULK_SMS_SENDER_ID;
    this.baseUrl = BULK_SMS_BASE_URL;
  }

  // Send single SMS
  async sendSMS(smsData: TSMSData): Promise<TSMSResponse> {
    try {
      // Clean phone number (remove spaces, dashes, etc.)
      const phoneNumber = this.cleanPhoneNumber(smsData.to);
      
      // Validate phone number
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid phone number format');
      }

      // Prepare API request
      const requestData = {
        api_key: this.apiKey,
        senderid: smsData.from || this.senderId,
        number: phoneNumber,
        message: smsData.message,
      };

      console.log('Sending SMS:', { to: phoneNumber, message: smsData.message });

      // Make API request to BulkSMSBD
      const response = await axios.post(`${this.baseUrl}/smsapi`, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Parse response
      if (response.data) {
        // BulkSMSBD returns different response formats
        const responseText = response.data.toString();
        
        if (responseText.includes('SMS SUBMITTED')) {
          return {
            success: true,
            messageId: this.extractMessageId(responseText),
            response: responseText,
          };
        } else if (responseText.includes('FAILED') || responseText.includes('ERROR')) {
          return {
            success: false,
            error: responseText,
            response: responseText,
          };
        } else {
          // Check if response contains success indicators
          return {
            success: response.status === 200,
            messageId: Date.now().toString(),
            response: responseText,
          };
        }
      }

      return {
        success: false,
        error: 'No response from SMS provider',
      };
    } catch (error: any) {
      console.error('SMS sending error:', error);
      
      if (error.response) {
        return {
          success: false,
          error: `SMS API Error: ${error.response.status} - ${error.response.statusText}`,
          response: error.response.data,
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'No response from SMS provider',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown SMS sending error',
        };
      }
    }
  }

  // Send bulk SMS
  async sendBulkSMS(recipients: string[], message: string): Promise<TSMSResponse[]> {
    const results: TSMSResponse[] = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS({ to: recipient, message });
        results.push(result);
        
        // Add small delay between messages to avoid rate limiting
        await this.delay(500); // 500ms delay
      } catch (error) {
        results.push({
          success: false,
          error: `Failed to send to ${recipient}`,
        });
      }
    }
    
    return results;
  }

  // Clean phone number (remove non-digit characters except +)
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle Bangladesh numbers
    if (cleaned.startsWith('01')) {
      cleaned = '+88' + cleaned;
    } else if (cleaned.startsWith('8801')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      // Add + if not present for international numbers
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  // Validate phone number format
  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation for phone numbers
    const phoneRegex = /^\+[\d]{10,15}$/;
    return phoneRegex.test(phone);
  }

  // Extract message ID from response (if available)
  private extractMessageId(response: string): string {
    // Try to extract message ID from response
    const idMatch = response.match(/ID:?\s*(\w+)/i);
    return idMatch ? idMatch[1] : Date.now().toString();
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test SMS service connectivity
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to send a test SMS to a dummy number (won't actually send)
      const testData = {
        api_key: this.apiKey,
        senderid: this.senderId,
        number: '+8801700000000', // Dummy number for test
        message: 'Test connection - ignore this message',
      };

      const response = await axios.post(`${this.baseUrl}/smsapi`, testData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      });

      return {
        success: true,
        message: 'SMS service connection successful',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `SMS service connection failed: ${error.message}`,
      };
    }
  }
}

// Export SMS service instance
export const smsService = new BulkSMSService();

// Utility functions for SMS templates
export const SMSTemplates = {
  orderConfirmation: (orderId: string, amount: number) => 
    `Your order #${orderId} has been confirmed. Total: ৳${amount}. Thank you for your purchase!`,
    
  paymentSuccess: (orderId: string, amount: number) => 
    `Payment successful! ৳${amount} has been processed for order #${orderId}. Download links sent to your email.`,
    
  paymentFailed: (orderId: string) => 
    `Payment failed for order #${orderId}. Please try again or contact support.`,
    
  subscriptionActivated: (subscriptionName: string) => 
    `Your ${subscriptionName} subscription is now active. Enjoy your benefits!`,
    
  subscriptionExpired: (subscriptionName: string) => 
    `Your ${subscriptionName} subscription has expired. Renew now to continue enjoying benefits.`,
    
  downloadReady: (productName: string) => 
    `Your ${productName} download is ready. Check your email for the download link.`,
    
  passwordReset: (code: string) => 
    `Your password reset code: ${code}. Valid for 10 minutes. Do not share this code.`,
    
  accountCreated: (name: string) => 
    `Welcome ${name}! Your account has been created successfully. Start exploring our digital products.`,
    
  lowStock: (productName: string, stock: number) => 
    `Alert: ${productName} is running low on stock. Only ${stock} items remaining.`,
    
  orderShipped: (orderId: string, trackingCode?: string) => 
    trackingCode 
      ? `Order #${orderId} has been shipped. Track your order with code: ${trackingCode}`
      : `Order #${orderId} has been shipped. You'll receive delivery updates soon.`,
};

// SMS notification functions for different events
export const sendOrderConfirmationSMS = async (phone: string, orderId: string, amount: number) => {
  const message = SMSTemplates.orderConfirmation(orderId, amount);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendPaymentSuccessSMS = async (phone: string, orderId: string, amount: number) => {
  const message = SMSTemplates.paymentSuccess(orderId, amount);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendPaymentFailedSMS = async (phone: string, orderId: string) => {
  const message = SMSTemplates.paymentFailed(orderId);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendSubscriptionActivatedSMS = async (phone: string, subscriptionName: string) => {
  const message = SMSTemplates.subscriptionActivated(subscriptionName);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendSubscriptionExpiredSMS = async (phone: string, subscriptionName: string) => {
  const message = SMSTemplates.subscriptionExpired(subscriptionName);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendDownloadReadySMS = async (phone: string, productName: string) => {
  const message = SMSTemplates.downloadReady(productName);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendPasswordResetSMS = async (phone: string, code: string) => {
  const message = SMSTemplates.passwordReset(code);
  return await smsService.sendSMS({ to: phone, message });
};

export const sendAccountCreatedSMS = async (phone: string, name: string) => {
  const message = SMSTemplates.accountCreated(name);
  return await smsService.sendSMS({ to: phone, message });
};

export default smsService;