import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";
import {
  PAYMENT_MESSAGES,
  PAYMENT_GATEWAY,
  PAYMENT_STATUS,
} from "./payment.constant";
import {
  createPayment,
  verifyPayment as verifyGatewayPayment,
  PaymentGateway,
} from "./paymentGateway.service";
import { Payment } from "./payment.model";

// Create payment from cart (checkout)
const createPaymentFromCart = catchAsync(async (req, res) => {
  const userId = req.user!._id;
  console.log("userId:", userId);
  const result = await PaymentServices.createPaymentFromCart(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_INITIATED,
    data: result,
  });
});

// Create direct payment
const createDirectPayment = catchAsync(async (req, res) => {
  const result = await PaymentServices.createDirectPayment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: PAYMENT_MESSAGES.PAYMENT_INITIATED,
    data: result,
  });
});

// Verify payment (IPN endpoint)
const verifyPayment = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const result = await PaymentServices.verifyPayment(transactionId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: result.isValid,
    message: result.isValid
      ? PAYMENT_MESSAGES.PAYMENT_COMPLETED
      : PAYMENT_MESSAGES.PAYMENT_FAILED,
    data: result,
  });
});

// Handle payment success redirect
const handlePaymentSuccess = catchAsync(async (req, res) => {
  const { transactionId } = req.params;

  // Verify payment before showing success
  const verification = await PaymentServices.verifyPayment(
    transactionId,
    req.query
  );

  if (verification.isValid) {
    // Redirect to frontend success page
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/success?transactionId=${transactionId}`
    );
  } else {
    // Redirect to frontend failure page
    res.redirect(
      `${process.env.FRONTEND_URL}/payment/failed?transactionId=${transactionId}`
    );
  }
});

// Handle payment failure redirect
const handlePaymentFailure = catchAsync(async (req, res) => {
  const { transactionId } = req.params;

  // Mark payment as failed
  await PaymentServices.verifyPayment(transactionId, {
    ...req.query,
    status: "FAILED",
  });

  // Redirect to frontend failure page
  res.redirect(
    `${
      process.env.FRONTEND_URL
    }/payment/failed?transactionId=${transactionId}&reason=${
      req.query.error || "Payment failed"
    }`
  );
});

// Handle payment cancellation redirect
const handlePaymentCancellation = catchAsync(async (req, res) => {
  const { transactionId } = req.params;

  // Mark payment as cancelled
  await PaymentServices.verifyPayment(transactionId, {
    ...req.query,
    status: "CANCELLED",
  });

  // Redirect to frontend cancellation page
  res.redirect(
    `${process.env.FRONTEND_URL}/payment/cancelled?transactionId=${transactionId}`
  );
});

// Get payment status (for frontend polling)
const getPaymentStatus = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const result = await PaymentServices.getPaymentDetails(transactionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status retrieved successfully",
    data: {
      transactionId: result.transactionId,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      createdAt: result.createdAt,
      verifiedAt: result.verifiedAt,
    },
  });
});

// Get payment status by ObjectId (for frontend polling)
const getPaymentStatusById = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const result = await PaymentServices.getPaymentDetailsById(paymentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status retrieved successfully",
    data: {
      transactionId: result.transactionId,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      createdAt: result.createdAt,
      verifiedAt: result.verifiedAt,
    },
  });
});

// Get payment details
const getPaymentDetails = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const result = await PaymentServices.getPaymentDetails(transactionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment details retrieved successfully",
    data: result,
  });
});

// Get user payments
const getUserPayments = catchAsync(async (req, res) => {
  const userId = req.user!._id;
  const result = await PaymentServices.getUserPayments(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User payments retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

// Get all payments (admin)
const getAllPayments = catchAsync(async (req, res) => {
  const result = await PaymentServices.getAllPayments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payments retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

// Update payment status (admin only)
const updatePaymentStatus = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const { status, adminNotes } = req.body;

  const result = await PaymentServices.updatePaymentStatus(
    transactionId,
    status,
    adminNotes
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status updated successfully",
    data: result,
  });
});

// Process refund
const processRefund = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const { amount, reason } = req.body;

  const result = await PaymentServices.processRefund(
    transactionId,
    amount,
    reason
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: PAYMENT_MESSAGES.REFUND_PROCESSED,
    data: result,
  });
});

// Generate download link
const generateDownloadLink = catchAsync(async (req, res) => {
  const { transactionId } = req.params;
  const { productId, maxDownloads, expiryDays } = req.body;

  // Get payment details to verify ownership
  const payment = await PaymentServices.getPaymentDetails(transactionId);

  // Check if user owns this payment
  if (payment.user.toString() !== req.user!._id) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: "Access denied to this payment",
      data: null,
    });
  }

  // Check if payment includes this product
  const hasProduct = payment.items.some(
    (item) => item.type === "product" && item.product?.toString() === productId
  );

  if (!hasProduct) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Product not included in this payment",
      data: null,
    });
  }

  // Generate download link
  const downloadUrl = await PaymentServices.generateSecureDownloadUrl(
    productId
  );

  // Add download link to payment
  await (payment as any).addDownloadLink(
    productId,
    downloadUrl,
    maxDownloads || 10
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: PAYMENT_MESSAGES.DOWNLOAD_LINK_GENERATED,
    data: {
      downloadUrl,
      expiresAt: new Date(
        Date.now() + (expiryDays || 30) * 24 * 60 * 60 * 1000
      ),
      maxDownloads: maxDownloads || 10,
    },
  });
});

// Webhook handler for payment gateway notifications
const handleWebhook = catchAsync(async (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Transaction ID is required",
      data: null,
    });
  }

  // Verify webhook signature if required
  // This depends on your payment gateway's webhook security

  // Process webhook
  const result = await PaymentServices.verifyPayment(transactionId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: PAYMENT_MESSAGES.WEBHOOK_PROCESSED,
    data: { processed: true, isValid: result.isValid },
  });
});

// Payment health check
const healthCheck = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment service is healthy",
    data: {
      timestamp: new Date().toISOString(),
      service: "payment",
      status: "operational",
    },
  });
});

// Create payment with multiple gateways
const createMultiGatewayPayment = catchAsync(async (req, res) => {
  const { gateway, orderId, amount, currency, customerInfo, productInfo } =
    req.body;
  const userId = req.user!._id; // Get user ID from authenticated user

  // Check against the constants used in validation
  const validGateways = Object.values(PAYMENT_GATEWAY);
  if (!validGateways.includes(gateway)) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: `Invalid payment gateway. Supported gateways: ${validGateways.join(
        ", "
      )}`,
      data: null,
    });
  }

  // Validate required fields
  if (!customerInfo?.email) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Customer email is required",
      data: null,
    });
  }

  // Map gateway string to enum value for createPayment function
  const gatewayEnum =
    gateway === PAYMENT_GATEWAY.SSLCOMMERZ
      ? PaymentGateway.SSLCOMMERZ
      : PaymentGateway.MANUAL;

  // Map frontend data structure to backend expected format
  const paymentData = {
    gateway: gatewayEnum,
    amount,
    currency: currency || "BDT", // Default to BDT if not provided
    description: productInfo?.name || "Payment",
    orderId,
    customerEmail: customerInfo?.email,
    customerName: customerInfo?.name,
    successUrl: `${process.env.SSL_PAYMENT_IPN_URL}`, // Fixed IPN success endpoint
    cancelUrl: `${process.env.SSL_PAYMENT_IPN_URL}/fail`, // Fixed IPN fail endpoint
    metadata: {
      customerPhone: customerInfo?.phone,
      customerAddress: customerInfo?.address,
      customerCity: customerInfo?.city,
      customerState: customerInfo?.state,
      customerCountry: customerInfo?.country,
      customerZipCode: customerInfo?.zipCode,
      productCategory: productInfo?.category,
      productProfile: productInfo?.profile,
    },
  };

  // Create payment gateway session
  const result = await createPayment(paymentData);

  // Create payment record in database with the transaction ID from gateway
  // Note: orderId might be a subscription ID (not MongoDB ObjectId), so we don't set it if invalid
  const paymentRecord: any = {
    transactionId: result.transactionId,
    amount,
    currency: currency || "BDT",
    paymentGateway: gateway,
    user: userId,
    customerEmail: customerInfo.email,
    customerPhone: customerInfo?.phone || undefined,
    status: PAYMENT_STATUS.PENDING, // Use the constant value "pending"
    items: productInfo
      ? [
          {
            type: "product",
            price: amount,
            quantity: 1,
            originalPrice: amount,
          },
        ]
      : [],
    gatewayResponse: {
      sessionId: result.sessionId,
      gatewayPageURL: result.gatewayPageURL,
    },
  };

  // Only add billingAddress if we have city (required field)
  if (customerInfo?.city) {
    paymentRecord.billingAddress = {
      street: customerInfo?.address || "N/A",
      city: customerInfo.city,
      state: customerInfo?.state || "N/A",
      postalCode: customerInfo?.zipCode || "0000",
      country: customerInfo?.country || "Bangladesh",
    };
  }

  await Payment.create(paymentRecord);

  console.log(`✅ Payment record created in database: ${result.transactionId}`);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payment session created successfully",
    data: result,
  });
});

// Verify gateway payment
const verifyMultiGatewayPayment = catchAsync(async (req, res) => {
  const { gateway, sessionId, orderId } = req.body;

  const result = await verifyGatewayPayment(gateway, sessionId, orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: (result as { success: boolean }).success,
    message: (result as { success: boolean }).success
      ? "Payment verified successfully"
      : "Payment verification failed",
    data: result,
  });
});

// Process refund for multiple gateways
const processMultiGatewayRefund = catchAsync(async (req, res) => {
  const { gateway, paymentId, amount, currency = "USD" } = req.body;

  const result = await processRefund(gateway, paymentId, amount);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Refund processed successfully",
    data: result,
  });
});

// Manual payment controllers
const createManualPayment = catchAsync(async (req, res) => {
  const userId = req.user!._id;

  // Add file path if uploaded
  const paymentData = {
    ...req.body,
    paymentProof: req.file ? req.file.path : undefined,
  };

  const result = await PaymentServices.createManualPayment(userId, paymentData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Manual payment request submitted successfully",
    data: result,
  });
});

const verifyManualPayment = catchAsync(async (req, res) => {
  const adminId = req.user!._id;
  const result = await PaymentServices.verifyManualPayment(adminId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Manual payment ${req.body.action}d successfully`,
    data: result,
  });
});

