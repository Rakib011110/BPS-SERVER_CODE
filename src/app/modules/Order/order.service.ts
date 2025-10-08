import httpStatus from "http-status";
import { Order } from "./order.model";
import { Product } from "../Product/product.model";
import { SubscriptionPlan } from "../Subscription/subscription.model";
import { LicenseKey } from "../LicenseKey/licenseKey.model";
import { User } from "../User/user.model";
import {
  TOrder,
  TOrderItem,
  TOrderFilter,
  TOrderStats,
} from "./order.interface";
import { OrderSearchableFields } from "./order.constant";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  ORDER_ITEM_TYPE,
} from "./order.constant";
import AppError from "../../error/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { enhancedNotificationService } from "../Notification/enhancedNotification.service";

const createOrder = async (
  userId: string,
  orderData: {
    items: TOrderItem[];
    customerEmail: string;
    customerPhone?: string;
    billingAddress?: any;
    couponCode?: string;
    couponDiscount?: number;
    notes?: string;
  }
): Promise<TOrder> => {
  try {
    // Validate and populate order items
    const validatedItems: TOrderItem[] = [];
    let subtotal = 0;

    for (const item of orderData.items) {
      let validatedItem: TOrderItem;

      if (item.type === ORDER_ITEM_TYPE.PRODUCT) {
        const product = await Product.findById(item.product);
        if (!product || !product.isActive) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            `Product not found or inactive`
          );
        }

        validatedItem = {
          ...item,
          price: product.price,
          originalPrice: product.originalPrice,
          discountAmount: product.originalPrice
            ? product.originalPrice - product.price
            : 0,
        };
      } else if (item.type === ORDER_ITEM_TYPE.SUBSCRIPTION) {
        const subscriptionPlan = await SubscriptionPlan.findById(
          item.subscriptionPlan
        );
        if (!subscriptionPlan || !subscriptionPlan.isActive) {
          throw new AppError(
            httpStatus.NOT_FOUND,
            `Subscription plan not found or inactive`
          );
        }

        validatedItem = {
          ...item,
          price: subscriptionPlan.price,
          originalPrice: subscriptionPlan.originalPrice,
          discountAmount: subscriptionPlan.originalPrice
            ? subscriptionPlan.originalPrice - subscriptionPlan.price
            : 0,
        };
      } else {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid item type: ${item.type}`
        );
      }

      validatedItems.push(validatedItem);
      subtotal += validatedItem.price * validatedItem.quantity;
    }

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Calculate totals
    const couponDiscount = orderData.couponDiscount || 0;
    const tax = 0; // You can implement tax calculation logic here
    const shipping = 0; // Digital products typically don't have shipping
    const totalAmount = Order.calculateOrderTotal(
      validatedItems,
      couponDiscount,
      tax,
      shipping
    );

    // Create order
    const order = new Order({
      orderNumber,
      user: userId,
      items: validatedItems,
      subtotal,
      tax,
      shipping,
      couponDiscount,
      totalAmount,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      billingAddress: orderData.billingAddress,
      couponCode: orderData.couponCode,
      notes: orderData.notes,
    });

    const result = await order.save();
    const populatedOrder = (await Order.findById(result._id)
      .populate("user", "name email phone")
      .populate("items.product", "title price thumbnailImage")
      .populate("items.subscriptionPlan", "name price duration")) as TOrder;

    // Send order confirmation notification
    try {
      const user = await User.findById(userId);
      if (user) {
        await enhancedNotificationService.sendOrderConfirmedNotification(
          populatedOrder,
          user
        );
      }
    } catch (notificationError) {
      console.error(
        "Failed to send order confirmation notification:",
        notificationError
      );
      // Don't throw error - order creation should succeed even if notification fails
    }

    return populatedOrder;
  } catch (error) {
    throw error;
  }
};

const getAllOrders = async (query: Record<string, unknown>) => {
  try {
    const orderQuery = new QueryBuilder(
      Order.find()
        .populate("user", "name email")
        .populate("items.product", "title price thumbnailImage")
        .populate("items.subscriptionPlan", "name price duration"),
      query
    )
      .search(OrderSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await orderQuery.modelQuery;
    const meta = await orderQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getOrderById = async (id: string): Promise<TOrder> => {
  try {
    const result = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("items.product", "title price thumbnailImage digitalFileUrl")
      .populate("items.subscriptionPlan", "name price duration features");

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getOrderByNumber = async (orderNumber: string): Promise<TOrder> => {
  try {
    const result = await Order.findOne({ orderNumber })
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "title price thumbnailImage digitalFileUrl type"
      )
      .populate("items.subscriptionPlan", "name price billingCycle features");

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getUserOrders = async (
  userId: string,
  query: Record<string, unknown>
) => {
  try {
    const orderQuery = new QueryBuilder(
      Order.find({ user: userId })
        .populate(
          "items.product",
          "title price thumbnailImage type digitalFileUrl downloadLimit"
        )
        .populate("items.subscriptionPlan", "name price billingCycle"),
      query
    )
      .search(OrderSearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await orderQuery.modelQuery;
    const meta = await orderQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const updateOrderStatus = async (
  id: string,
  status: string,
  adminNotes?: string
): Promise<TOrder> => {
  try {
    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    const oldStatus = order.status;
    order.status = status as any;
    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    // Auto-update paymentStatus when order status changes to delivered or completed
    if (status === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.COMPLETED) {
      order.paymentStatus = PAYMENT_STATUS.COMPLETED;
      order.completedAt = new Date();

      // Set delivery timestamp if status is delivered
      if (status === ORDER_STATUS.DELIVERED) {
        order.deliveredAt = new Date();
      }
    }

    await order.save();

    const populatedOrder = (await Order.findById(id)
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "title price thumbnailImage digitalFileUrl type"
      )
      .populate("items.subscriptionPlan", "name price")) as TOrder;

    // Send notifications for status changes
    if (oldStatus !== status && status === ORDER_STATUS.COMPLETED) {
      try {
        const user = await User.findById(order.user);
        if (user) {
          // Check for digital products and send download notifications
          for (const item of populatedOrder.items) {
            if (item.type === ORDER_ITEM_TYPE.PRODUCT && item.product) {
              const product = await Product.findById(item.product);
              if (product && product.digitalFileUrl) {
                const downloadUrl = `${process.env.FRONTEND_URL}/user-profile/orders/${populatedOrder.orderNumber}`;
                await enhancedNotificationService.sendDigitalProductReadyNotification(
                  populatedOrder,
                  user,
                  product,
                  downloadUrl
                );
              }
            }
          }
        }
      } catch (notificationError) {
        console.error(
          "Failed to send order status notification:",
          notificationError
        );
      }
    }

    return populatedOrder;
  } catch (error) {
    throw error;
  }
};

const updatePaymentStatus = async (
  orderNumber: string,
  paymentData: {
    transactionId: string;
    paymentStatus: string;
    bankTransactionId?: string;
    cardType?: string;
    cardIssuer?: string;
    sessionId?: string;
  }
): Promise<TOrder> => {
  try {
    const order = await Order.findOne({ orderNumber });

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Update payment information
    order.transactionId = paymentData.transactionId;
    order.paymentStatus = paymentData.paymentStatus as any;
    order.bankTransactionId = paymentData.bankTransactionId;
    order.cardType = paymentData.cardType;
    order.cardIssuer = paymentData.cardIssuer;
    order.sessionId = paymentData.sessionId;

    if (paymentData.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      order.status = ORDER_STATUS.COMPLETED;
      order.paymentDate = new Date();
      order.completedAt = new Date();

      // Generate download links for digital products
      const downloadLinks = [];
      for (const item of order.items) {
        if (item.type === ORDER_ITEM_TYPE.PRODUCT && item.product) {
          const product = await Product.findById(item.product);
          if (product && product.digitalFileUrl) {
            downloadLinks.push({
              product: item.product,
              downloadUrl: product.digitalFileUrl,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              downloadCount: 0,
              maxDownloads: product.downloadLimit || 5,
            });
          }
        }
      }
      order.downloadLinks = downloadLinks;

      // Update product stats
      for (const item of order.items) {
        if (item.type === ORDER_ITEM_TYPE.PRODUCT && item.product) {
          const product = await Product.findById(item.product);

          await Product.findByIdAndUpdate(item.product, {
            $inc: {
              totalSales: item.quantity,
              revenue: item.price * item.quantity,
            },
          });

          // Generate license keys for software products
          if (
            product &&
            product.licenseType &&
            product.licenseType !== "unlimited"
          ) {
            try {
              const licenseKey = await LicenseKey.create({
                licenseKey: LicenseKey.generateLicenseKey(),
                product: item.product,
                user: order.user,
                order: order._id,
                licenseType: product.licenseType,
                maxActivations: product.licenseType === "single" ? 1 : 5,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
              });

              // Send license key notification
              const user = await User.findById(order.user);
              if (user && licenseKey) {
                await enhancedNotificationService.sendLicenseKeyNotification(
                  order,
                  user,
                  product,
                  licenseKey
                );
              }
            } catch (error) {
              console.error("Failed to generate license key:", error);
            }
          }
        } else if (
          item.type === ORDER_ITEM_TYPE.SUBSCRIPTION &&
          item.subscriptionPlan
        ) {
          await SubscriptionPlan.findByIdAndUpdate(item.subscriptionPlan, {
            $inc: {
              totalSubscribers: item.quantity,
              revenue: item.price * item.quantity,
            },
          });
        }
      }
    }

    await order.save();

    const populatedOrder = (await Order.findById(order._id)
      .populate("user", "name email phone")
      .populate("items.product", "title price thumbnailImage")
      .populate("items.subscriptionPlan", "name price")) as TOrder;

    // Send payment completed notification
    if (paymentData.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      try {
        const user = await User.findById(order.user);
        if (user) {
          const payment = {
            transactionId: paymentData.transactionId,
            amount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            createdAt: order.paymentDate || new Date(),
          };
          await enhancedNotificationService.sendPaymentCompletedNotification(
            payment,
            user,
            populatedOrder
          );
        }
      } catch (notificationError) {
        console.error(
          "Failed to send payment notification:",
          notificationError
        );
      }
    }

    return populatedOrder;
  } catch (error) {
    throw error;
  }
};

const processRefund = async (
  id: string,
  refundData: {
    amount: number;
    reason?: string;
    transactionId?: string;
  }
): Promise<TOrder> => {
  try {
    const order = await Order.findById(id);

    if (!order) {
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Order must be completed to process refund"
      );
    }

    const totalRefundable = order.totalAmount - (order.refundAmount || 0);

    if (refundData.amount > totalRefundable) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Refund amount cannot exceed remaining refundable amount"
      );
    }

    await order.processRefund(
      refundData.amount,
      refundData.reason,
      refundData.transactionId
    );

    return (await Order.findById(id)
      .populate("user", "name email")
      .populate("items.product", "title price")
      .populate("items.subscriptionPlan", "name price")) as TOrder;
  } catch (error) {
    throw error;
  }
};

const getOrderStats = async (
  filters: { startDate?: Date; endDate?: Date } = {}
): Promise<TOrderStats> => {
  try {
    const matchQuery: any = {};

    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }

    const stats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", ORDER_STATUS.COMPLETED] }, 1, 0],
            },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", ORDER_STATUS.PENDING] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", ORDER_STATUS.CANCELLED] }, 1, 0],
            },
          },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};

const generateDownloadLink = async (
  orderId: string,
  productId: string,
  userId: string
): Promise<{ downloadUrl: string; expiresAt: Date }> => {
  try {
    console.log(
      `🔍 Generating download link for Order: ${orderId}, Product: ${productId}, User: ${userId}`
    );

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    }).populate(
      "items.product",
      "title digitalFileUrl downloadLimit licenseType"
    );

    if (!order) {
      console.error("❌ Order not found");
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    console.log(
      `✅ Order found: ${order.orderNumber}, Status: ${order.status}, Payment: ${order.paymentStatus}`
    );

    // Check if order is completed
    if (order.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
      console.error("❌ Payment not completed");
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment not completed. Please complete payment first."
      );
    }

    // Find the product in order items
    const orderItem = order.items.find(
      (item: any) => item.product?._id?.toString() === productId
    );

    if (!orderItem || orderItem.type !== ORDER_ITEM_TYPE.PRODUCT) {
      console.error("❌ Product not found in order");
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Product not found in this order"
      );
    }

    const product = orderItem.product as any;
    console.log(`✅ Product found in order: ${product?.title || "Unknown"}`);

    // Find or create download link
    let downloadLink = order.downloadLinks?.find(
      (link: any) => link.product.toString() === productId
    );

    // If download link doesn't exist, generate it
    if (!downloadLink) {
      console.log("⚠️ Download link not found, generating new one...");

      const productData = await Product.findById(productId);
      if (!productData || !productData.digitalFileUrl) {
        console.error("❌ Product not found or no digital file");
        throw new AppError(
          httpStatus.NOT_FOUND,
          "Digital file not available for this product"
        );
      }

      // Create new download link
      const newDownloadLink = {
        product: productId as any,
        downloadUrl: productData.digitalFileUrl,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        downloadCount: 0,
        maxDownloads: productData.downloadLimit || 10,
      };

      // Add to order
      if (!order.downloadLinks) {
        order.downloadLinks = [];
      }
      order.downloadLinks.push(newDownloadLink as any);
      await order.save();
      downloadLink = newDownloadLink;
      console.log("✅ New download link created");
    }

    console.log(
      `📊 Download stats - Count: ${downloadLink?.downloadCount || 0}/${
        downloadLink?.maxDownloads || 0
      }`
    );

    // Check download limit
    if (
      downloadLink &&
      downloadLink.downloadCount >= downloadLink.maxDownloads
    ) {
      console.error("❌ Download limit exceeded");
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Download limit exceeded (${downloadLink.maxDownloads} downloads allowed)`
      );
    }

    // Check expiry
    if (downloadLink && new Date() > downloadLink.expiresAt) {
      console.error("❌ Download link expired");
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Download link has expired. Please contact support."
      );
    }

    // Increment download count
    if (downloadLink) {
      downloadLink.downloadCount += 1;
      await order.save();
      console.log(
        `✅ Download count incremented to: ${downloadLink.downloadCount}`
      );
    }

    // Update product download count
    await Product.findByIdAndUpdate(productId, {
      $inc: { downloadCount: 1 },
    });

    console.log(
      `✅ Download link generated successfully: ${downloadLink?.downloadUrl}`
    );

    return {
      downloadUrl: downloadLink?.downloadUrl || "",
      expiresAt: downloadLink?.expiresAt || new Date(),
    };
  } catch (error) {
    console.error("❌ Error in generateDownloadLink:", error);
    throw error;
  }
};

