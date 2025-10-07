import { Document, Model, Types } from "mongoose";

export interface TDigitalFile {
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface TProduct extends Document {
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  type: "physical" | "digital" | "one-time" | "subscription";
  category: string;
  tags: string[];
  digitalFileUrl?: string;
  digitalFiles?: TDigitalFile[];
  isDigital?: boolean;
  previewImages?: string[];
  thumbnailImage: string;
  demoUrl?: string;
  stock: number;
  lowStockThreshold: number;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  downloadCount: number;
  rating: number;
  totalReviews: number;

  // Licensing & Access
  licenseType: "single" | "multiple" | "unlimited";
  accessDuration?: number; // in days, null for lifetime
  downloadLimit?: number; // max downloads allowed

  // Digital Product Specific
  fileSize?: string;
  fileFormat?: string[];
  compatibilityInfo?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;

  // Vendor info
  vendor: Types.ObjectId;

  // Sales tracking
  totalSales: number;
  revenue: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductModel extends Model<TProduct> {
  isProductExists(id: string): Promise<TProduct | null>;
}

export interface TProductFilter {
  searchTerm?: string;
  category?: string;
  type?: "physical" | "digital" | "one-time" | "subscription";
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  vendor?: string;
}
