import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_ITEM_TYPE } from './order.constant';

const orderItemValidationSchema = z.object({
  product: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID')
    .optional(),
  
  subscriptionPlan: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid subscription plan ID')
    .optional(),
  
  type: z.enum([ORDER_ITEM_TYPE.PRODUCT, ORDER_ITEM_TYPE.SUBSCRIPTION], {
    required_error: 'Item type is required',
  }),
  
  quantity: z
    .number({
      required_error: 'Quantity is required',
    })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
});

const createOrderValidationSchema = z.object({
  body: z.object({
    items: z
      .array(orderItemValidationSchema)
      .min(1, 'At least one item is required'),
    
    customerEmail: z
      .string({
        required_error: 'Customer email is required',
      })
      .email('Invalid email format'),
    
    customerPhone: z
      .string()
      .optional(),
    
    billingAddress: z
      .object({
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        country: z.string().min(1, 'Country is required'),
        zipCode: z.string().min(1, 'ZIP code is required'),
      })
      .optional(),
    
    couponCode: z
      .string()
      .optional(),
    
    couponDiscount: z
      .number()
      .min(0, 'Coupon discount cannot be negative')
      .optional(),
    
    notes: z
      .string()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional(),
  }).refine(
    (data) => {
      // Ensure each item has the appropriate reference based on type
      return data.items.every(item => {
        if (item.type === ORDER_ITEM_TYPE.PRODUCT) {
          return item.product && !item.subscriptionPlan;
        } else if (item.type === ORDER_ITEM_TYPE.SUBSCRIPTION) {
          return item.subscriptionPlan && !item.product;
        }
        return false;
      });
    },
    {
      message: 'Each item must have the appropriate reference based on its type',
    }
  ),
});

const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(Object.values(ORDER_STATUS) as [string, ...string[]], {
      required_error: 'Order status is required',
    }),
    
    adminNotes: z
      .string()
      .max(1000, 'Admin notes cannot exceed 1000 characters')
      .optional(),
  }),
});

const updatePaymentStatusValidationSchema = z.object({
  body: z.object({
    transactionId: z
      .string({
        required_error: 'Transaction ID is required',
      })
      .min(1, 'Transaction ID cannot be empty'),
    
    paymentStatus: z.enum(Object.values(PAYMENT_STATUS) as [string, ...string[]], {
      required_error: 'Payment status is required',
    }),
    
    bankTransactionId: z
      .string()
      .optional(),
    
    cardType: z
      .string()
      .optional(),
    
    cardIssuer: z
      .string()
      .optional(),
    
    sessionId: z
      .string()
      .optional(),
  }),
});

const processRefundValidationSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: 'Refund amount is required',
      })
      .min(0.01, 'Refund amount must be greater than 0'),
    
    reason: z
      .string()
      .max(500, 'Refund reason cannot exceed 500 characters')
      .optional(),
    
    transactionId: z
      .string()
      .optional(),
  }),
});

export const OrderValidations = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  updatePaymentStatusValidationSchema,
  processRefundValidationSchema,
};