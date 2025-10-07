import mongoose, { Schema, model } from 'mongoose';
import { TCart, TCartItem, ICartModel } from './cart.interface';
import { CART_ITEM_TYPE, COUPON_TYPE, CART_EXPIRY_DAYS } from './cart.constant';

const cartItemSchema = new Schema<TCartItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  subscriptionPlan: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
  },
  type: {
    type: String,
    enum: Object.values(CART_ITEM_TYPE),
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const cartSchema = new Schema<TCart, ICartModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: function(items: TCartItem[]) {
          // Each item must have either product or subscriptionPlan, not both
          return items.every(item => {
            if (item.type === CART_ITEM_TYPE.PRODUCT) {
              return item.product && !item.subscriptionPlan;
            } else if (item.type === CART_ITEM_TYPE.SUBSCRIPTION) {
              return item.subscriptionPlan && !item.product;
            }
            return false;
          });
        },
        message: 'Each cart item must have the appropriate reference based on its type'
      }
    },
    
    // Totals (calculated automatically)
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Applied discounts
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponType: {
      type: String,
      enum: Object.values(COUPON_TYPE),
    },
    
    // Cart metadata
    lastModified: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

// Indexes for better performance
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ lastModified: -1 });

// Virtual for estimated total after coupon discount
cartSchema.virtual('estimatedTotal').get(function () {
  return Math.max(0, this.subtotal - (this.couponDiscount || 0));
});

// Virtual for total savings
cartSchema.virtual('totalSavings').get(function () {
  const itemSavings = this.items.reduce((total, item) => {
    return total + ((item.originalPrice || item.price) - item.price) * item.quantity;
  }, 0);
  
  return itemSavings + (this.couponDiscount || 0);
});

// Static method to calculate cart totals
cartSchema.statics.calculateCartTotals = function (items: TCartItem[]) {
  const subtotal = items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  const totalItems = items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
  
  return { subtotal, totalItems };
};

// Static method to check if item is already in cart
cartSchema.statics.isItemInCart = function (cart: TCart, itemId: string, type: 'product' | 'subscription') {
  return cart.items.some(item => {
    if (type === CART_ITEM_TYPE.PRODUCT) {
      return item.product?.toString() === itemId;
    } else if (type === CART_ITEM_TYPE.SUBSCRIPTION) {
      return item.subscriptionPlan?.toString() === itemId;
    }
    return false;
  });
};

// Pre-save middleware to update totals and lastModified
cartSchema.pre('save', function (next) {
  // Update totals
  const totals = (this.constructor as ICartModel).calculateCartTotals(this.items);
  this.subtotal = totals.subtotal;
  this.totalItems = totals.totalItems;
  
  // Update lastModified timestamp
  this.lastModified = new Date();
  
  // Extend expiry date on modification
  this.expiresAt = new Date(Date.now() + CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  
  next();
});

// Instance methods
cartSchema.methods.addItem = function(itemData: Partial<TCartItem>) {
  const existingItemIndex = this.items.findIndex((item: TCartItem) => {
    if (itemData.type === CART_ITEM_TYPE.PRODUCT) {
      return item.product?.toString() === itemData.product?.toString();
    } else if (itemData.type === CART_ITEM_TYPE.SUBSCRIPTION) {
      return item.subscriptionPlan?.toString() === itemData.subscriptionPlan?.toString();
    }
    return false;
  });
  
  if (existingItemIndex >= 0) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity = Math.min(
      this.items[existingItemIndex].quantity + (itemData.quantity || 1),
      10 // Max quantity per item
    );
  } else {
    // Add new item
    this.items.push({
      ...itemData,
      addedAt: new Date(),
    } as TCartItem);
  }
  
  return this.save();
};

cartSchema.methods.removeItem = function(itemId: string, type: 'product' | 'subscription') {
  this.items = this.items.filter((item: TCartItem) => {
    if (type === CART_ITEM_TYPE.PRODUCT) {
      return item.product?.toString() !== itemId;
    } else if (type === CART_ITEM_TYPE.SUBSCRIPTION) {
      return item.subscriptionPlan?.toString() !== itemId;
    }
    return true;
  });
  
  return this.save();
};

cartSchema.methods.updateItemQuantity = function(itemId: string, type: 'product' | 'subscription', quantity: number) {
  const itemIndex = this.items.findIndex((item: TCartItem) => {
    if (type === CART_ITEM_TYPE.PRODUCT) {
      return item.product?.toString() === itemId;
    } else if (type === CART_ITEM_TYPE.SUBSCRIPTION) {
      return item.subscriptionPlan?.toString() === itemId;
    }
    return false;
  });
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      this.items.splice(itemIndex, 1);
    } else {
      // Update quantity (max 10)
      this.items[itemIndex].quantity = Math.min(quantity, 10);
    }
  }
  
  return this.save();
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  this.couponCode = undefined;
  this.couponDiscount = 0;
  this.couponType = undefined;
  
  return this.save();
};

cartSchema.methods.applyCoupon = function(couponCode: string, discountAmount: number, couponType: 'percentage' | 'fixed') {
  this.couponCode = couponCode;
  this.couponDiscount = discountAmount;
  this.couponType = couponType;
  
  return this.save();
};

cartSchema.methods.removeCoupon = function() {
  this.couponCode = undefined;
  this.couponDiscount = 0;
  this.couponType = undefined;
  
  return this.save();
};

export const Cart = model<TCart, ICartModel>('Cart', cartSchema);