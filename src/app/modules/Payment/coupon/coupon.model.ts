import mongoose, { Schema } from "mongoose";
import { ICoupon } from "./coupon.interface";

const couponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['fixed', 'percentage'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number },
  minAmount: { type: Number },
  isActive: { type: Boolean, default: true },
  expireAt: { type: Date, required: true }
}, { timestamps: true });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);