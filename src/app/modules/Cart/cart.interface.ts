import { Document, Model, Types } from 'mongoose';

export interface TCartItem {
  product?: Types.ObjectId;
  subscriptionPlan?: Types.ObjectId;
  type: 'product' | 'subscription';
  quantity: number;
  price: number;
  originalPrice?: number;
  discountAmount?: number;
  addedAt: Date;
}

export interface TCart extends Document {
  user: Types.ObjectId;
  items: TCartItem[];
  
  // Totals
  subtotal: number;
  totalItems: number;
  
  // Applied discounts
  couponCode?: string;
  couponDiscount?: number;
  couponType?: 'percentage' | 'fixed';
  
  // Cart metadata
  lastModified: Date;
  expiresAt: Date; // Cart expiry for session management
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartModel extends Model<TCart> {
  calculateCartTotals(items: TCartItem[]): { subtotal: number; totalItems: number };
  isItemInCart(cart: TCart, itemId: string, type: 'product' | 'subscription'): boolean;
}

export interface TCartSummary {
  subtotal: number;
  totalItems: number;
  couponDiscount: number;
  estimatedTotal: number;
  savings: number;
}