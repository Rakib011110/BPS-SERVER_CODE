import axios from 'axios';
import config from '../../../config';

// SMS Response interface
interface SMSResponse {
  success: boolean;
  code?: string;
  message?: string;
  data?: any;
}

// Format phone number to international format
const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 88, it's already in international format
  if (cleaned.startsWith('88')) {
    return cleaned;
  }
  
  // If it starts with 01, it's a Bangladeshi number without country code
  if (cleaned.startsWith('01')) {
    return '88' + cleaned;
  }
  
  // If it's 11 digits starting with 1, assume it's missing the leading 0
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '880' + cleaned;
  }
  
  // Default: assume it's a Bangladeshi number and add 880
  return '880' + cleaned;
};

// Send SMS using BulkSMSBD API
const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<SMSResponse> => {
  try {
    // Format phone number
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log(`📱 Sending SMS to: ${formattedNumber}`);
    
    // Prepare API URL
    const apiUrl = `${config.bulk_sms_base_url}/smsapi`;
    
    // API parameters (don't encode message here, axios will handle it)
    const params = {
      api_key: config.bulk_sms_api_key,
      type: 'text',
      number: formattedNumber,
      senderid: config.bulk_sms_sender_id,
      message: message // Use raw message, axios will handle URL encoding
    };
    
    console.log('📡 SMS API Request:', {
      url: apiUrl,
      params: { ...params, message: message } // Log unencoded message for readability
    });
    
    // Send GET request to BulkSMSBD API
    const response = await axios.get(apiUrl, { params });
    
    console.log('📱 SMS API Response:', response.data);
    
    // Parse response - BulkSMSBD returns different response formats
    const responseData = response.data;
    
    // Check for successful response codes (202 or object with response_code: 202)
    if (responseData === 202 || 
        responseData.toString().includes('202') ||
        (typeof responseData === 'object' && responseData.response_code === 202)) {
      return {
        success: true,
        code: '202',
        message: responseData.success_message || 'SMS Submitted Successfully',
        data: responseData
      };
    }
    
    // Handle error codes
    const errorCodes: { [key: string]: string } = {
      '1001': 'Invalid Number',
      '1002': 'Sender id not correct/sender id is disabled',
      '1003': 'Please Required all fields/Contact Your System Administrator',
      '1005': 'Internal Error',
      '1006': 'Balance Validity Not Available',
      '1007': 'Balance Insufficient',
      '1011': 'User Id not found',
      '1012': 'Masking SMS must be sent in Bengali',
      '1013': 'Sender Id has not found Gateway by api key',
      '1014': 'Sender Type Name not found using this sender by api key',
      '1015': 'Sender Id has not found Any Valid Gateway by api key',
      '1016': 'Sender Type Name Active Price Info not found by this sender id',
      '1017': 'Sender Type Name Price Info not found by this sender id',
      '1018': 'The Owner of this (username) Account is disabled',
      '1019': 'The (sender type name) Price of this (username) Account is disabled',
      '1020': 'The parent of this account is not found.',
      '1021': 'The parent active (sender type name) price of this account is not found.',
      '1031': 'Your Account Not Verified, Please Contact Administrator.',
      '1032': 'IP Not whitelisted'
    };
    
    const errorCode = responseData.toString();
    const errorMessage = errorCodes[errorCode] || 'Unknown error occurred';
    
    console.error(`❌ SMS Error ${errorCode}: ${errorMessage}`);
    
    return {
      success: false,
      code: errorCode,
      message: errorMessage,
      data: responseData
    };
    
  } catch (error: any) {
    console.error('❌ SMS Service Error:', error);
    
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: error.message || 'Failed to send SMS',
      data: error
    };
  }
};

// Send multiple SMS (if needed in future)
const sendBulkSMS = async (
  recipients: Array<{ phoneNumber: string; message: string }>
): Promise<SMSResponse[]> => {
  const results: SMSResponse[] = [];
  
  for (const recipient of recipients) {
    const result = await sendSMS(recipient.phoneNumber, recipient.message);
    results.push(result);
  }
  
  return results;
};

// Check SMS balance
const checkBalance = async (): Promise<any> => {
  try {
    const apiUrl = `${config.bulk_sms_base_url}/getBalanceApi`;
    const params = {
      api_key: config.bulk_sms_api_key
    };
    
    const response = await axios.get(apiUrl, { params });
    console.log('💰 SMS Balance:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Balance Check Error:', error);
    throw error;
  }
};

export const SMSService = {
  sendSMS,
  sendBulkSMS,
  checkBalance,
  formatPhoneNumber
};

export default SMSService;
