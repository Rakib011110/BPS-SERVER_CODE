import express, { Request, Response } from "express";
import {
  uploadSingleProductImage,
  uploadMultipleProductImages,
} from "../lib/multer/productImageUpload";
import {
  uploadSingleDigitalFile,
  uploadMultipleDigitalFiles,
} from "../lib/multer/digitalFileUpload";
import auth from "../app/middlewares/auth";
import { USER_ROLE } from "../app/modules/User/user.constant";

const router = express.Router();

// Upload single product image (for thumbnail)
router.post(
  "/product-image",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  uploadSingleProductImage,
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No image file provided",
        });
        return;
      }

      // Use backend URL instead of request host
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
      const imageUrl = `${BACKEND_URL}/uploads/images/products/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: imageUrl,
          filename: req.file.filename,
          path: `/uploads/images/products/${req.file.filename}`,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: error.message,
      });
    }
  }
);

// Upload multiple product images
router.post(
  "/product-images",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  uploadMultipleProductImages,
  (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        res.status(400).json({
          success: false,
          message: "No image files provided",
        });
        return;
      }

      // Use backend URL instead of request host
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
      const files = req.files as Express.Multer.File[];
      const uploadedImages = files.map((file) => ({
        url: `${BACKEND_URL}/uploads/images/products/${file.filename}`,
        filename: file.filename,
        path: `/uploads/images/products/${file.filename}`,
      }));

      res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        data: {
          images: uploadedImages,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to upload images",
        error: error.message,
      });
    }
  }
);

// Upload single digital file
router.post(
  "/digital-file",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  uploadSingleDigitalFile,
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file provided",
        });
        return;
      }

      // Use backend URL instead of request host
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
      const fileUrl = `${BACKEND_URL}/uploads/digital-files/${req.file.filename}`;

      res.status(200).json({
        success: true,
        message: "Digital file uploaded successfully",
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: `/uploads/digital-files/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to upload file",
        error: error.message,
      });
    }
  }
);

// Upload multiple digital files
router.post(
  "/digital-files",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  uploadMultipleDigitalFiles,
  (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        res.status(400).json({
          success: false,
          message: "No files provided",
        });
        return;
      }

      // Use backend URL instead of request host
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
      const files = req.files as Express.Multer.File[];
      const uploadedFiles = files.map((file) => ({
        url: `${BACKEND_URL}/uploads/digital-files/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/digital-files/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
      }));

      res.status(200).json({
        success: true,
        message: "Digital files uploaded successfully",
        data: {
          files: uploadedFiles,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to upload files",
        error: error.message,
      });
    }
  }
);

export const UploadRoutes = router;
