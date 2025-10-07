import { z } from "zod";
import {
  PAYMENT_GATEWAY,
  PAYMENT_TYPE,
  SUPPORTED_CURRENCIES,
  PAYMENT_LIMITS,
  INSTALLMENT_PLANS,
  MANUAL_PAYMENT_TYPES,
} from "./payment.constant";

// Payment item validation
const paymentItemValidationSchema = z
  .object({
    product: z.string().optional(),
    subscriptionPlan: z.string().optional(),
    type: z.enum([
      PAYMENT_TYPE.PRODUCT,
      PAYMENT_TYPE.SUBSCRIPTION,
      PAYMENT_TYPE.COURSE,
    ]),
    quantity: z.number().min(1).max(PAYMENT_LIMITS.MAX_ITEMS_PER_PAYMENT),
    price: z.number().min(0),
    originalPrice: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      // Ensure proper reference based on type
      if (data.type === PAYMENT_TYPE.PRODUCT) {
        return data.product && !data.subscriptionPlan;
      } else if (data.type === PAYMENT_TYPE.SUBSCRIPTION) {
        return data.subscriptionPlan && !data.product;
      }
      return true; // For course type, neither is required
    },
    {
      message:
        "Product ID is required for product type, subscription plan ID is required for subscription type",
    }
  );

// Billing address validation
const billingAddressValidationSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100).default("Bangladesh"),
});

// Create payment validation
const createPaymentValidationSchema = z.object({
  body: z.object({
    user: z.string().min(1, "User ID is required"),
    order: z.string().optional(),
    course: z.string().optional(), // Legacy support
    items: z
      .array(paymentItemValidationSchema)
      .min(1, "At least one item is required")
      .max(
        PAYMENT_LIMITS.MAX_ITEMS_PER_PAYMENT,
        `Maximum ${PAYMENT_LIMITS.MAX_ITEMS_PER_PAYMENT} items allowed`
      ),
    amount: z
      .number()
      .min(
        PAYMENT_LIMITS.MIN_AMOUNT,
        `Minimum amount is ${PAYMENT_LIMITS.MIN_AMOUNT}`
      )
      .max(
        PAYMENT_LIMITS.MAX_AMOUNT,
        `Maximum amount is ${PAYMENT_LIMITS.MAX_AMOUNT}`
      ),
    originalAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).default(0),
    customerEmail: z.string().email("Invalid email format").max(100),
    customerPhone: z.string().max(20).optional(),
    couponCode: z.string().max(50).optional(),
    couponDiscount: z.number().min(0).default(0),
    isSubscription: z.boolean().default(false),
    subscriptionId: z.string().optional(),
    isInstallment: z.boolean().default(false),
    installmentPlan: z
      .enum([
        INSTALLMENT_PLANS.MONTHLY_3,
        INSTALLMENT_PLANS.MONTHLY_6,
        INSTALLMENT_PLANS.MONTHLY_12,
        INSTALLMENT_PLANS.WEEKLY_4,
      ])
      .optional(),
    totalInstallments: z.number().min(2).max(12).optional(),
    paymentGateway: z
      .enum([PAYMENT_GATEWAY.SSLCOMMERZ, PAYMENT_GATEWAY.MANUAL])
      .default(PAYMENT_GATEWAY.SSLCOMMERZ),
    currency: z
      .enum([
        SUPPORTED_CURRENCIES.BDT,
        SUPPORTED_CURRENCIES.USD,
        SUPPORTED_CURRENCIES.EUR,
      ])
      .default(SUPPORTED_CURRENCIES.BDT),
    billingAddress: billingAddressValidationSchema.optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

// Cart to payment validation (for checkout)
const cartToPaymentValidationSchema = z.object({
  body: z
    .object({
      customerEmail: z.string().email("Invalid email format").max(100),
      customerPhone: z.string().max(20).optional(),
      couponCode: z.string().max(50).optional(),
      paymentGateway: z
        .enum([PAYMENT_GATEWAY.SSLCOMMERZ, PAYMENT_GATEWAY.MANUAL])
        .default(PAYMENT_GATEWAY.SSLCOMMERZ),
      currency: z
        .enum([
          SUPPORTED_CURRENCIES.BDT,
          SUPPORTED_CURRENCIES.USD,
          SUPPORTED_CURRENCIES.EUR,
        ])
        .default(SUPPORTED_CURRENCIES.BDT),
      isInstallment: z.boolean().default(false),
      installmentPlan: z
        .enum([
          INSTALLMENT_PLANS.MONTHLY_3,
          INSTALLMENT_PLANS.MONTHLY_6,
          INSTALLMENT_PLANS.MONTHLY_12,
          INSTALLMENT_PLANS.WEEKLY_4,
        ])
        .optional(),
      totalInstallments: z.number().min(2).max(12).optional(),
      billingAddress: billingAddressValidationSchema.optional(),
      metadata: z.record(z.any()).optional(),
    })
    .refine(
      (data) => {
        // If installment is enabled, plan and total installments are required
        if (data.isInstallment) {
          return data.installmentPlan && data.totalInstallments;
        }
        return true;
      },
      {
        message:
          "Installment plan and total installments are required when installment is enabled",
      }
    ),
});

// Payment verification validation
const verifyPaymentValidationSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, "Transaction ID is required"),
  }),
});

