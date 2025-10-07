import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { digitalDownloadService } from "./digitalDownload.service";
import AppError from "../../error/AppError";
import fs from "fs";
import path from "path";

// Generate download token for purchased product
const generateDownloadToken = catchAsync(
  async (req: Request, res: Response) => {
    const { productId, orderId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const token = await digitalDownloadService.generateDownloadToken(
      userId,
      productId,
      orderId,
      72, // 72 hours expiration
      5 // 5 downloads max
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Download token generated successfully",
      data: {
        downloadToken: token,
        downloadUrl: `/api/download/${token}`,
      },
    });
  }
);

// Process download request
const processDownload = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get("User-Agent");

  const result = await digitalDownloadService.processDownload({
    token,
    ipAddress,
    userAgent,
  });

  if (!result.success) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: result.message,
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: {
      downloadUrl: result.downloadUrl,
      fileName: result.fileName,
      fileSize: result.fileSize,
      remainingDownloads: result.remainingDownloads,
      expiresAt: result.expiresAt,
    },
  });
});

// Serve secure file
const serveSecureFile = catchAsync(async (req: Request, res: Response) => {
  const { fileToken } = req.params;

  const result = await digitalDownloadService.serveSecureFile(fileToken);

  if (!result.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      result.error || "Invalid file token"
    );
  }

  const filePath = result.filePath!;
  const fileName = path.basename(filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new AppError(httpStatus.NOT_FOUND, "File not found");
  }

  // Get file stats
  const stats = fs.statSync(filePath);

  // Set appropriate headers
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Length", stats.size);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on("error", (error) => {
    console.error("File streaming error:", error);
    if (!res.headersSent) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error streaming file",
      });
    }
  });
});

// Get user's download history
const getUserDownloads = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const downloads = await digitalDownloadService.getUserDownloads(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Download history retrieved successfully",
    data: downloads,
  });
});

// Admin: Get all downloads with filters
const getAllDownloads = catchAsync(async (req: Request, res: Response) => {
  const {
    userId,
    productId,
    isActive,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
  } = req.query;

  const filters: any = {};
  if (userId) filters.userId = userId as string;
  if (productId) filters.productId = productId as string;
  if (isActive !== undefined) filters.isActive = isActive === "true";
  if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
  if (dateTo) filters.dateTo = new Date(dateTo as string);

  const result = await digitalDownloadService.getAllDownloads(
    filters,
    Number(page),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Downloads retrieved successfully",
    meta: {
      page: result.page,
      totalPages: result.totalPages,
      total: result.total,
    },
    data: result.downloads,
  });
});

// Admin: Revoke download access
const revokeDownloadAccess = catchAsync(async (req: Request, res: Response) => {
  const { downloadId } = req.params;

  const success = await digitalDownloadService.revokeDownloadAccess(downloadId);

  if (!success) {
    throw new AppError(httpStatus.NOT_FOUND, "Download record not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Download access revoked successfully",
    data: null,
  });
});

// Admin: Regenerate download token
const regenerateDownloadToken = catchAsync(
  async (req: Request, res: Response) => {
    const { downloadId } = req.params;
    const { expirationHours = 72 } = req.body;

    const newToken = await digitalDownloadService.regenerateDownloadToken(
      downloadId,
      expirationHours
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Download token regenerated successfully",
      data: {
        downloadToken: newToken,
        downloadUrl: `/api/download/${newToken}`,
      },
    });
  }
);

// Admin: Cleanup expired downloads
const cleanupExpiredDownloads = catchAsync(
  async (req: Request, res: Response) => {
    const result = await digitalDownloadService.cleanupExpiredDownloads();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Expired downloads cleaned up successfully",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  }
);

export const DigitalDownloadController = {
  generateDownloadToken,
  processDownload,
  serveSecureFile,
  getUserDownloads,
  getAllDownloads,
  revokeDownloadAccess,
  regenerateDownloadToken,
  cleanupExpiredDownloads,
};
