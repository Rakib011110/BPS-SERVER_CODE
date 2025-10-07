import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SMSService } from './sms.service';
import { createMembershipInterviewSMS } from './sms.templates';

// Test SMS endpoint
const sendTestSMS = catchAsync(async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Phone number and message are required',
      data: null,
    });
  }
  
  const result = await SMSService.sendSMS(phoneNumber, message);
  
  sendResponse(res, {
    statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
    success: result.success,
    message: result.message || 'SMS operation completed',
    data: result,
  });
});

// Check SMS balance
const checkBalance = catchAsync(async (req, res) => {
  const result = await SMSService.checkBalance();
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'SMS balance retrieved successfully',
    data: result,
  });
});

// Send membership interview SMS (for testing)
const sendMembershipInterviewSMS = catchAsync(async (req, res) => {
  const { 
    phoneNumber, 
    userName, 
    membershipType, 
    applicationStatus, 
    interviewDate, 
    interviewTime, 
    adminNotes 
  } = req.body;
  
  if (!phoneNumber || !userName || !membershipType || !applicationStatus) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Required fields: phoneNumber, userName, membershipType, applicationStatus',
      data: null,
    });
  }
  
  // Create SMS message
  const smsMessage = createMembershipInterviewSMS(
    userName,
    membershipType,
    applicationStatus,
    interviewDate,
    interviewTime,
    adminNotes
  );
  
  console.log('📱 Generated SMS:', smsMessage);
  
  // Send SMS
  const result = await SMSService.sendSMS(phoneNumber, smsMessage);
  
  sendResponse(res, {
    statusCode: result.success ? httpStatus.OK : httpStatus.BAD_REQUEST,
    success: result.success,
    message: result.message || 'SMS operation completed',
    data: {
      smsResult: result,
      generatedMessage: smsMessage
    },
  });
});

export const SMSController = {
  sendTestSMS,
  checkBalance,
  sendMembershipInterviewSMS,
};
