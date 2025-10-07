export const CART_ITEM_TYPE = {
  PRODUCT: 'product',
  SUBSCRIPTION: 'subscription',
} as const;

export const COUPON_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
} as const;

// Cart expires after 30 days of inactivity
export const CART_EXPIRY_DAYS = 30;

export const CartValidationRules = {
  MAX_ITEMS_PER_CART: 50,
  MAX_QUANTITY_PER_ITEM: 10,
  MIN_QUANTITY_PER_ITEM: 1,
};