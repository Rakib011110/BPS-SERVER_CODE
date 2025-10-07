import { z } from "zod";
import { CART_ITEM_TYPE, COUPON_TYPE } from "./cart.constant";

// Validation for adding items to cart
const createCartItemValidationSchema = z.object({
  body: z
    .object({
      product: z.string().optional(),
      subscriptionPlan: z.string().optional(),
      type: z.enum([CART_ITEM_TYPE.PRODUCT, CART_ITEM_TYPE.SUBSCRIPTION]),
      quantity: z.number().min(1).max(10).default(1),
      price: z.number().min(0),
      originalPrice: z.number().min(0).optional(),
      discountAmount: z.number().min(0).default(0),
    })
    .refine(
      (data) => {
        // Ensure proper reference based on type
        if (data.type === CART_ITEM_TYPE.PRODUCT) {
          return data.product && !data.subscriptionPlan;
        } else if (data.type === CART_ITEM_TYPE.SUBSCRIPTION) {
          return data.subscriptionPlan && !data.product;
        }
        return false;
      },
      {
        message:
          "Product ID is required for product type, subscription plan ID is required for subscription type",
        path: ["type"],
      }
    ),
});

// Validation for updating cart item quantity
const updateCartItemQuantityValidationSchema = z.object({
  params: z.object({
    itemId: z.string().min(1, "Item ID is required"),
  }),
  body: z.object({
    quantity: z.number().min(1).max(10, "Maximum 10 items allowed per product"),
    type: z.enum([CART_ITEM_TYPE.PRODUCT, CART_ITEM_TYPE.SUBSCRIPTION]),
  }),
});

// Validation for removing items from cart
const removeCartItemValidationSchema = z.object({
  params: z.object({
    itemId: z.string().min(1, "Item ID is required"),
  }),
  body: z.object({
    type: z.enum([CART_ITEM_TYPE.PRODUCT, CART_ITEM_TYPE.SUBSCRIPTION]),
  }),
});

// Validation for applying coupon
const applyCouponValidationSchema = z.object({
  body: z.object({
    couponCode: z
      .string()
      .min(1)
      .max(50)
      .transform((s) => s.toUpperCase()),
    discountAmount: z.number().min(0),
    couponType: z.enum([COUPON_TYPE.PERCENTAGE, COUPON_TYPE.FIXED]),
  }),
});

// Validation for bulk add to cart
const bulkAddToCartValidationSchema = z.object({
  body: z.object({
    items: z
      .array(
        z
          .object({
            product: z.string().optional(),
            subscriptionPlan: z.string().optional(),
            type: z.enum([CART_ITEM_TYPE.PRODUCT, CART_ITEM_TYPE.SUBSCRIPTION]),
            quantity: z.number().min(1).max(10).default(1),
            price: z.number().min(0),
            originalPrice: z.number().min(0).optional(),
            discountAmount: z.number().min(0).default(0),
          })
          .refine(
            (data) => {
              if (data.type === CART_ITEM_TYPE.PRODUCT) {
                return data.product && !data.subscriptionPlan;
              } else if (data.type === CART_ITEM_TYPE.SUBSCRIPTION) {
                return data.subscriptionPlan && !data.product;
              }
              return false;
            },
            {
              message:
                "Each item must have appropriate reference based on type",
            }
          )
      )
      .max(20, "Maximum 20 items can be added at once"),
  }),
});

export const CartValidation = {
  createCartItemValidationSchema,
  updateCartItemQuantityValidationSchema,
  removeCartItemValidationSchema,
  applyCouponValidationSchema,
  bulkAddToCartValidationSchema,
};
