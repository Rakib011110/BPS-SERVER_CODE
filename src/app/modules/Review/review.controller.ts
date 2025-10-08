import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ReviewServices } from "./review.service";

const addReview = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const { productId, orderId, ...reviewData } = req.body;
  
  const payload = {
    productId,
    orderId,
    ...reviewData,
  };
  
  const result = await ReviewServices.addReview(userId, payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review added successfully!",
    data: result,
  });
});

const getProductReviews = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const result = await ReviewServices.getProductReviews(productId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product reviews retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getUserReviews = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const result = await ReviewServices.getUserReviews(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your reviews retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user?._id;
  const result = await ReviewServices.updateReview(reviewId, userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review updated successfully!",
    data: result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user?._id;
  await ReviewServices.deleteReview(reviewId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully!",
    data: null,
  });
});

const markReviewHelpful = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user?._id;
  const { helpful } = req.body;
  
  const result = await ReviewServices.markReviewHelpful(reviewId, userId, helpful);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review feedback recorded successfully!",
    data: result,
  });
});

// Admin controllers
const getAllReviewsForAdmin = catchAsync(async (req, res) => {
  const result = await ReviewServices.getAllReviewsForAdmin(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All reviews retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const toggleReviewApproval = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const { isApproved } = req.body;
  
  const result = await ReviewServices.toggleReviewApproval(reviewId, isApproved);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Review ${isApproved ? 'approved' : 'rejected'} successfully!`,
    data: result,
  });
});

export const ReviewControllers = {
  addReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getAllReviewsForAdmin,
  toggleReviewApproval,
};