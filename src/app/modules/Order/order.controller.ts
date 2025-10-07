import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const result = await OrderServices.createOrder(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Order created successfully!",
    data: result,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const result = await OrderServices.getAllOrders(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.getOrderById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order retrieved successfully!",
    data: result,
  });
});

const getOrderByNumber = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const result = await OrderServices.getOrderByNumber(orderNumber);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order retrieved successfully!",
    data: result,
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const result = await OrderServices.getUserOrders(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your orders retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const result = await OrderServices.updateOrderStatus(id, status, adminNotes);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated successfully!",
    data: result,
  });
});

const updatePaymentStatus = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const result = await OrderServices.updatePaymentStatus(orderNumber, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment status updated successfully!",
    data: result,
  });
});

const processRefund = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await OrderServices.processRefund(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Refund processed successfully!",
    data: result,
  });
});

const getOrderStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filters: any = {};

  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const result = await OrderServices.getOrderStats(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order statistics retrieved successfully!",
    data: result,
  });
});

const generateDownloadLink = catchAsync(async (req, res) => {
  const { orderId, productId } = req.params;
  const userId = req.user?._id;

  console.log(
    `📥 Download request - Order: ${orderId}, Product: ${productId}, User: ${userId}`
  );

  const result = await OrderServices.generateDownloadLink(
    orderId,
    productId,
    userId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Download link generated successfully!",
    data: result,
  });
});

const getUserPurchasedProducts = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await OrderServices.getUserPurchasedProducts(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User purchased products retrieved successfully!",
    data: result,
  });
});

const getUserOrdersForLicense = catchAsync(async (req, res) => {
  const { userId } = req.params;
  console.log("🎯 Controller: Getting orders for user:", userId);

  const result = await OrderServices.getUserOrdersForLicense(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User orders retrieved successfully!",
    data: result,
  });
});

export const OrderControllers = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  getMyOrders,
  updateOrderStatus,
  updatePaymentStatus,
  processRefund,
  getOrderStats,
  generateDownloadLink,
  getUserPurchasedProducts,
  getUserOrdersForLicense,
};
