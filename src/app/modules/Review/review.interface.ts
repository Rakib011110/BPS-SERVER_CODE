import { Document, Types } from "mongoose";

export interface TReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  comment: string;
  isVerified: boolean; // True if user purchased the product
  isApproved: boolean; // For admin moderation
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TReviewFilter {
  product?: string;
  user?: string;
  rating?: number;
  isVerified?: boolean;
  isApproved?: boolean;
  search?: string;
}

export interface IReviewModel {
  // Add any static methods here if needed
}