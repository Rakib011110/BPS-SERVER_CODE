import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PaymentControllers } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { USER_ROLE } from "../User/user.constant";
import { uploadSinglePaymentProof } from "../../../lib/multer/paymentProofUpload";

const router = express.Router();

// ===== PAYMENT INITIATION ROUTES =====

// Create payment from cart (checkout)
router.post(
  "/checkout",
  // auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.cartToPaymentValidationSchema),
  PaymentControllers.createPaymentFromCart
);

// Create direct payment (without cart)
router.post(
  "/create",
  // auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.createPaymentValidationSchema),
  PaymentControllers.createDirectPayment
);

// ===== MULTI-GATEWAY PAYMENT ROUTES =====

// Create payment with SSLCommerz gateway
router.post(
  "/multi-gateway/create",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.multiGatewayPaymentValidationSchema),
  PaymentControllers.createMultiGatewayPayment
);

// Verify payment from multiple gateways
router.post(
  "/multi-gateway/verify",
  // auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  PaymentControllers.verifyMultiGatewayPayment
);

// Process refund for multiple gateways
router.post(
  "/multi-gateway/refund",
  auth(USER_ROLE.ADMIN),
  PaymentControllers.processMultiGatewayRefund
);

// ===== PAYMENT GATEWAY CALLBACK ROUTES =====

// Success redirect (user returns from payment gateway)
router.get("/success/:transactionId", PaymentControllers.handlePaymentSuccess);

// Failure redirect (user returns from payment gateway)
router.get("/failed/:transactionId", PaymentControllers.handlePaymentFailure);

// Cancellation redirect (user cancels payment)
router.get(
  "/cancelled/:transactionId",
  PaymentControllers.handlePaymentCancellation
);

// IPN/Webhook endpoint (payment gateway notification)
router.post(
  "/webhook",
  validateRequest(PaymentValidation.webhookValidationSchema),
  PaymentControllers.handleWebhook
);

// ===== SSLCommerz IPN Routes =====

// SSLCommerz success IPN (validates payment and redirects to client)
router.post("/ipn", PaymentControllers.handleSSLCommerzIPN);

// SSLCommerz failure IPN (redirects to client fail page)
router.post("/ipn/fail", PaymentControllers.handleSSLCommerzFailIPN);

// ===== PAYMENT VERIFICATION ROUTES =====

// Verify specific payment
router.post(
  "/verify/:transactionId",
  validateRequest(PaymentValidation.verifyPaymentValidationSchema),
  PaymentControllers.verifyPayment
);

// Get payment status (for frontend polling)
router.get(
  "/status/:transactionId",
  validateRequest(PaymentValidation.verifyPaymentValidationSchema),
  PaymentControllers.getPaymentStatus
);

// Get payment status by ObjectId (for frontend polling)
router.get("/status/id/:paymentId", PaymentControllers.getPaymentStatusById);

// ===== PAYMENT DATA ROUTES =====

// Get payment details
router.get(
  "/details/:transactionId",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.verifyPaymentValidationSchema),
  PaymentControllers.getPaymentDetails
);

// Get user's payments
router.get(
  "/my-payments",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.paymentStatusQueryValidationSchema),
  PaymentControllers.getUserPayments
);

// Get all payments (admin only)
router.get(
  "/",
  auth(USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.paymentStatusQueryValidationSchema),
  PaymentControllers.getAllPayments
);

// Update payment status (admin only)
router.put(
  "/status/:transactionId",
  auth(USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.updatePaymentStatusValidationSchema),
  PaymentControllers.updatePaymentStatus
);

// ===== REFUND ROUTES =====

// Process refund (admin only)
router.post(
  "/refund/:transactionId",
  auth(USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.refundPaymentValidationSchema),
  PaymentControllers.processRefund
);

// ===== DIGITAL DELIVERY ROUTES =====

// Generate download link for purchased products
router.post(
  "/download-link/:transactionId",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.generateDownloadLinkValidationSchema),
  PaymentControllers.generateDownloadLink
);

// ===== MANUAL PAYMENT ROUTES =====

// Create manual payment (user submits manual payment details)
router.post(
  "/manual/create",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  uploadSinglePaymentProof,
  validateRequest(PaymentValidation.createManualPaymentValidationSchema),
  PaymentControllers.createManualPayment
);

// Verify manual payment (admin approves/rejects)
router.post(
  "/manual/verify",
  auth(USER_ROLE.ADMIN),
  validateRequest(PaymentValidation.verifyManualPaymentValidationSchema),
  PaymentControllers.verifyManualPayment
);

// Get pending manual payments (admin view)
router.get(
  "/manual/pending",
  auth(USER_ROLE.ADMIN),
  PaymentControllers.getPendingManualPayments
);

// ===== UTILITY ROUTES =====

// Health check endpoint
router.get("/health", PaymentControllers.healthCheck);

export const PaymentRoutes = router;