// Refund payment validation
const refundPaymentValidationSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, "Transaction ID is required"),
  }),
  body: z.object({
    amount: z.number().min(0.01, "Refund amount must be greater than 0"),
    reason: z
      .string()
      .min(1)
      .max(1000, "Refund reason is required and must be under 1000 characters"),
  }),
});

// Update payment validation
const updatePaymentValidationSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, "Transaction ID is required"),
  }),
  body: z.object({
    customerEmail: z.string().email().max(100).optional(),
    customerPhone: z.string().max(20).optional(),
    billingAddress: billingAddressValidationSchema.optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

// Webhook validation
const webhookValidationSchema = z.object({
  body: z
    .object({
      transactionId: z.string().min(1),
      status: z.string().min(1),
      signature: z.string().optional(),
      // Allow any additional gateway-specific fields
    })
    .catchall(z.any()),
});

// Payment status query validation
const paymentStatusQueryValidationSchema = z.object({
  query: z.object({
    status: z
      .enum([
        "pending",
        "completed",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ])
      .optional(),
    gateway: z
      .enum([PAYMENT_GATEWAY.SSLCOMMERZ, PAYMENT_GATEWAY.MANUAL])
      .optional(),
    isSubscription: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    page: z
      .string()
      .transform((val) => parseInt(val))
      .pipe(z.number().min(1))
      .default("1"),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .pipe(z.number().min(1).max(100))
      .default("10"),
    sort: z
      .enum(["createdAt", "-createdAt", "amount", "-amount", "status"])
      .default("-createdAt"),
  }),
});

// Download link generation validation
const generateDownloadLinkValidationSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, "Transaction ID is required"),
  }),
  body: z.object({
    productId: z.string().min(1, "Product ID is required"),
    maxDownloads: z
      .number()
      .min(1)
      .max(PAYMENT_LIMITS.MAX_DOWNLOAD_ATTEMPTS)
      .default(PAYMENT_LIMITS.MAX_DOWNLOAD_ATTEMPTS),
    expiryDays: z.number().min(1).max(365).default(30),
  }),
});

// Manual payment validation
const createManualPaymentValidationSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
    manualTransactionId: z
      .string()
      .min(1, "Manual transaction ID is required")
      .max(100),
    paymentMethodType: z.enum([
      "bank_transfer",
      "bkash",
      "nagad",
      "rocket",
      "upay",
      "other",
    ]),
    amountPaid: z
      .union([z.string(), z.number()])
      .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
      .refine((val) => val > 0, "Amount paid must be greater than 0"),
    customerNotes: z.string().max(500).optional(),
  }),
});

// Manual payment verification validation (for admin)
const verifyManualPaymentValidationSchema = z.object({
  body: z
    .object({
      paymentId: z.string().min(1, "Payment ID is required"),
      action: z.enum(["approve", "reject"]),
      adminNotes: z.string().max(500).optional(),
      rejectionReason: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        // If action is reject, rejection reason is required
        if (data.action === "reject") {
          return data.rejectionReason && data.rejectionReason.trim().length > 0;
        }
        return true;
      },
      {
        message: "Rejection reason is required when rejecting a payment",
        path: ["rejectionReason"],
      }
    ),
});

// Customer info validation for SSLCommerz
const customerInfoValidationSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(100),
  email: z.string().email("Invalid email format").max(100),
  phone: z.string().max(20).optional(),
  address: z.string().min(1, "Address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  zipCode: z.string().max(20).optional(),
});

// Product info validation
const productInfoValidationSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  category: z.string().min(1, "Product category is required").max(100),
  profile: z.string().min(1, "Product profile is required").max(50),
});

// Multi-gateway payment validation
const multiGatewayPaymentValidationSchema = z.object({
  body: z.object({
    gateway: z.enum([PAYMENT_GATEWAY.SSLCOMMERZ, PAYMENT_GATEWAY.MANUAL]),
    orderId: z.string().min(1, "Order ID is required").max(100),
    amount: z.number().min(1, "Amount must be greater than 0"),
    currency: z
      .enum([SUPPORTED_CURRENCIES.BDT, SUPPORTED_CURRENCIES.USD])
      .default(SUPPORTED_CURRENCIES.BDT),
    customerInfo: customerInfoValidationSchema,
    productInfo: productInfoValidationSchema,
  }),
});

// Update payment status validation
const updatePaymentStatusValidationSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, "Transaction ID is required"),
  }),
  body: z.object({
    status: z.enum([
      "pending",
      "completed",
      "failed",
      "cancelled",
      "refunded",
      "partially_refunded",
      "pending_verification",
      "under_review",
      "rejected",
    ]),
    adminNotes: z.string().max(1000).optional(),
  }),
});

export const PaymentValidation = {
  createPaymentValidationSchema,
  cartToPaymentValidationSchema,
  verifyPaymentValidationSchema,
  refundPaymentValidationSchema,
  updatePaymentValidationSchema,
  webhookValidationSchema,
  paymentStatusQueryValidationSchema,
  generateDownloadLinkValidationSchema,
  createManualPaymentValidationSchema,
  verifyManualPaymentValidationSchema,
  multiGatewayPaymentValidationSchema,
  updatePaymentStatusValidationSchema,
};
