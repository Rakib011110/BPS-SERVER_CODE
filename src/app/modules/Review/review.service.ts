import httpStatus from "http-status";
import { TReview, TReviewFilter } from "./review.interface";
import { Review } from "./review.model";
import { Product } from "../Product/product.model";
import { Order } from "../Order/order.model";
import { ORDER_STATUS, PAYMENT_STATUS } from "../Order/order.constant";
import AppError from "../../error/AppError";
import QueryBuilder from "../../builder/QueryBuilder";

// Searchable fields for reviews
const ReviewSearchableFields = ["comment"];

const addReview = async (
  userId: string,
  payload: {
    productId: string;
    rating: number;
    comment: string;
    orderId?: string;
  }
): Promise<TReview> => {
  const { productId, rating, comment, orderId } = payload;

  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (existingReview) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You have already reviewed this product"
      );
    }

    // Verify purchase if orderId is provided
    let isVerified = false;
    let orderRef = null;

    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: userId,
        status: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED] },
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        "items.product": productId,
      });

      if (order) {
        isVerified = true;
        orderRef = orderId;
      }
    } else {
      // Check if user has any completed order with this product
      const completedOrder = await Order.findOne({
        user: userId,
        status: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED] },
        paymentStatus: PAYMENT_STATUS.COMPLETED,
        "items.product": productId,
      });

      if (completedOrder) {
        isVerified = true;
        orderRef = completedOrder._id;
      }
    }

    // Create review
    const reviewData = {
      user: userId,
      product: productId,
      order: orderRef,
      rating,
      comment,
      isVerified,
    };

    const review = await Review.create(reviewData);

    // Update product rating and review count
    await updateProductReviewStats(productId);

    // Populate user data before returning
    const populatedReview = await Review.findById(review._id)
      .populate("user", "name profilePhoto")
      .populate("product", "title");

    return populatedReview!;
  } catch (error) {
    throw error;
  }
};

const getProductReviews = async (
  productId: string,
  query: Record<string, unknown>
) => {
  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const reviewQuery = new QueryBuilder(
      Review.find({ product: productId, isApproved: true })
        .populate("user", "name profilePhoto")
        .sort({ createdAt: -1 }),
      query
    )
      .search(ReviewSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await reviewQuery.modelQuery;
    const meta = await reviewQuery.countTotal();

    // Calculate average rating for this specific query
    const allReviews = await Review.find({
      product: productId,
      isApproved: true,
    });
    
    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum: number, review: TReview) => sum + review.rating, 0) / allReviews.length
      : 0;

    return {
      result,
      meta: {
        ...meta,
        averageRating: Math.round(averageRating * 10) / 10,
      },
    };
  } catch (error) {
    throw error;
  }
};

const getUserReviews = async (
  userId: string,
  query: Record<string, unknown>
) => {
  try {
    const reviewQuery = new QueryBuilder(
      Review.find({ user: userId })
        .populate("product", "title thumbnailImage price")
        .sort({ createdAt: -1 }),
      query
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await reviewQuery.modelQuery;
    const meta = await reviewQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const updateReview = async (
  reviewId: string,
  userId: string,
  payload: { rating?: number; comment?: string }
): Promise<TReview> => {
  try {
    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Review not found or you don't have permission to edit it"
      );
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      payload,
      { new: true, runValidators: true }
    )
      .populate("user", "name profilePhoto")
      .populate("product", "title");

    // Update product rating if rating was changed
    if (payload.rating) {
      await updateProductReviewStats(review.product.toString());
    }

    return updatedReview!;
  } catch (error) {
    throw error;
  }
};

const deleteReview = async (reviewId: string, userId: string): Promise<void> => {
  try {
    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
    });

    if (!review) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Review not found or you don't have permission to delete it"
      );
    }

    const productId = review.product.toString();

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductReviewStats(productId);
  } catch (error) {
    throw error;
  }
};

const markReviewHelpful = async (
  reviewId: string,
  userId: string,
  helpful: boolean
): Promise<TReview> => {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new AppError(httpStatus.NOT_FOUND, "Review not found");
    }

    // Prevent users from marking their own reviews as helpful
    if (review.user.toString() === userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You cannot mark your own review as helpful"
      );
    }

    // Update helpful/not helpful count
    const updateField = helpful ? "helpful" : "notHelpful";
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { [updateField]: 1 } },
      { new: true }
    )
      .populate("user", "name profilePhoto")
      .populate("product", "title");

    return updatedReview!;
  } catch (error) {
    throw error;
  }
};

const updateProductReviewStats = async (productId: string): Promise<void> => {
  try {
    const reviews = await Review.find({
      product: productId,
      isApproved: true,
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum: number, review: TReview) => sum + review.rating, 0) / totalReviews
      : 0;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews,
    });
  } catch (error) {
    console.error("Error updating product review stats:", error);
    // Don't throw error to avoid blocking main operations
  }
};

// Admin functions
const getAllReviewsForAdmin = async (query: Record<string, unknown>) => {
  try {
    const reviewQuery = new QueryBuilder(
      Review.find({})
        .populate("user", "name email profilePhoto")
        .populate("product", "title thumbnailImage")
        .sort({ createdAt: -1 }),
      query
    )
      .search(ReviewSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await reviewQuery.modelQuery;
    const meta = await reviewQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const toggleReviewApproval = async (
  reviewId: string,
  isApproved: boolean
): Promise<TReview> => {
  try {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new AppError(httpStatus.NOT_FOUND, "Review not found");
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    )
      .populate("user", "name profilePhoto")
      .populate("product", "title");

    // Update product stats after approval status change
    await updateProductReviewStats(review.product.toString());

    return updatedReview!;
  } catch (error) {
    throw error;
  }
};

export const ReviewServices = {
  addReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  updateProductReviewStats,
  getAllReviewsForAdmin,
  toggleReviewApproval,
};