export interface ICoupon extends Document {
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maxDiscount?: number;
  minAmount?: number;
  isActive: boolean;
  expireAt: Date;
}
