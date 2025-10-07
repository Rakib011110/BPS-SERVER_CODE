import { TPaymentResponse } from "./paymentGateway.interface";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import { initiateSSLCommerzPayment } from "../../../utils/sslcommerz.utils";

export enum PaymentGateway {
  SSLCOMMERZ = "SSLCOMMERZ",
  MANUAL = "MANUAL",
}

interface UnifiedPaymentData {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: { [key: string]: string };
}

export const createPayment = async (
  paymentData: UnifiedPaymentData
): Promise<TPaymentResponse> => {
  try {
    switch (paymentData.gateway) {
      case PaymentGateway.SSLCOMMERZ:
        // Use SSLCommerz integration
        const sslcommerzData = {
          amount: paymentData.amount,
          transactionId: `TXN-${Date.now()}`,
          successUrl: paymentData.successUrl,
          failUrl: paymentData.cancelUrl,
          cancelUrl: paymentData.cancelUrl,
          customer: {
            name: paymentData.customerName || "Customer",
            email: paymentData.customerEmail || "",
            phone: paymentData.metadata?.customerPhone || "",
            address:
              paymentData.metadata?.customerAddress || "Dhaka, Bangladesh",
          },
          productInfo: {
            name: paymentData.description,
            category:
              paymentData.metadata?.productCategory || "Digital Products",
            profile: paymentData.metadata?.productProfile || "digital-goods",
          },
        };

        const sslcommerzResponse = await initiateSSLCommerzPayment(
          sslcommerzData
        );

        return {
          success: true,
          gatewayPageURL: sslcommerzResponse.GatewayPageURL,
          sessionId: sslcommerzResponse.sessionkey,
          transactionId: sslcommerzResponse.transactionId,
          gateway: "sslcommerz",
        };

      case PaymentGateway.MANUAL:
        // Manual payments don't need gateway URLs
        return {
          success: true,
          paymentUrl: "",
          sessionId: "",
          transactionId: paymentData.orderId,
          gateway: "manual",
        };

      default:
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Unsupported payment gateway"
        );
    }
  } catch (error) {
    console.error("Payment creation error:", error);
    throw error;
  }
};

export const verifyPayment = async (
  gateway: PaymentGateway,
  sessionId: string,
  orderId?: string
) => {
  try {
    switch (gateway) {
      case PaymentGateway.SSLCOMMERZ:
        // SSLCommerz verification handled in main payment service
        throw new AppError(
          httpStatus.NOT_IMPLEMENTED,
          "SSLCommerz verification should use existing service"
        );

      case PaymentGateway.MANUAL:
        // Manual payments verified by admin
        throw new AppError(
          httpStatus.NOT_IMPLEMENTED,
          "Manual payments are verified by admin approval"
        );

      default:
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Unsupported payment gateway"
        );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
};

export const processRefund = async (
  gateway: PaymentGateway,
  paymentId: string,
  amount?: number,
  currency = "BDT"
) => {
  try {
    switch (gateway) {
      case PaymentGateway.SSLCOMMERZ:
        // SSLCommerz refund would need to be implemented
        throw new AppError(
          httpStatus.NOT_IMPLEMENTED,
          "SSLCommerz refund not implemented yet"
        );

      case PaymentGateway.MANUAL:
        // Manual payments don't support automatic refunds
        throw new AppError(
          httpStatus.NOT_IMPLEMENTED,
          "Manual payment refunds must be handled manually"
        );

      default:
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Unsupported payment gateway"
        );
    }
  } catch (error) {
    console.error("Refund processing error:", error);
    throw error;
  }
};
