import multer from "multer";
import path from "path";
import { Request } from "express";

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, "uploads/payment-proofs/");
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `payment-proof-${uniqueSuffix}${extension}`);
  },
});

// File filter for payment proofs (images only)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for payment proof!"));
  }
};

// Multer configuration for payment proof upload
export const uploadPaymentProof = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware to handle single payment proof upload
export const uploadSinglePaymentProof =
  uploadPaymentProof.single("paymentProof");
