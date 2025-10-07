
/* src/controllers/coupon.controller.ts */
import { Request, Response, NextFunction } from "express";
import { CouponService } from "./coupon.services";

export class CouponController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const coupon = await CouponService.createCoupon(req.body);
      res.json({ success: true, data: coupon });
    } catch (err: any) {
      next(err);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, amount } = req.body;
      const amt = Number(amount);
      if (isNaN(amt)) throw new Error('Amount must be a number');
      const result = await CouponService.validateCoupon(code, amt);
      res.json({ success: true, ...result });
    } catch (err: any) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await CouponService.getAllCoupons();
      res.json({ success: true, data: coupons });
    } catch (err: any) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CouponService.deleteCoupon(req.params.code);
      res.json({ success: true, message: 'Coupon deleted' });
    } catch (err: any) {
      next(err);
    }
  }
}