const getUserPurchasedProducts = async (userId: string) => {
  try {
    // Find all completed orders for the user
    const orders = await Order.find({
      user: userId,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
    }).populate("items.product", "title price thumbnailImage type _id");

    // Extract unique products from all orders
    const productsMap = new Map();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.type === ORDER_ITEM_TYPE.PRODUCT && item.product) {
          const product = item.product as any;
          if (!productsMap.has(product._id.toString())) {
            productsMap.set(product._id.toString(), {
              _id: product._id,
              title: product.title,
              price: product.price,
              thumbnailImage: product.thumbnailImage,
              type: product.type,
            });
          }
        }
      });
    });

    return Array.from(productsMap.values());
  } catch (error) {
    throw error;
  }
};

const getUserOrdersForLicense = async (userId: string) => {
  try {
    console.log("📋 Fetching orders for user:", userId);

    // Find all completed orders for the user with products
    const orders = await Order.find({
      user: userId,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      "items.type": ORDER_ITEM_TYPE.PRODUCT,
    })
      .populate("items.product", "title _id")
      .select("_id orderNumber totalAmount items createdAt")
      .lean() // Use lean() to return plain JavaScript objects and skip virtuals
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${orders.length} orders for user`);

    // Format orders for dropdown
    const formattedOrders = orders.map((order: any) => {
      const productCount =
        order.items?.filter(
          (item: any) => item.type === ORDER_ITEM_TYPE.PRODUCT
        ).length || 0;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        productCount,
        createdAt: order.createdAt,
        items:
          order.items
            ?.filter((item: any) => item.type === ORDER_ITEM_TYPE.PRODUCT)
            .map((item: any) => ({
              product: item.product,
            })) || [],
      };
    });

    return formattedOrders;
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    throw error;
  }
};

export const OrderServices = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  getUserOrders,
  updateOrderStatus,
  updatePaymentStatus,
  processRefund,
  getOrderStats,
  generateDownloadLink,
  getUserPurchasedProducts,
  getUserOrdersForLicense,
};
