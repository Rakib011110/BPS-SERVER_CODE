import { Types } from "mongoose";

export interface TSecureDownload {
  _id?: string;
  user: Types.ObjectId;
  product: Types.ObjectId;
  order: Types.ObjectId;
  downloadToken: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date;
  isActive: boolean;
  downloadHistory: Array<{
    downloadedAt: Date;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TDownloadRequest {
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TDownloadResponse {
  success: boolean;
  downloadUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  message: string;
  remainingDownloads?: number;
  expiresAt?: Date;
}
