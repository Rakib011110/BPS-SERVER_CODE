import httpStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import AppError from "../../error/AppError";
import { Payment } from "./payment.model";
import { Cart } from "../Cart/cart.model";
import { Order } from "../Order/order.model";
import { Product } from "../Product/product.model";
import { SubscriptionPlan } from "../Subscription/subscription.model";
import { UserSubscription } from "../Subscription/subscription.model";
import {
  TCreatePayment,
  TPayment,
  TPaymentSession,
  TPaymentVerification,
} from "./payment.interface";
import {
  PAYMENT_STATUS,
  PAYMENT_GATEWAY,
  PAYMENT_LIMITS,
  PAYMENT_ERROR_CODES,
  PAYMENT_MESSAGES,
  SUPPORTED_CURRENCIES,
} from "./payment.constant";
import {
  initiateSSLCommerzPayment,
  validateSSLCommerzPayment,
} from "../../../utils/sslcommerz.utils";
import QueryBuilder from "../../builder/QueryBuilder";

// Create payment from cart
const createPaymentFromCart = async (
  userId: string,
  paymentData: Partial<TCreatePayment>
): Promise<TPaymentSession> => {
  try {
    // Get user's cart
    const cart = await Cart.findOne({ user: userId })
      .populate("items.product", "title price discountPrice isActive stock")
      .populate("items.subscriptionPlan", "name price billingCycle isActive");

    if (!cart || cart.items.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, "Cart is empty");
    }

    // Validate cart items
    for (const item of cart.items) {
      if (item.type === "product") {
        const product = item.product as any;
        if (!product.isActive) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Product "${product.title}" is not available`
          );
        }
        if (product.stock !== undefined && product.stock < item.quantity) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Insufficient stock for "${product.title}"`
          );
        }
      } else if (item.type === "subscription") {
        const subscriptionPlan = item.subscriptionPlan as any;
        if (!subscriptionPlan.isActive) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Subscription plan "${subscriptionPlan.name}" is not available`
          );
        }
      }
    }

    // Create order from cart
    const orderData = {
      user: userId,
      items: cart.items.map((item) => ({
        product: item.product,
        subscriptionPlan: item.subscriptionPlan,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice || item.price,
      })),
      subtotal: cart.subtotal,
      totalAmount: Math.max(0, cart.subtotal - (cart.couponDiscount || 0)),
      appliedCoupon: cart.couponCode
        ? {
            code: cart.couponCode,
            discountAmount: cart.couponDiscount || 0,
            discountType: cart.couponType || "fixed",
          }
        : undefined,
      status: "pending_payment",
    };

    const order = await Order.create(orderData);

    // Create payment
    const transactionId = Payment.generateTransactionId();

    const payment = await (Payment as any).create({
      transactionId,
      user: userId,
      order: order._id,
      items: cart.items.map((item) => ({
        product: item.product,
        subscriptionPlan: item.subscriptionPlan,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice,
      })),
      amount: Math.max(0, cart.subtotal - (cart.couponDiscount || 0)),
      originalAmount: cart.subtotal,
      discountAmount: cart.couponDiscount || 0,
      customerEmail: paymentData.customerEmail!,
      customerPhone: paymentData.customerPhone,
      couponCode: cart.couponCode,
      couponDiscount: cart.couponDiscount || 0,
      isSubscription: cart.items.some((item) => item.type === "subscription"),
      paymentGateway: paymentData.paymentGateway || PAYMENT_GATEWAY.SSLCOMMERZ,
      currency: paymentData.currency || "BDT",
      billingAddress: paymentData.billingAddress,
      isInstallment: paymentData.isInstallment || false,
      installmentPlan: paymentData.installmentPlan,
      totalInstallments: paymentData.totalInstallments,
      metadata: paymentData.metadata,
    });

    // Initiate payment session based on gateway
    let session: TPaymentSession;

    if (payment.paymentGateway === PAYMENT_GATEWAY.SSLCOMMERZ) {
      session = await initiateSSLCommerzSession(payment);
    } else {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment gateway not supported yet"
      );
    }

    // Update payment with session details
    payment.sessionId = session.sessionId;
    payment.gatewayUrl = session.gatewayUrl;
    await payment.save();

    return session;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create payment from cart"
    );
  }
};

// Create direct payment (without cart)
const createDirectPayment = async (
  paymentData: TCreatePayment
): Promise<TPaymentSession> => {
  try {
    // Validate items
    for (const item of paymentData.items) {
      if (item.type === "product") {
        const product = await Product.findById(item.product);
        if (!product || !product.isActive) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Product ${item.product} is not available`
          );
        }
      } else if (item.type === "subscription") {
        const subscriptionPlan = await SubscriptionPlan.findById(
          item.subscriptionPlan
        );
        if (!subscriptionPlan || !subscriptionPlan.isActive) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Subscription plan ${item.subscriptionPlan} is not available`
          );
        }
      }
    }

    // Create order if not provided
    let orderId = paymentData.order;
    if (!orderId && paymentData.items.length > 0) {
      const order = await Order.create({
        user: paymentData.user,
        items: paymentData.items.map((item) => ({
          product: item.product,
          subscriptionPlan: item.subscriptionPlan,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice || item.price,
        })),
        subtotal: paymentData.originalAmount || paymentData.amount,
        totalAmount: paymentData.amount,
        appliedCoupon: paymentData.couponCode
          ? {
              code: paymentData.couponCode,
              discountAmount: paymentData.couponDiscount || 0,
              discountType: "fixed",
            }
          : undefined,
        status: "pending_payment",
      });
      orderId = (order._id as any).toString();
    }

    const transactionId = Payment.generateTransactionId();

    const payment = await (Payment as any).create({
      transactionId,
      ...paymentData,
      order: orderId,
    });

    // Initiate payment session
    let session: TPaymentSession;

    if (payment.paymentGateway === PAYMENT_GATEWAY.SSLCOMMERZ) {
      session = await initiateSSLCommerzSession(payment);
    } else {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment gateway not supported yet"
      );
    }

    // Update payment with session details
    payment.sessionId = session.sessionId;
    payment.gatewayUrl = session.gatewayUrl;
    await payment.save();

    return session;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create direct payment"
    );
  }
};

// Initiate SSLCommerz payment session
const initiateSSLCommerzSession = async (
  payment: TPayment
): Promise<TPaymentSession> => {
  try {
    const sslcommerzData = {
      amount: payment.amount,
      transactionId: payment.transactionId,
      successUrl: `${process.env.FRONTEND_URL}/payment/success`,
      failUrl: `${process.env.FRONTEND_URL}/payment/failed`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancelled`,
      customer: {
        name: "Customer", // Will be populated from user data
        email: payment.customerEmail,
        phone: payment.customerPhone || "",
        address: payment.billingAddress?.street || "Dhaka, Bangladesh",
      },
      productInfo: {
        name:
          payment.items.length === 1
            ? `Product Purchase`
            : `${payment.items.length} Items Purchase`,
        category: "Digital Products",
        profile: "digital-goods",
      },
    };

    const sslcommerzResponse = await initiateSSLCommerzPayment(sslcommerzData);

    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + PAYMENT_LIMITS.SESSION_EXPIRY_MINUTES
    );

    return {
      sessionId: sslcommerzResponse.sessionkey,
      gatewayUrl: sslcommerzResponse.GatewayPageURL,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      expiresAt,
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to initiate SSLCommerz session"
    );
  }
};

