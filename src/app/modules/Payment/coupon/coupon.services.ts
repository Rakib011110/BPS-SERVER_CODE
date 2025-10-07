import { ICoupon } from "./coupon.interface";
import { Coupon } from "./coupon.model";

export class CouponService {
  static async createCoupon(data: Partial<ICoupon>) {
    if (data.discountType === 'percentage' && (data.discountValue ?? 0) > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }
    return await Coupon.create(data);
  }

  static async validateCoupon(code: string, amount: number) {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) throw new Error('Invalid coupon code');

    const now = new Date();
    if (coupon.expireAt < now) throw new Error('Coupon has expired');

    if (coupon.minAmount != null && amount < coupon.minAmount) {
      throw new Error(`Minimum purchase amount ${coupon.minAmount} required`);
    }

    let discountAmount: number;
    if (coupon.discountType === 'percentage') {
      const calc = (amount * coupon.discountValue) / 100;
      discountAmount = coupon.maxDiscount != null ? Math.min(calc, coupon.maxDiscount) : calc;
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = Math.max(amount - discountAmount, 0);
    return {
      discountAmount: Number(discountAmount.toFixed(2)),
      finalAmount: Number(finalAmount.toFixed(2)),
      couponType: coupon.discountType,
      couponValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount ?? null
    };
  }

  static async getAllCoupons() {
    return await Coupon.find();
  }

  static async deleteCoupon(code: string) {
    return await Coupon.findOneAndDelete({ code: code.toUpperCase() });
  }
}
