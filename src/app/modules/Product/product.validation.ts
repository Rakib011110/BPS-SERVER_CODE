import { z } from "zod";
import {
  PRODUCT_TYPE,
  LICENSE_TYPE,
  PRODUCT_CATEGORIES,
} from "./product.constant";

const createProductValidationSchema = z.object({
  body: z.object({
    title: z
      .string({
        required_error: "Title is required",
      })
      .min(1, "Title cannot be empty")
      .max(200, "Title cannot exceed 200 characters"),

    description: z.string({
      required_error: "Description is required",
    }),
    shortDescription: z
      .string({
        required_error: "Short description is required",
      })
      .min(5, "Short description must be at least 5 characters")
      .max(500, "Short description cannot exceed 500 characters"),

    price: z
      .number({
        required_error: "Price is required",
      })
      .min(0, "Price cannot be negative"),

    originalPrice: z
      .number()
      .min(0, "Original price cannot be negative")
      .optional(),

    type: z.enum(
      [
        PRODUCT_TYPE.PHYSICAL,
        PRODUCT_TYPE.DIGITAL,
        PRODUCT_TYPE.ONE_TIME,
        PRODUCT_TYPE.SUBSCRIPTION,
      ],
      {
        required_error: "Product type is required",
      }
    ),

    category: z.enum(
      Object.values(PRODUCT_CATEGORIES) as [string, ...string[]],
      {
        required_error: "Category is required",
      }
    ),

    tags: z.array(z.string()).optional().default([]),

    digitalFileUrl: z.string().url("Invalid file URL").optional(),

    previewImages: z
      .array(z.string().url("Invalid image URL"))
      .optional()
      .default([]),

    thumbnailImage: z
      .string({
        required_error: "Thumbnail image is required",
      })
      .url("Invalid thumbnail URL"),

    demoUrl: z.string().url("Invalid demo URL").optional(),

    isActive: z.boolean().optional().default(true),

    isFeatured: z.boolean().optional().default(false),

    licenseType: z
      .enum(Object.values(LICENSE_TYPE) as [string, ...string[]])
      .optional()
      .default(LICENSE_TYPE.SINGLE),

    accessDuration: z
      .number()
      .min(1, "Access duration must be at least 1 day")
      .optional(),

    downloadLimit: z
      .number()
      .min(1, "Download limit must be at least 1")
      .optional(),

    fileSize: z.string().optional(),

    fileFormat: z.array(z.string()).optional().default([]),

    compatibilityInfo: z.string().optional(),

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

const updateProductValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),

    description: z
      .string()

      .optional(),

    shortDescription: z
      .string()
      .min(5, "Short description must be at least 5 characters")
      .max(500, "Short description cannot exceed 500 characters")
      .optional(),

    price: z.number().min(0, "Price cannot be negative").optional(),

    originalPrice: z
      .number()
      .min(0, "Original price cannot be negative")
      .optional(),

    type: z
      .enum([
        PRODUCT_TYPE.PHYSICAL,
        PRODUCT_TYPE.DIGITAL,
        PRODUCT_TYPE.ONE_TIME,
        PRODUCT_TYPE.SUBSCRIPTION,
      ])
      .optional(),

    category: z
      .enum(Object.values(PRODUCT_CATEGORIES) as [string, ...string[]])
      .optional(),

    tags: z.array(z.string()).optional(),

    digitalFileUrl: z.string().url("Invalid file URL").optional(),

    previewImages: z.array(z.string().url("Invalid image URL")).optional(),

    thumbnailImage: z.string().url("Invalid thumbnail URL").optional(),

    demoUrl: z.string().url("Invalid demo URL").optional(),

    isActive: z.boolean().optional(),

    isFeatured: z.boolean().optional(),

    licenseType: z
      .enum(Object.values(LICENSE_TYPE) as [string, ...string[]])
      .optional(),

    accessDuration: z
      .number()
      .min(1, "Access duration must be at least 1 day")
      .optional(),

    downloadLimit: z
      .number()
      .min(1, "Download limit must be at least 1")
      .optional(),

    fileSize: z.string().optional(),

    fileFormat: z.array(z.string()).optional(),

    compatibilityInfo: z.string().optional(),

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

export const ProductValidations = {
  createProductValidationSchema,
  updateProductValidationSchema,
};