// Verify payment
const verifyPayment = async (
  transactionId: string,
  gatewayData?: Record<string, any>
): Promise<TPaymentVerification> => {
  try {
    const payment = await Payment.findByTransactionId(transactionId);

    if (!payment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND
      );
    }

    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      return {
        transactionId,
        isValid: true,
        gatewayResponse: gatewayData || {},
      };
    }

    let verificationResult: TPaymentVerification;

    if (payment.paymentGateway === PAYMENT_GATEWAY.SSLCOMMERZ) {
      verificationResult = await verifySSLCommerzPayment(
        transactionId,
        gatewayData
      );
    } else {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment gateway not supported"
      );
    }

    // Update payment based on verification result
    if (verificationResult.isValid) {
      await completePayment(payment, verificationResult.gatewayResponse);
    } else {
      await (payment as any).markAsFailed("Payment verification failed");
    }

    return verificationResult;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to verify payment"
    );
  }
};

// Verify SSLCommerz payment
const verifySSLCommerzPayment = async (
  transactionId: string,
  gatewayData?: Record<string, any>
): Promise<TPaymentVerification> => {
  try {
    const val_id = gatewayData?.val_id || gatewayData?.session_key || "";
    const validationResponse = await validateSSLCommerzPayment(
      val_id,
      transactionId
    );

    const isValid =
      validationResponse.status === "VALID" ||
      validationResponse.status === "VALIDATED";

    return {
      transactionId,
      isValid,
      gatewayResponse: { ...validationResponse, ...gatewayData },
      verificationErrors: isValid ? undefined : ["Payment validation failed"],
    };
  } catch (error) {
    return {
      transactionId,
      isValid: false,
      gatewayResponse: gatewayData || {},
      verificationErrors: ["Payment verification service error"],
    };
  }
};

