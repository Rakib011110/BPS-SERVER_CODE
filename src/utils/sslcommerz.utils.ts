// utils/sslcommerz.utils.ts - PRODUCTION READY VERSION
import SSLCommerzPayment, { SslCommerzPayment } from "sslcommerz";
import {
  getSSLCommerzConfig,
  validateSSLCommerzEnvironment,
} from "../config/sslcommerz.config";

interface PaymentCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface PaymentInitiationData {
  amount: number;
  transactionId: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  customer: PaymentCustomer;
  productInfo?: {
    name?: string;
    category?: string;
    profile?: string;
  };
}

interface PaymentValidationResponse {
  isValid: boolean;
  transactionId?: string;
  amount?: number;
  status?: string;
  cardType?: string;
  cardIssuer?: string;
  bankTransactionId?: string;
  storeAmount?: number;
  verifiedAt?: string;
  error?: string;
  data?: any;
}

export const initiateSSLCommerzPayment = async (
  data: PaymentInitiationData
) => {
  try {
    // Get production configuration
    const config = getSSLCommerzConfig();

    console.log("🔧 Using SSLCommerz Config:", {
      storeId: config.storeId,
      isLive: config.isLive,
      successUrl: config.successUrl,
      ipnUrl: config.ipnUrl,
    });

    // Validate input parameters
    if (!data.amount || data.amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    // SSLCommerz minimum amount is 10 BDT
    if (data.amount < 10) {
      throw new Error("Minimum payment amount is 10 BDT");
    }

    if (!data.transactionId) {
      throw new Error("Transaction ID is required");
    }

    if (!data.customer.name || !data.customer.email) {
      throw new Error("Customer name and email are required");
    }

    // Prepare payment data with all required fields
    const paymentData = {
      // Basic payment information
      total_amount: data.amount,
      currency: "BDT",
      tran_id: data.transactionId,

      // URLs
      success_url: data.successUrl,
      fail_url: data.failUrl,
      cancel_url: data.cancelUrl,
      ipn_url: config.ipnUrl,

      // Customer information (ALL REQUIRED)
      cus_name: data.customer.name,
      cus_email: data.customer.email,
      cus_add1: data.customer.address || "Dhaka, Bangladesh",
      cus_add2: "N/A",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: data.customer.phone || "01700000000",
      cus_fax: "01700000000",

      // Shipping information (ALL REQUIRED)
      ship_name: data.customer.name,
      ship_add1: data.customer.address || "Dhaka, Bangladesh",
      ship_add2: "N/A",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: "1000",
      ship_country: "Bangladesh",
      ship_phone: data.customer.phone || "01700000000",

      // Product information
      product_name: data.productInfo?.name || "Course Purchase",
      product_category: data.productInfo?.category || "Education",
      product_profile: data.productInfo?.profile || "general",

      // Required fields
      shipping_method: "NO",
      num_of_item: 1,

      value_a: data.transactionId,
      value_b: "course_enrollment",
      value_c: data.customer.email,
      value_d: data.customer.phone,
    };

    console.log("🚀 Initializing SSLCommerz Payment with data:", {
      amount: paymentData.total_amount,
      transactionId: paymentData.tran_id,
      storeId: config.storeId,
      isLive: config.isLive,
      customerEmail: paymentData.cus_email,
    });

    // Initialize SSLCommerz payment
    const sslcz = new SslCommerzPayment(
      config.storeId,
      config.storePassword,
      config.isLive
    );
    const result = await sslcz.init(paymentData);

    console.log("📋 SSLCommerz Full Response:", {
      status: result.status,
      sessionkey: result.sessionkey,
      GatewayPageURL: result.GatewayPageURL,
      storeBanner: result.storeBanner,
      storeLogo: result.storeLogo,
      desc: result.desc,
      failedreason: result.failedreason,
      is_direct_pay_enable: result.is_direct_pay_enable,
    });

    // Validate response
    if (!result.GatewayPageURL) {
      console.error("❌ No Gateway URL received. Full response:", result);
      throw new Error(
        `Failed to initialize payment session - No gateway URL received. Status: ${
          result.status
        }, Message: ${result.desc || result.failedreason || "Unknown error"}`
      );
    }

    console.log("✅ Payment initialized successfully:", {
      transactionId: data.transactionId,
      gatewayUrl: result.GatewayPageURL,
      environment: config.isLive ? "LIVE" : "SANDBOX",
    });

    return {
      success: true,
      GatewayPageURL: result.GatewayPageURL,
      transactionId: data.transactionId,
      amount: data.amount,
      sessionkey: result.sessionkey,
      data: result,
    };
  } catch (error) {
    console.error("❌ SSLCommerz Payment Initialization Error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(
      `Payment initialization failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const validateSSLCommerzPayment = async (
  val_id: string,
  transactionId: string
): Promise<PaymentValidationResponse> => {
  try {
    const config = getSSLCommerzConfig();

    if (!val_id) {
      throw new Error("Validation ID is required");
    }

    const sslcz = new SslCommerzPayment(
      config.storeId,
      config.storePassword,
      config.isLive
    );

    console.log("� Validating payment:", {
      val_id,
      transactionId,
      storeId: config.storeId,
      isLive: config.isLive,
    });

    const validationResponse = await sslcz.validate({ val_id });

    console.log("� Validation response:", validationResponse);

    // Check if payment is valid
    if (validationResponse.status !== "VALID") {
      return {
        isValid: false,
        error: `Payment validation failed: ${validationResponse.status}`,
      };
    }

    // Additional validation - check transaction ID match
    if (validationResponse.tran_id !== transactionId) {
      return {
        isValid: false,
        error: `Transaction ID mismatch: expected ${transactionId}, got ${validationResponse.tran_id}`,
      };
    }

    return {
      isValid: true,
      transactionId: validationResponse.tran_id,
      amount: parseFloat(validationResponse.amount),
      status: validationResponse.status,
      cardType: validationResponse.card_type,
      cardIssuer: validationResponse.card_issuer,
      bankTransactionId: validationResponse.bank_tran_id,
      storeAmount: parseFloat(validationResponse.store_amount),
      verifiedAt: validationResponse.tran_date,
      data: validationResponse,
    };
  } catch (error) {
    console.error("❌ Payment validation error:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
};

// Additional utility functions
export const getPaymentStatus = async (transactionId: string) => {
  try {
    const config = getSSLCommerzConfig();
    const sslcz = new SslCommerzPayment(
      config.storeId,
      config.storePassword,
      config.isLive
    );

    const result = await sslcz.transactionQueryByTransactionId({
      tran_id: transactionId,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error querying payment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query failed",
    };
  }
};

export const refundPayment = async (
  transactionId: string,
  amount: number,
  reason: string
) => {
  try {
    const config = getSSLCommerzConfig();
    const sslcz = new SslCommerzPayment(
      config.storeId,
      config.storePassword,
      config.isLive
    );

    console.log("Refund requested:", { transactionId, amount, reason });

    return {
      success: true,
      message: "Refund request logged - manual processing required",
    };
  } catch (error) {
    console.error("❌ Error processing refund:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Refund failed",
    };
  }
};

// Export configuration for debugging
export const getPaymentConfig = () => {
  const config = getSSLCommerzConfig();
  return {
    storeId: config.storeId,
    isLive: config.isLive,
    environment: config.isLive ? "LIVE" : "SANDBOX",
    successUrl: config.successUrl,
    failUrl: config.failUrl,
    cancelUrl: config.cancelUrl,
    ipnUrl: config.ipnUrl,
  };
};

export default {
  initiateSSLCommerzPayment,
  validateSSLCommerzPayment,
  getPaymentStatus,
  refundPayment,
  getPaymentConfig,
};
