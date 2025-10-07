// Unified Payment Response
export interface TPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  gatewayPageURL?: string;
  sessionId?: string;
  transactionId?: string;
  gateway?: string;
  message?: string;
  error?: string;
}
