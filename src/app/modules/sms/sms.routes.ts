import express from 'express';
import { SMSController } from './sms.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
// import validateRequest from '../../middlewares/validateRequest';
// import { SMSValidation } from './sms.validation';

const router = express.Router();

// Test SMS endpoint (Admin only)
router.post(
  '/send-test',
  auth(USER_ROLE.ADMIN),
  // validateRequest(SMSValidation.sendTestSMSValidation),
  SMSController.sendTestSMS
);

// Check SMS balance (Admin only)
router.get(
  '/balance',
  auth(USER_ROLE.ADMIN),
  SMSController.checkBalance
);

// Send membership interview SMS (Admin only)
router.post(
  '/send-membership-interview',
  auth(USER_ROLE.ADMIN),
  // validateRequest(SMSValidation.sendMembershipInterviewSMSValidation),
  SMSController.sendMembershipInterviewSMS
);

export const SMSRoutes = router;
