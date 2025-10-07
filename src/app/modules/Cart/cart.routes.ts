import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { CartValidation } from "./cart.validation";
import { USER_ROLE } from "../User/user.constant";
import { CartController } from "./cart.controller";

const router = express.Router();

// Get user's cart - authenticated users only
router.get(
  "/",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  CartController.getUserCart
);

// Add item to cart
router.post(
  "/add-item",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(CartValidation.createCartItemValidationSchema),
  CartController.addItemToCart
);

// Bulk add items to cart
router.post(
  "/bulk-add",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(CartValidation.bulkAddToCartValidationSchema),
  CartController.bulkAddToCart
);

// Update item quantity
router.patch(
  "/update-quantity/:itemId",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  // validateRequest(CartValidation.updateCartItemQuantityValidationSchema),
  CartController.updateItemQuantity
);

// Remove item from cart
router.delete(
  "/remove-item/:itemId",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  // validateRequest(CartValidation.removeCartItemValidationSchema),
  CartController.removeItemFromCart
);

// Clear entire cart
router.delete(
  "/clear",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  CartController.clearUserCart
);

// Apply coupon to cart
router.post(
  "/apply-coupon",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  // validateRequest(CartValidation.applyCouponValidationSchema),
  CartController.applyCouponToCart
);

// Remove coupon from cart
router.delete(
  "/remove-coupon",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  CartController.removeCouponFromCart
);

// Get cart summary
router.get(
  "/summary",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  CartController.getCartSummary
);

// Validate cart for checkout
router.get(
  "/validate",
  auth(USER_ROLE.USER, USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  CartController.validateCartForCheckout
);

export const CartRoutes = router;