const getPendingManualPayments = catchAsync(async (req, res) => {
  const result = await PaymentServices.getPendingManualPayments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pending manual payments retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

// ===== SSLCommerz IPN Controllers =====

// Handle SSLCommerz success IPN (validates payment and redirects to client)
const handleSSLCommerzIPN = catchAsync(async (req, res) => {
  const { tran_id, val_id, status } = req.body;
  const transactionId = tran_id; // SSLCommerz sends tran_id in the body

  console.log("========== SSLCommerz IPN received ==========");
  console.log("Full request body:", JSON.stringify(req.body, null, 2));
  console.log("Transaction ID:", transactionId);
  console.log("Validation ID:", val_id);
  console.log("Status:", status);

  if (!transactionId) {
    console.error("Missing tran_id in IPN request");
    return res.redirect(
      `${process.env.SSL_PAYMENT_FAIL_URL}?error=Missing transaction ID`
    );
  }

  if (!val_id) {
    console.error("Missing val_id in IPN request");
    return res.redirect(
      `${process.env.SSL_PAYMENT_FAIL_URL}?tran_id=${transactionId}&error=Missing validation ID`
    );
  }

  try {
    // Verify payment with SSLCommerz
    console.log("Starting payment verification...");
    const verification = await PaymentServices.verifyPayment(transactionId, {
      val_id,
      status: status || "VALID",
    });

    console.log("Verification result:", JSON.stringify(verification, null, 2));

    if (verification.isValid) {
      console.log(
        "✅ Payment verified successfully, redirecting to success page"
      );
      // Redirect to client success page with transaction ID as query parameter
      return res.redirect(
        `${process.env.SSL_PAYMENT_SUCCESS_URL}?tran_id=${transactionId}`
      );
    } else {
      console.log("❌ Payment verification failed, redirecting to fail page");
      console.log("Verification errors:", verification.verificationErrors);
      // Redirect to client fail page with transaction ID as query parameter
      return res.redirect(
        `${process.env.SSL_PAYMENT_FAIL_URL}?tran_id=${transactionId}&error=Verification failed`
      );
    }
  } catch (error) {
    console.error("❌ IPN processing error:");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return res.redirect(
      `${process.env.SSL_PAYMENT_FAIL_URL}?tran_id=${transactionId}&error=Processing error`
    );
  }
});

// Handle SSLCommerz failure IPN (redirects to client fail page)
const handleSSLCommerzFailIPN = catchAsync(async (req, res) => {
  const { tran_id, status } = req.body;
  const transactionId = tran_id; // SSLCommerz sends tran_id in the body

  console.log("SSLCommerz fail IPN received:", { transactionId, status });

  // Mark payment as failed
  try {
    await PaymentServices.verifyPayment(transactionId, {
      status: "FAILED",
      error: "Payment failed or cancelled",
    });
  } catch (error) {
    console.error("Error marking payment as failed:", error);
  }

  // Redirect to client fail page
  return res.redirect(
    `${process.env.SSL_PAYMENT_FAIL_URL}?tran_id=${transactionId}&error=Payment failed`
  );
});

export const PaymentControllers = {
  createPaymentFromCart,
  createDirectPayment,
  verifyPayment,
  handlePaymentSuccess,
  handlePaymentFailure,
  handlePaymentCancellation,
  getPaymentStatus,
  getPaymentStatusById,
  getPaymentDetails,
  getUserPayments,
  getAllPayments,
  updatePaymentStatus,
  processRefund,
  generateDownloadLink,
  handleWebhook,
  healthCheck,
  // New multi-gateway controllers
  createMultiGatewayPayment,
  verifyMultiGatewayPayment,
  processMultiGatewayRefund,
  // SSLCommerz IPN controllers
  handleSSLCommerzIPN,
  handleSSLCommerzFailIPN,
  // Manual payment controllers
  createManualPayment,
  verifyManualPayment,
  getPendingManualPayments,
};