// Complete payment (after successful verification)
const completePayment = async (
  payment: TPayment,
  gatewayResponse: Record<string, any>
): Promise<TPayment> => {
  try {
    // Mark payment as completed
    await (payment as any).markAsCompleted(gatewayResponse);

    // Update order status
    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        status: "processing",
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        paidAt: new Date(),
      });
    }

    // Handle subscription payments
    if (payment.isSubscription && payment.subscriptionId) {
      await UserSubscription.findByIdAndUpdate(payment.subscriptionId, {
        status: "active",
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        lastPaymentDate: new Date(),
      });
    }

    // Generate download links for products
    for (const item of payment.items) {
      if (item.type === "product" && item.product) {
        const downloadUrl = await generateSecureDownloadUrl(
          item.product.toString()
        );
        await (payment as any).addDownloadLink(
          item.product.toString(),
          downloadUrl
        );
      }
    }

    // Grant subscription access
    for (const item of payment.items) {
      if (item.type === "subscription" && item.subscriptionPlan) {
        const subscriptionPlan = await SubscriptionPlan.findById(
          item.subscriptionPlan
        );
        if (subscriptionPlan) {
          const startDate = new Date();
          const endDate = new Date();

          // Calculate end date based on billing cycle
          if (subscriptionPlan.billingCycle === "monthly") {
            endDate.setMonth(endDate.getMonth() + 1);
          } else if (subscriptionPlan.billingCycle === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else if (subscriptionPlan.billingCycle === "quarterly") {
            endDate.setMonth(endDate.getMonth() + 3);
          } else if (subscriptionPlan.billingCycle === "lifetime") {
            endDate.setFullYear(endDate.getFullYear() + 100); // Set to 100 years for lifetime
          }

          await (payment as any).grantSubscriptionAccess(
            item.subscriptionPlan.toString(),
            startDate,
            endDate
          );
        }
      }
    }

    // Clear user's cart after successful payment
    await Cart.findOneAndUpdate({ user: payment.user }, { items: [] });

    return payment;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to complete payment"
    );
  }
};

// Generate secure download URL (placeholder - implement with your file storage)
const generateSecureDownloadUrl = async (
  productId: string
): Promise<string> => {
  // This is a placeholder implementation
  // In production, you would generate a signed URL from your file storage service
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found");
  }

  // Generate a secure token
  const token = uuidv4();
  const expiryTimestamp = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return `/api/v1/downloads/${productId}/${token}?expires=${expiryTimestamp}`;
};

// Process refund
const processRefund = async (
  transactionId: string,
  amount: number,
  reason: string
): Promise<TPayment> => {
  try {
    const payment = await Payment.findByTransactionId(transactionId);

    if (!payment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND
      );
    }

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Only completed payments can be refunded"
      );
    }

    if (!payment.isRefundable) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        PAYMENT_ERROR_CODES.REFUND_NOT_ALLOWED
      );
    }

    const refundableAmount = payment.refundableAmount || 0;
    if (amount > refundableAmount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        PAYMENT_ERROR_CODES.INSUFFICIENT_REFUND_AMOUNT
      );
    }

    // Process refund (implement gateway-specific refund logic)
    await (payment as any).processRefund(amount, reason);

    // Update order status if fully refunded
    const totalRefunded = (payment.refundAmount || 0) + amount;
    if (totalRefunded >= payment.amount && payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        status: "refunded",
        refundedAt: new Date(),
      });
    }

    return payment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to process refund"
    );
  }
};

// Get payment details
const getPaymentDetails = async (transactionId: string): Promise<TPayment> => {
  try {
    const payment = await Payment.findByTransactionId(transactionId);

    if (!payment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND
      );
    }

    return payment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get payment details"
    );
  }
};

// Get payment details by ObjectId
const getPaymentDetailsById = async (paymentId: string): Promise<TPayment> => {
  try {
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        PAYMENT_ERROR_CODES.PAYMENT_NOT_FOUND
      );
    }

    return payment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get payment details"
    );
  }
};

// Get user payments
const getUserPayments = async (userId: string, query: Record<string, any>) => {
  try {
    const paymentQuery = new QueryBuilder(
      (Payment as any)
        .find({ user: userId })
        .populate("order")
        .populate("items.product", "title price thumbnail")
        .populate("items.subscriptionPlan", "name price billingCycle"),
      query
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await paymentQuery.modelQuery;
    const meta = await paymentQuery.countTotal();

    return { result, meta };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get user payments"
    );
  }
};

// Get all payments (admin)
const getAllPayments = async (query: Record<string, any>) => {
  try {
    const paymentQuery = new QueryBuilder(
      (Payment as any)
        .find()
        .populate("user", "name email phone")
        .populate("order")
        .populate("items.product", "title price thumbnail")
        .populate("items.subscriptionPlan", "name price billingCycle"),
      query
    )
      .search(["transactionId", "customerEmail", "bankTransactionId"])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await paymentQuery.modelQuery;
    const meta = await paymentQuery.countTotal();

    return { result, meta };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get all payments"
    );
  }
};

