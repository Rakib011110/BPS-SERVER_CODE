import { z } from "zod";

const addReviewValidationSchema = z.object({
  body: z.object({
    productId: z.string({
      required_error: "Product ID is required",
    }),
    rating: z
      .number({
        required_error: "Rating is required",
      })
      .int()
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: z
      .string({
        required_error: "Comment is required",
      })
      .min(10, "Comment must be at least 10 characters")
      .max(2000, "Comment must not exceed 2000 characters"),
    orderId: z.string().optional(),
  }),
});

const updateReviewValidationSchema = z.object({
  body: z.object({
    rating: z
      .number()
      .int()
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5")
      .optional(),
    comment: z
      .string()
      .min(10, "Comment must be at least 10 characters")
      .max(2000, "Comment must not exceed 2000 characters")
      .optional(),
  }),
});

const reviewHelpfulnessValidationSchema = z.object({
  body: z.object({
    helpful: z.boolean({
      required_error: "Helpful status is required",
    }),
  }),
});

export const ReviewValidations = {
  addReviewValidationSchema,
  updateReviewValidationSchema,
  reviewHelpfulnessValidationSchema,
};