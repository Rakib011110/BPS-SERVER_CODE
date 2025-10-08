import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../User/user.constant";
import { ReviewControllers } from "./review.controller";
import { ReviewValidations } from "./review.validation";

const router = express.Router();

// Public routes - Get reviews for a specific product
router.get("/product/:productId", ReviewControllers.getProductReviews);

// Authenticated user routes
router.post(
  "/",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  validateRequest(ReviewValidations.addReviewValidationSchema),
  ReviewControllers.addReview
);

router.get(
  "/my-reviews",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  ReviewControllers.getUserReviews
);

router.put(
  "/:reviewId",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  validateRequest(ReviewValidations.updateReviewValidationSchema),
  ReviewControllers.updateReview
);

router.delete(
  "/:reviewId",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  ReviewControllers.deleteReview
);

router.post(
  "/:reviewId/helpful",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  validateRequest(ReviewValidations.reviewHelpfulnessValidationSchema),
  ReviewControllers.markReviewHelpful
);

// Admin routes
router.get(
  "/admin/all",
  auth(USER_ROLE.ADMIN),
  ReviewControllers.getAllReviewsForAdmin
);

router.patch(
  "/admin/:reviewId/approval",
  auth(USER_ROLE.ADMIN),
  ReviewControllers.toggleReviewApproval
);

export const ReviewRoutes = router;