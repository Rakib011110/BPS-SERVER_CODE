import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../../../config";
import { SecureDownload } from "./digitalDownload.model";
import {
  TSecureDownload,
  TDownloadRequest,
  TDownloadResponse,
} from "./digitalDownload.interface";
import { Product } from "../Product/product.model";
import { Order } from "../Order/order.model";
import { PAYMENT_STATUS } from "../Payment/payment.constant";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import { Types } from "mongoose";
import path from "path";
import fs from "fs";

class DigitalDownloadService {
  // Generate secure download token for a product
  async generateDownloadToken(
    userId: string,
    productId: string,
    orderId: string,
    expirationHours: number = 72,
    maxDownloads: number = 5
  ): Promise<string> {
    // Verify the order and product ownership
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      "items.product": productId,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
    }).populate("items.product");

    if (!order) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Order not found or payment not completed"
      );
    }

    // Check if product is digital
    const orderItem = order.items.find(
      (item: any) => item.product && item.product._id.toString() === productId
    );

    if (
      !orderItem ||
      !orderItem.product ||
      !(orderItem.product as any).isDigital
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Product is not a digital product or not found in order"
      );
    }

    // Generate unique download token
    const downloadToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    // Create secure download record
    const secureDownload = new SecureDownload({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
      order: new Types.ObjectId(orderId),
      downloadToken,
      downloadCount: 0,
      maxDownloads,
      expiresAt,
      isActive: true,
      downloadHistory: [],
    });

    await secureDownload.save();
    return downloadToken;
  }

  // Process download request
  async processDownload(
    downloadRequest: TDownloadRequest
  ): Promise<TDownloadResponse> {
    const { token, ipAddress, userAgent } = downloadRequest;

    // Find download record
    const downloadRecord = await SecureDownload.findOne({
      downloadToken: token,
    }).populate(["user", "product", "order"]);

    if (!downloadRecord) {
      return {
        success: false,
        message: "Invalid download token",
      };
    }

    // Check if download is still valid
    if (!(downloadRecord as any).isValidForDownload()) {
      let message = "Download link has expired";

      if (!downloadRecord.isActive) {
        message = "Download link is no longer active";
      } else if (downloadRecord.downloadCount >= downloadRecord.maxDownloads) {
        message = "Maximum download limit reached";
      } else if (downloadRecord.expiresAt <= new Date()) {
        message = "Download link has expired";
      }

      return {
        success: false,
        message,
      };
    }

    // Get product file information
    const product = downloadRecord.product as any;
    if (!product.digitalFiles || product.digitalFiles.length === 0) {
      return {
        success: false,
        message: "No digital files available for this product",
      };
    }

    try {
      // Record the download attempt
      await (downloadRecord as any).recordDownload(ipAddress, userAgent, true);

      // Generate temporary signed URL for file access
      const fileUrl = await this.generateSignedFileUrl(
        product.digitalFiles[0].filePath,
        3600 // 1 hour expiration for the direct file access
      );

      return {
        success: true,
        downloadUrl: fileUrl,
        fileUrl,
        fileName: product.digitalFiles[0].originalName,
        fileSize: product.digitalFiles[0].fileSize,
        message: "Download ready",
        remainingDownloads:
          downloadRecord.maxDownloads - downloadRecord.downloadCount,
        expiresAt: downloadRecord.expiresAt,
      };
    } catch (error) {
      // Record failed download attempt
      await (downloadRecord as any).recordDownload(ipAddress, userAgent, false);

      return {
        success: false,
        message: "Failed to process download",
      };
    }
  }

  // Generate signed URL for temporary file access
  private async generateSignedFileUrl(
    filePath: string,
    expirationSeconds: number
  ): Promise<string> {
    const payload = {
      filePath,
      exp: Math.floor(Date.now() / 1000) + expirationSeconds,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = jwt.sign(payload, config.jwt_access_secret as string);
    return `/api/download/file/${token}`;
  }

  // Verify and serve file
  async serveSecureFile(
    fileToken: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const decoded = jwt.verify(
        fileToken,
        config.jwt_access_secret as string
      ) as any;

      if (!decoded.filePath || decoded.exp < Math.floor(Date.now() / 1000)) {
        return {
          success: false,
          error: "File access token expired",
        };
      }

      // Check if file exists
      const fullPath = path.join(process.cwd(), "uploads", decoded.filePath);
      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          error: "File not found",
        };
      }

      return {
        success: true,
        filePath: fullPath,
      };
    } catch (error) {
      return {
        success: false,
        error: "Invalid file access token",
      };
    }
  }

  // Get user's download history
  async getUserDownloads(userId: string): Promise<any[]> {
    // Get orders with completed payment status that have download links
    const orders = await Order.find({
      user: userId,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      downloadLinks: { $exists: true, $ne: [] },
    })
      .populate(
        "downloadLinks.product",
        "title slug price digitalFileUrl digitalFiles fileName originalName fileSize fileType mimeType"
      )
      .select("orderNumber downloadLinks createdAt")
      .sort({ createdAt: -1 });

    // Format the download links into the expected format
    const downloads = [];
    for (const order of orders) {
      for (const link of order.downloadLinks || []) {
        if (link.product) {
          const product = link.product as any;

          // Get file information from product
          let fileName = "Unknown File";
          let originalName = "Unknown File";
          let fileSize = 0;
          let fileType = "unknown";
          let mimeType = "application/octet-stream";

          // Try to get file info from digitalFiles array first
          if (product.digitalFiles && product.digitalFiles.length > 0) {
            const file = product.digitalFiles[0];
            fileName = file.fileName || product.title;
            originalName = file.originalName || product.title;
            fileSize = file.fileSize || 0;
            fileType = file.fileType || "unknown";
            mimeType = file.mimeType || "application/octet-stream";
          } else {
            // Fallback to product info
            fileName = product.fileName || product.title || "Unknown File";
            originalName =
              product.originalName || product.title || "Unknown File";
            fileSize = product.fileSize || 0;
            fileType = product.fileType || "unknown";
            mimeType = product.mimeType || "application/octet-stream";
          }

          downloads.push({
            _id: `${order._id}_${product._id}`, // Create unique ID
            fileName: fileName,
            originalName: originalName,
            fileSize: fileSize,
            fileType: fileType,
            mimeType: mimeType,
            downloadUrl: link.downloadUrl,
            isActive: new Date() < new Date(link.expiresAt), // Check if not expired
            downloadCount: link.downloadCount || 0,
            maxDownloads: link.maxDownloads || 5,
            expiresAt: link.expiresAt?.toISOString
              ? link.expiresAt.toISOString()
              : link.expiresAt,
            productId: product._id,
            product: {
              _id: product._id,
              name: product.title,
              type: "digital",
            },
            orderId: order._id,
            order: {
              _id: order._id,
              orderNumber: order.orderNumber,
            },
            userId: userId,
            createdAt: order.createdAt?.toISOString
              ? order.createdAt.toISOString()
              : order.createdAt,
            updatedAt: order.createdAt?.toISOString
              ? order.createdAt.toISOString()
              : order.createdAt,
          });
        }
      }
    }

    return downloads;
  }

  // Admin: Get all downloads with filters
  async getAllDownloads(
    filters: {
      userId?: string;
      productId?: string;
      isActive?: boolean;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    page: number = 1,
    limit: number = 10
  ) {
    const query: any = {};

    if (filters.userId) query.user = filters.userId;
    if (filters.productId) query.product = filters.productId;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    const skip = (page - 1) * limit;

    const [downloads, total] = await Promise.all([
      SecureDownload.find(query)
        .populate("user", "firstName lastName email")
        .populate("product", "title slug price")
        .populate("order", "orderNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SecureDownload.countDocuments(query),
    ]);

    return {
      downloads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Cleanup expired downloads
  async cleanupExpiredDownloads(): Promise<{ deletedCount: number }> {
    const result = await SecureDownload.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        {
          isActive: false,
          updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }, // 30 days old inactive
      ],
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  // Revoke download access
  async revokeDownloadAccess(downloadId: string): Promise<boolean> {
    const result = await SecureDownload.findByIdAndUpdate(
      downloadId,
      { isActive: false },
      { new: true }
    );

    return !!result;
  }

  // Generate new download token for existing record
  async regenerateDownloadToken(
    downloadId: string,
    expirationHours: number = 72
  ): Promise<string> {
    const downloadRecord = await SecureDownload.findById(downloadId);

    if (!downloadRecord) {
      throw new AppError(httpStatus.NOT_FOUND, "Download record not found");
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + expirationHours);

    downloadRecord.downloadToken = newToken;
    downloadRecord.expiresAt = newExpiresAt;
    downloadRecord.isActive = true;
    downloadRecord.downloadCount = 0; // Reset download count
    downloadRecord.downloadHistory = []; // Clear history

    await downloadRecord.save();
    return newToken;
  }
}

export const digitalDownloadService = new DigitalDownloadService();
