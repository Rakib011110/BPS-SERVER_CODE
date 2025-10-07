import httpStatus from "http-status";
import { Types } from "mongoose";
import { Cart } from "./cart.model";
import { Product } from "../Product/product.model";
import { TCart, TCartItem } from "./cart.interface";
import { CART_ITEM_TYPE } from "./cart.constant";
import AppError from "../../error/AppError";

// Get user's cart
const getUserCart = async (userId: string): Promise<any> => {
  try {
    let cart = await Cart.findOne({ user: userId })
      .populate("items.product", "title price thumbnail isActive stock")
      .populate("items.subscriptionPlan", "name price billingCycle isActive");

    if (!cart) {
      // Create a new cart for the user
      cart = await Cart.create({ user: userId, items: [] });
    }

    return cart;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get user cart"
    );
  }
};

// Add item to cart
const addItemToCart = async (userId: string, itemData: any): Promise<any> => {
  try {
    let cart = await getUserCart(userId);

    // Validate the item based on type
    let itemPrice = itemData.price;

    if (itemData.type === CART_ITEM_TYPE.PRODUCT) {
      // Validate product exists and is active
      try {
        const product = await Product.findById(itemData.product);
        if (!product) {
          throw new AppError(httpStatus.BAD_REQUEST, "Product not found");
        }
        if (!product.isActive) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Product is not available"
          );
        }

        // Check stock availability for physical products
        if (
          product.type === "physical" &&
          (!product.stock || product.stock <= 0)
        ) {
          throw new AppError(httpStatus.BAD_REQUEST, "Product is out of stock");
        }

        itemPrice = itemData.price || product.price;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid product ID");
      }
    } else if (itemData.type === CART_ITEM_TYPE.SUBSCRIPTION) {
      // For subscriptions, we could add validation here if needed
      // For now, just use the provided price
      itemPrice = itemData.price;
    }

    // Check if cart has reached maximum items (50)
    if (cart.items.length >= 50) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Maximum 50 items allowed in cart"
      );
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item: any) => {
      if (itemData.type === CART_ITEM_TYPE.PRODUCT) {
        return item.product?.toString() === itemData.product;
      } else if (itemData.type === CART_ITEM_TYPE.SUBSCRIPTION) {
        return item.subscriptionPlan?.toString() === itemData.subscriptionPlan;
      }
      return false;
    });

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity = Math.min(
        cart.items[existingItemIndex].quantity + itemData.quantity,
        10 // Max quantity per item
      );
    } else {
      // Add new item
      cart.items.push({
        ...itemData,
        price: itemPrice,
        addedAt: new Date(),
      });
    }

    await cart.save();
    return cart;
  } catch (error) {
    console.error("Error adding item to cart:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to add item to cart: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Remove item from cart
const removeItemFromCart = async (
  userId: string,
  itemId: string,
  type: string
): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    cart.items = cart.items.filter((item: any) => {
      if (type === CART_ITEM_TYPE.PRODUCT) {
        return item.product?.toString() !== itemId;
      } else if (type === CART_ITEM_TYPE.SUBSCRIPTION) {
        return item.subscriptionPlan?.toString() !== itemId;
      }
      return true;
    });

    await cart.save();
    return cart;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to remove item from cart"
    );
  }
};

// Update item quantity
const updateItemQuantity = async (
  userId: string,
  itemId: string,
  type: string,
  quantity: number
): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    const itemIndex = cart.items.findIndex((item: any) => {
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
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity (max 10)
        cart.items[itemIndex].quantity = Math.min(quantity, 10);
      }
    } else {
      throw new AppError(httpStatus.NOT_FOUND, "Item not found in cart");
    }

    await cart.save();
    return cart;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update item quantity"
    );
  }
};

// Clear user cart
const clearUserCart = async (userId: string): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    cart.items = [];
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    cart.couponType = undefined;

    await cart.save();
    return cart;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to clear cart"
    );
  }
};

// Apply coupon to cart
const applyCouponToCart = async (
  userId: string,
  couponCode: string,
  discountAmount: number,
  couponType: string
): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    if (cart.subtotal === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot apply coupon to empty cart"
      );
    }

    // Calculate actual discount based on type
    let actualDiscount = discountAmount;
    if (couponType === "percentage") {
      actualDiscount = (cart.subtotal * discountAmount) / 100;
    }

    // Ensure discount doesn't exceed cart total
    actualDiscount = Math.min(actualDiscount, cart.subtotal);

    cart.couponCode = couponCode;
    cart.couponDiscount = actualDiscount;
    cart.couponType = couponType;

    await cart.save();
    return cart;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to apply coupon"
    );
  }
};

// Remove coupon from cart
const removeCouponFromCart = async (userId: string): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    cart.couponType = undefined;

    await cart.save();
    return cart;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to remove coupon"
    );
  }
};

// Bulk add items to cart
const bulkAddToCart = async (userId: string, items: any[]): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    for (const item of items) {
      // Validate each item
      if (item.type === CART_ITEM_TYPE.PRODUCT) {
        const product = await Product.findById(item.product);
        if (!product || !product.isActive) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Product ${item.product} is not available`
          );
        }
      }

      // Check if item already exists
      const existingItemIndex = cart.items.findIndex((cartItem: any) => {
        if (item.type === CART_ITEM_TYPE.PRODUCT) {
          return cartItem.product?.toString() === item.product;
        } else if (item.type === CART_ITEM_TYPE.SUBSCRIPTION) {
          return (
            cartItem.subscriptionPlan?.toString() === item.subscriptionPlan
          );
        }
        return false;
      });

      if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        cart.items.push({
          ...item,
          addedAt: new Date(),
        });
      }
    }

    await cart.save();
    return cart;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to bulk add items to cart"
    );
  }
};

// Get cart summary
const getCartSummary = async (userId: string): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    return {
      itemCount: cart.totalItems,
      subtotal: cart.subtotal,
      discountAmount: cart.couponDiscount || 0,
      estimatedTotal: Math.max(0, cart.subtotal - (cart.couponDiscount || 0)),
      appliedCoupon: cart.couponCode
        ? {
            code: cart.couponCode,
            discount: cart.couponDiscount,
            type: cart.couponType,
          }
        : null,
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get cart summary"
    );
  }
};

// Validate cart for checkout
const validateCartForCheckout = async (userId: string): Promise<any> => {
  try {
    const cart = await getUserCart(userId);

    if (!cart || cart.items.length === 0) {
      return {
        isValid: false,
        message: "Cart is empty",
        cart: null,
      };
    }

    // Validate each item
    for (const item of cart.items) {
      if (item.type === CART_ITEM_TYPE.PRODUCT) {
        const product = await Product.findById(item.product);
        if (!product || !product.isActive) {
          return {
            isValid: false,
            message: `Product ${item.product} is no longer available`,
            cart: null,
          };
        }
      }
    }

    return {
      isValid: true,
      message: "Cart is valid for checkout",
      cart,
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to validate cart"
    );
  }
};

export const CartServices = {
  getUserCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  clearUserCart,
  applyCouponToCart,
  removeCouponFromCart,
  bulkAddToCart,
  getCartSummary,
  validateCartForCheckout,
};
