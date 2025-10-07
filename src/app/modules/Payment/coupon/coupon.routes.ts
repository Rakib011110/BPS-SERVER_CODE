import express from "express";
import { CouponController } from "./coupon.controller";


// Admin routes
const router = express.Router();

// Admin
router.post('/', CouponController.create);
router.get('/', CouponController.getAll);
router.delete('/:code', CouponController.delete);

// Public
router.post('/validate', CouponController.validate);

export const couponRoutes = router;