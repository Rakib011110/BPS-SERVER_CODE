import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../User/user.constant";
import { ProductControllers } from "./product.controller";
import { ProductValidations } from "./product.validation";

const router = express.Router();

// Public routes (no authentication required)
router.get("/", ProductControllers.getAllProducts);

router.get("/featured", ProductControllers.getFeaturedProducts);

router.get("/search", ProductControllers.searchProducts);

router.get("/category/:category", ProductControllers.getProductsByCategory);

router.get("/slug/:slug", ProductControllers.getProductBySlug);

router.get("/vendor/:vendorId", ProductControllers.getProductsByVendor);

router.get("/:id", ProductControllers.getProductById);

// Authenticated routes - Customer/User can download
router.put(
  "/:id/download",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  ProductControllers.incrementDownloadCount
);

// Vendor routes - Create, update, delete own products
router.post(
  "/",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  // validateRequest(ProductValidations.createProductValidationSchema),
  ProductControllers.createProduct
);

router.get(
  "/my/products",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  ProductControllers.getMyProducts
);

router.put(
  "/:id",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  validateRequest(ProductValidations.updateProductValidationSchema),
  ProductControllers.updateProduct
);

router.delete(
  "/:id",
  auth(USER_ROLE.VENDOR, USER_ROLE.ADMIN),
  ProductControllers.deleteProduct
);

// Admin only routes
router.get(
  "/admin/all",
  auth(USER_ROLE.ADMIN),
  ProductControllers.getAllProductsForAdmin
);

export const ProductRoutes = router;
