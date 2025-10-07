import { z } from "zod";

const generateTokenValidation = z.object({
  body: z.object({
    productId: z.string({
      required_error: "Product ID is required",
    }),
    orderId: z.string({
      required_error: "Order ID is required",
    }),
    expirationHours: z.number().min(1).max(168).optional(), // 1 hour to 7 days
    maxDownloads: z.number().min(1).max(50).optional(), // 1 to 50 downloads
  }),
});

const regenerateTokenValidation = z.object({
  body: z.object({
    expirationHours: z.number().min(1).max(168).optional(), // 1 hour to 7 days
  }),
});

export const DigitalDownloadValidation = {
  generateTokenValidation,
  regenerateTokenValidation,
};
