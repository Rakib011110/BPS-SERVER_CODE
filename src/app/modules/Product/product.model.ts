import mongoose, { Schema, model } from "mongoose";
import { TProduct, IProductModel } from "./product.interface";
import {
  PRODUCT_TYPE,
  LICENSE_TYPE,
  PRODUCT_CATEGORIES,
} from "./product.constant";

const productSchema = new Schema<TProduct, IProductModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    type: {
      type: String,
      enum: Object.values(PRODUCT_TYPE),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(PRODUCT_CATEGORIES),
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    digitalFileUrl: {
      type: String,
      trim: true,
    },
    digitalFiles: [
      {
        originalName: {
          type: String,
          required: true,
        },
        filePath: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDigital: {
      type: Boolean,
      default: false,
    },
    previewImages: {
      type: [String],
      default: [],
    },
    thumbnailImage: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    sku: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      length: {
        type: Number,
        min: 0,
      },
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
    },
    demoUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Licensing & Access
    licenseType: {
      type: String,
      enum: Object.values(LICENSE_TYPE),
      default: LICENSE_TYPE.SINGLE,
    },
    accessDuration: {
      type: Number, // in days
      default: null,
    },
    downloadLimit: {
      type: Number,
      default: null,
    },

    // Digital Product Specific
    fileSize: {
      type: String,
      trim: true,
    },
    fileFormat: {
      type: [String],
      default: [],
    },
    compatibilityInfo: {
      type: String,
      trim: true,
    },

    // SEO
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Vendor info
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Sales tracking
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    revenue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// Static method to check if product exists
productSchema.statics.isProductExists = async function (id: string) {
  return await Product.findById(id);
};

// Pre-save middleware to auto-generate slug if not provided
productSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export const Product = model<TProduct, IProductModel>("Product", productSchema);
