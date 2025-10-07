import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductServices } from "./product.service";

const createProduct = catchAsync(async (req, res) => {
  const vendorId = req.user?._id;
  const result = await ProductServices.createProduct(req.body, vendorId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Product created successfully!",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProducts(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getAllProductsForAdmin = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsForAdmin(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ProductServices.getProductById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfully!",
    data: result,
  });
});

const getProductBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const result = await ProductServices.getProductBySlug(slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfully!",
    data: result,
  });
});

const getMyProducts = catchAsync(async (req, res) => {
  const vendorId = req.user?._id;
  const result = await ProductServices.getProductsByVendor(vendorId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your products retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getProductsByVendor = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result = await ProductServices.getProductsByVendor(vendorId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vendor products retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getFeaturedProducts = catchAsync(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
  const result = await ProductServices.getFeaturedProducts(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Featured products retrieved successfully!",
    data: result,
    meta: {
      page: 1,
      limit,
      total: result.length,
      totalPages: Math.ceil(result.length / limit),
    },
  });
});

const getProductsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const result = await ProductServices.getProductsByCategory(
    category,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category products retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user?.role === "ADMIN" ? undefined : req.user?._id;
  const result = await ProductServices.updateProduct(id, req.body, vendorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product updated successfully!",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user?.role === "ADMIN" ? undefined : req.user?._id;
  await ProductServices.deleteProduct(id, vendorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product deleted successfully!",
    data: null,
  });
});

const searchProducts = catchAsync(async (req, res) => {
  const { searchTerm, ...filters } = req.query;
  const result = await ProductServices.searchProducts(
    searchTerm as string,
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products search completed successfully!",
    data: result,
  });
});

const incrementDownloadCount = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ProductServices.incrementDownloadCount(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Download count updated successfully!",
    data: null,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getAllProductsForAdmin,
  getProductById,
  getProductBySlug,
  getMyProducts,
  getProductsByVendor,
  getFeaturedProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  searchProducts,
  incrementDownloadCount,
};
