import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { CartServices as cartService } from "./cart.service";
import sendResponse from "../../utils/sendResponse";

const getUserCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await cartService.getUserCart(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart retrieved successfully",
    data: result,
  });
});

const addItemToCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  console.log("userId:", userId);
  const result = await cartService.addItemToCart(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Item added to cart successfully",
    data: result,
  });
});

const removeItemFromCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { itemId } = req.params;
  const { type } = req.query;

  const result = await cartService.removeItemFromCart(
    userId,
    itemId,
    type as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Item removed from cart successfully",
    data: result,
  });
});

const updateItemQuantity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { itemId } = req.params;
  const { type, quantity } = req.body;

  const result = await cartService.updateItemQuantity(
    userId,
    itemId,
    type,
    quantity
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart item quantity updated successfully",
    data: result,
  });
});

const clearUserCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await cartService.clearUserCart(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart cleared successfully",
    data: result,
  });
});

const applyCouponToCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { couponCode, discountAmount, couponType } = req.body;

  const result = await cartService.applyCouponToCart(
    userId,
    couponCode,
    discountAmount,
    couponType
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon applied to cart successfully",
    data: result,
  });
});

const removeCouponFromCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await cartService.removeCouponFromCart(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon removed from cart successfully",
    data: result,
  });
});

const bulkAddToCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { items } = req.body;

  const result = await cartService.bulkAddToCart(userId, items);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Items added to cart successfully",
    data: result,
  });
});

const getCartSummary = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const result = await cartService.getCartSummary(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Cart summary retrieved successfully",
    data: result,
  });
});

const validateCartForCheckout = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const result = await cartService.validateCartForCheckout(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Cart validation completed",
      data: result,
    });
  }
);

export const CartController = {
  getUserCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  clearUserCart,
  applyCouponToCart,
  removeCouponFromCart,
  bulkAddToCart,
  getCartSummary,
  validateCartForCheckout,
};