// Update payment status
const updatePaymentStatus = async (
  transactionId: string,
  status: string,
  adminNotes?: string
): Promise<TPayment> => {
  try {
    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    // Update payment status
    payment.status = status as any;
    payment.updatedAt = new Date();

    // Add admin notes if provided
    if (adminNotes) {
      payment.metadata = {
        ...payment.metadata,
        adminNotes,
        statusUpdatedBy: "admin",
        statusUpdatedAt: new Date().toISOString(),
      };
    }

    await payment.save();

    // ✅ SYNC: Update order's paymentStatus to match payment status
    if (payment.order) {
      const orderUpdateData: any = {
        paymentStatus: status,
      };

      // Also update order status based on payment status
      if (status === PAYMENT_STATUS.COMPLETED) {
        orderUpdateData.status = "processing"; // Move order forward
      } else if (status === "failed" || status === "rejected") {
        orderUpdateData.status = "cancelled"; // Cancel order on failed payment
      } else if (status === "refunded") {
        orderUpdateData.status = "refunded"; // Mark order as refunded
      }

      await Order.findByIdAndUpdate(payment.order, orderUpdateData);
    }

    // Populate user data for response
    await payment.populate("user", "name email phone");

    return payment;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update payment status"
    );
  }
};

// Create manual payment
const createManualPayment = async (
  userId: string,
  paymentData: any
): Promise<TPayment> => {
  try {
    // Validate the order exists and belongs to user
    const order = await Order.findOne({
      _id: paymentData.orderId,
      user: userId,
    });
    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Check if order already has a payment
    const existingPayment = await Payment.findOne({
      order: paymentData.orderId,
    });
    if (existingPayment) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Payment already exists for this order"
      );
    }

    const transactionId = Payment.generateTransactionId();

    const payment = await (Payment as any).create({
      transactionId,
      user: userId,
      order: paymentData.orderId,
      items: order.items,
      amount: paymentData.amountPaid,
      originalAmount: order.totalAmount,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      paymentGateway: PAYMENT_GATEWAY.MANUAL,
      currency: SUPPORTED_CURRENCIES.BDT,
      status: PAYMENT_STATUS.PENDING_VERIFICATION,
      manualPaymentDetails: {
        manualTransactionId: paymentData.manualTransactionId,
        paymentMethodType: paymentData.paymentMethodType,
        paymentProof: paymentData.paymentProof,
        verificationStatus: "pending_verification",
      },
    });

    // Update order status
    await Order.findByIdAndUpdate(paymentData.orderId, {
      paymentStatus: "pending_verification",
      status: "pending_payment",
    });

    return payment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create manual payment"
    );
  }
};

// Verify manual payment (admin function)
const verifyManualPayment = async (
  adminId: string,
  verificationData: any
): Promise<TPayment> => {
  try {
    const payment = await Payment.findById(verificationData.paymentId);

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.paymentGateway !== PAYMENT_GATEWAY.MANUAL) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This is not a manual payment"
      );
    }

    if (verificationData.action === "approve") {
      await (payment as any).approveManualPayment(
        adminId,
        verificationData.adminNotes
      );

      // Update order status
      if (payment.order) {
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: PAYMENT_STATUS.COMPLETED,
          status: "processing",
        });
      }
    } else {
      await (payment as any).rejectManualPayment(
        adminId,
        verificationData.rejectionReason
      );

      // Update order status
      if (payment.order) {
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: "failed",
          status: "cancelled",
        });
      }
    }

    return payment;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to verify manual payment"
    );
  }
};

// Get pending manual payments (admin function)
const getPendingManualPayments = async (
  query: Record<string, any>
): Promise<any> => {
  try {
    const paymentQuery = new QueryBuilder(
      (Payment as any)
        .find({
          paymentGateway: PAYMENT_GATEWAY.MANUAL,
          "manualPaymentDetails.verificationStatus": "pending_verification",
        })
        .populate("user", "name email phone")
        .populate("order")
        .populate("items.product", "title price thumbnail")
        .populate("manualPaymentDetails.verifiedBy", "name email"),
      query
    )
      .search([
        "transactionId",
        "customerEmail",
        "manualPaymentDetails.manualTransactionId",
      ])
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await paymentQuery.modelQuery;
    const meta = await paymentQuery.countTotal();

    return { result, meta };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get pending manual payments"
    );
  }
};

export const PaymentServices = {
  createPaymentFromCart,
  createDirectPayment,
  verifyPayment,
  processRefund,
  getPaymentDetails,
  getPaymentDetailsById,
  getUserPayments,
  getAllPayments,
  completePayment,
  generateSecureDownloadUrl,
  createManualPayment,
  verifyManualPayment,
  getPendingManualPayments,
  updatePaymentStatus,
};
