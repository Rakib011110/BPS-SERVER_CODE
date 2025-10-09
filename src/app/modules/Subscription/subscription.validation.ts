import { z } from "zod";
import {
  BILLING_CYCLE,
  ACCESS_LEVEL,
  DURATION_TYPE,
  SUBSCRIPTION_CATEGORIES,
} from "./subscription.constant";

const createSubscriptionPlanValidationSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: "Plan name is required",
      })
      .min(1, "Plan name cannot be empty")
      .max(100, "Plan name cannot exceed 100 characters"),

    description: z.string({
      required_error: "Description is required",
    }),
    features: z.array(z.string()).min(1, "At least one feature is required"),

    price: z
      .number({
        required_error: "Price is required",
      })
      .min(0, "Price cannot be negative"),

    originalPrice: z
      .number()
      .min(0, "Original price cannot be negative")
      .optional(),

    duration: z
      .number({
        required_error: "Duration is required",
      })
      .min(1, "Duration must be at least 1"),

    durationType: z
      .enum(Object.values(DURATION_TYPE) as [string, ...string[]])
      .optional()
      .default(DURATION_TYPE.MONTHS),

    trialPeriod: z
      .number()
      .min(0, "Trial period cannot be negative")
      .optional()
      .default(0),

    isActive: z.boolean().optional().default(true),

    isFeatured: z.boolean().optional().default(false),

    category: z.enum(
      Object.values(SUBSCRIPTION_CATEGORIES) as [string, ...string[]],
      {
        required_error: "Category is required",
      }
    ),

    maxUsers: z
      .number()
      .min(1, "Max users must be at least 1")
      .optional()
      .default(1),

    photoUrl: z.string().url("Invalid photo URL").optional(),

    accessLevel: z
      .enum(Object.values(ACCESS_LEVEL) as [string, ...string[]])
      .optional()
      .default(ACCESS_LEVEL.BASIC),

    includedProducts: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"))
      .optional()
      .default([]),

    billingCycle: z.enum(
      Object.values(BILLING_CYCLE) as [string, ...string[]],
      {
        required_error: "Billing cycle is required",
      }
    ),

    setupFee: z
      .number()
      .min(0, "Setup fee cannot be negative")
      .optional()
      .default(0),

    metaTitle: z
      .string()
      .max(100, "Meta title cannot exceed 100 characters")
      .optional(),

    metaDescription: z
      .string()
      .max(300, "Meta description cannot exceed 300 characters")
      .optional(),

    slug: z
      .string()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens"
      )
      .optional(),
  }),
});

const updateSubscriptionPlanValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Plan name cannot be empty")
      .max(100, "Plan name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()

      .optional(),

    features: z
      .array(z.string())
      .min(1, "At least one feature is required")
      .optional(),

    price: z.number().min(0, "Price cannot be negative").optional(),

    originalPrice: z
      .number()
      .min(0, "Original price cannot be negative")
      .optional(),

    duration: z.number().min(1, "Duration must be at least 1").optional(),

    durationType: z
      .enum(Object.values(DURATION_TYPE) as [string, ...string[]])
      .optional(),

    trialPeriod: z
      .number()
      .min(0, "Trial period cannot be negative")
      .optional(),

    isActive: z.boolean().optional(),

    isFeatured: z.boolean().optional(),

    category: z
      .enum(Object.values(SUBSCRIPTION_CATEGORIES) as [string, ...string[]])
      .optional(),

    maxUsers: z.number().min(1, "Max users must be at least 1").optional(),

    photoUrl: z.string().url("Invalid photo URL").optional(),

    accessLevel: z
      .enum(Object.values(ACCESS_LEVEL) as [string, ...string[]])
      .optional(),

    includedProducts: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"))
      .optional(),

    billingCycle: z
      .enum(Object.values(BILLING_CYCLE) as [string, ...string[]])
      .optional(),

    setupFee: z.number().min(0, "Setup fee cannot be negative").optional(),

    metaTitle: z
      .string()
      .max(100, "Meta title cannot exceed 100 characters")
      .optional(),

    metaDescription: z
      .string()
      .max(300, "Meta description cannot exceed 300 characters")
      .optional(),

    slug: z
      .string()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens"
      )
      .optional(),
  }),
});

const subscribeToplanValidationSchema = z.object({
  body: z.object({
    subscriptionPlan: z
      .string({
        required_error: "Subscription plan ID is required",
      })
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid subscription plan ID"),

    paymentMethod: z.string().optional(),

    autoRenew: z.boolean().optional().default(true),
  }),
});

export const SubscriptionValidations = {
  createSubscriptionPlanValidationSchema,
  updateSubscriptionPlanValidationSchema,
  subscribeToplanValidationSchema,
};
