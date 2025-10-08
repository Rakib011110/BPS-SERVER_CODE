import httpStatus from "http-status";
import { LicenseKey } from "./licenseKey.model";
import { Product } from "../Product/product.model";
import { User } from "../User/user.model";
import { Order } from "../Order/order.model";
import {
  TLicenseKey,
  TLicenseKeyFilter,
  TActivateLicense,
  TDeactivateLicense,
  TLicenseValidation,
} from "./licenseKey.interface";
import {
  LICENSE_STATUS,
  LICENSE_TYPE,
  LICENSE_MESSAGES,
  DEFAULT_LICENSE_SETTINGS,
} from "./licenseKey.constant";
import { LicenseKeySearchableFields } from "./licenseKey.constant";
import AppError from "../../error/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { sendEmail } from "../../utils/sendEmail";

const createLicenseKey = async (payload: {
  product: string;
  user: string;
  order: string;
  licenseType: "single" | "multiple" | "unlimited";
  maxActivations?: number;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  notes?: string;
  manualLicenseKey?: string;
}): Promise<TLicenseKey> => {
  try {
    console.log("🔑 Starting license key creation...");
    console.log("📦 Payload:", {
      ...payload,
      expiresAt: payload.expiresAt ? "provided" : "not provided",
    });

    // Verify product exists
    const product = await Product.findById(payload.product);
    if (!product) {
      console.error("❌ Product not found:", payload.product);
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }
    console.log("✅ Product found:", product.title);

    // Verify user exists
    const user = await User.findById(payload.user);
    if (!user) {
      console.error("❌ User not found:", payload.user);
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }
    console.log("✅ User found:", user.email);

    // Verify order exists
    const order = await Order.findById(payload.order);
    if (!order) {
      console.error("❌ Order not found:", payload.order);
      throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }
    console.log("✅ Order found:", order.orderNumber);

    // Generate or use manual license key
    let licenseKey: string;

    if (payload.manualLicenseKey && payload.manualLicenseKey.trim()) {
      // Use manual license key if provided
      licenseKey = payload.manualLicenseKey.trim();

      // Check if manual key already exists
      const existing = await LicenseKey.isLicenseKeyExists(licenseKey);
      if (existing) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "This license key already exists. Please use a different key."
        );
      }
    } else {
      // Auto-generate unique license key
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        licenseKey = LicenseKey.generateLicenseKey();
        const existing = await LicenseKey.isLicenseKeyExists(licenseKey);
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to generate unique license key"
        );
      }
    }

    // Set default max activations based on license type
    let maxActivations = payload.maxActivations;
    if (!maxActivations) {
      switch (payload.licenseType) {
        case "single":
          maxActivations = DEFAULT_LICENSE_SETTINGS.SINGLE_MAX_ACTIVATIONS;
          break;
        case "multiple":
          maxActivations = DEFAULT_LICENSE_SETTINGS.MULTIPLE_MAX_ACTIVATIONS;
          break;
        case "unlimited":
          maxActivations = DEFAULT_LICENSE_SETTINGS.UNLIMITED_MAX_ACTIVATIONS;
          break;
      }
    }

    // Set default expiry date if not provided
    let expiresAt = payload.expiresAt;
    if (!expiresAt) {
      expiresAt = new Date();
      expiresAt.setDate(
        expiresAt.getDate() + DEFAULT_LICENSE_SETTINGS.DEFAULT_EXPIRY_DAYS
      );
    }

    const licenseData = {
      licenseKey: licenseKey!,
      product: payload.product,
      user: payload.user,
      order: payload.order,
      licenseType: payload.licenseType,
      maxActivations,
      expiresAt,
      metadata: payload.metadata,
      notes: payload.notes,
    };

    console.log("💾 Creating license key in database...");
    const result = await LicenseKey.create(licenseData);

    const populatedResult = (await LicenseKey.findById(result._id)
      .populate("product", "title price licenseType")
      .populate("user", "name email")
      .populate({
        path: "order",
        select: "orderNumber totalAmount items createdAt",
      })
      .lean()) as TLicenseKey;

    console.log(
      "✅ License key created successfully:",
      populatedResult.licenseKey
    );

    // Send Email notification
    try {
      console.log("📧 Sending email notification to user...");
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #37BE31;">License Key Generated Successfully!</h2>
          <p>Hello ${user.name},</p>
          <p>Your license key for <strong>${
            product.title
          }</strong> has been generated.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">License Details:</h3>
            <p><strong>License Key:</strong> <code style="background: #e0e0e0; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${licenseKey!}</code></p>
            <p><strong>Product:</strong> ${product.title}</p>
            <p><strong>License Type:</strong> ${payload.licenseType.toUpperCase()}</p>
            <p><strong>Max Activations:</strong> ${maxActivations}</p>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            ${
              expiresAt
                ? `<p><strong>Expires At:</strong> ${new Date(
                    expiresAt
                  ).toLocaleDateString()}</p>`
                : "<p><strong>Validity:</strong> Lifetime</p>"
            }
          </div>
          
          <p>Keep this license key safe. You'll need it to activate your product.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; font-size: 12px;">If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `;

      await sendEmail(
        user.email,
        `🎉 Your License Key for ${product.title}`,
        emailContent
      );
      console.log("✅ Email sent successfully to:", user.email);
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError);
      // Don't throw error, just log it
    }

    // Send SMS notification (if phone exists in user data)
    try {
      const userWithPhone = user as any;
      if (userWithPhone.phone) {
        console.log("📱 Sending SMS notification to user...");
        const smsMessage = `License Key for ${
          product.title
        }: ${licenseKey!}. Order #${
          order.orderNumber
        }. Max Activations: ${maxActivations}. Keep this safe!`;

        // Using existing SMS utility
        const sendSMSUtil = require("../../utils/sendSMS");
        if (sendSMSUtil && typeof sendSMSUtil.sendSMS === "function") {
          await sendSMSUtil.sendSMS(userWithPhone.phone, smsMessage);
          console.log("✅ SMS sent successfully to:", userWithPhone.phone);
        } else {
          console.log("⚠️ SMS utility not available");
        }
      } else {
        console.log("⚠️ No phone number found for user, skipping SMS");
      }
    } catch (smsError) {
      console.error("❌ Failed to send SMS:", smsError);
      // Don't throw error, just log it
    }

    return populatedResult;
  } catch (error) {
    console.error("❌ Error creating license key:", error);
    throw error;
  }
};

const getAllLicenseKeys = async (query: Record<string, unknown>) => {
  try {
    const licenseQuery = new QueryBuilder(
      LicenseKey.find()
        .populate("product", "title price licenseType")
        .populate("user", "name email")
        .populate({
          path: "order",
          select: "orderNumber totalAmount items createdAt",
        }),
      query
    )
      .search(LicenseKeySearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await licenseQuery.modelQuery.lean();
    const meta = await licenseQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const getLicenseKeyById = async (id: string): Promise<TLicenseKey> => {
  try {
    const result = await LicenseKey.findById(id)
      .populate("product", "title price licenseType digitalFileUrl")
      .populate("user", "name email")
      .populate({
        path: "order",
        select: "orderNumber totalAmount items createdAt",
      })
      .lean();

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getLicenseKeyByKey = async (licenseKey: string): Promise<TLicenseKey> => {
  try {
    const result = await LicenseKey.findOne({ licenseKey })
      .populate("product", "title price licenseType digitalFileUrl")
      .populate("user", "name email")
      .populate({
        path: "order",
        select: "orderNumber totalAmount items createdAt",
      })
      .lean();

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const getUserLicenseKeys = async (
  userId: string,
  query: Record<string, unknown>
) => {
  try {
    const licenseQuery = new QueryBuilder(
      LicenseKey.find({ user: userId })
        .populate("product", "title price licenseType digitalFileUrl")
        .populate({
          path: "order",
          select: "orderNumber totalAmount items createdAt",
        }),
      query
    )
      .search(LicenseKeySearchableFields)
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await licenseQuery.modelQuery.lean();
    const meta = await licenseQuery.countTotal();

    return {
      result,
      meta,
    };
  } catch (error) {
    throw error;
  }
};

const updateLicenseKey = async (
  id: string,
  payload: Partial<TLicenseKey>
): Promise<TLicenseKey> => {
  try {
    const licenseKey = await LicenseKey.findById(id);

    if (!licenseKey) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    const result = await LicenseKey.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    })
      .populate("product", "title price licenseType")
      .populate("user", "name email")
      .populate({
        path: "order",
        select: "orderNumber totalAmount items createdAt",
      })
      .lean();

    return result!;
  } catch (error) {
    throw error;
  }
};

const activateLicense = async (
  payload: TActivateLicense
): Promise<TLicenseKey> => {
  try {
    const licenseKey = await LicenseKey.findOne({
      licenseKey: payload.licenseKey,
    });

    if (!licenseKey) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    // Check license status
    if (licenseKey.status !== LICENSE_STATUS.ACTIVE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `License is ${licenseKey.status}`
      );
    }

    // Check if expired
    if (licenseKey.expiresAt && new Date() > licenseKey.expiresAt) {
      licenseKey.status = LICENSE_STATUS.EXPIRED;
      await licenseKey.save();
      throw new AppError(httpStatus.BAD_REQUEST, LICENSE_MESSAGES.EXPIRED);
    }

    // Activate device
    await licenseKey.activateDevice({
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
    });

    return (await LicenseKey.findById(licenseKey._id)
      .populate("product", "title price licenseType digitalFileUrl")
      .populate("user", "name email")) as TLicenseKey;
  } catch (error) {
    throw error;
  }
};

const deactivateLicense = async (
  payload: TDeactivateLicense
): Promise<TLicenseKey> => {
  try {
    const licenseKey = await LicenseKey.findOne({
      licenseKey: payload.licenseKey,
    });

    if (!licenseKey) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    // Deactivate device
    await licenseKey.deactivateDevice(payload.deviceId);

    return (await LicenseKey.findById(licenseKey._id)
      .populate("product", "title price licenseType")
      .populate("user", "name email")) as TLicenseKey;
  } catch (error) {
    throw error;
  }
};

const validateLicense = async (
  licenseKey: string,
  deviceId: string
): Promise<TLicenseValidation> => {
  try {
    const license = await LicenseKey.findOne({ licenseKey }).populate(
      "product",
      "title price licenseType digitalFileUrl"
    );

    if (!license) {
      return {
        isValid: false,
        message: LICENSE_MESSAGES.NOT_FOUND,
      };
    }

    // Check if license is active
    if (license.status !== LICENSE_STATUS.ACTIVE) {
      return {
        isValid: false,
        message: `License is ${license.status}`,
        licenseKey: license,
      };
    }

    // Check if expired
    if (license.expiresAt && new Date() > license.expiresAt) {
      license.status = LICENSE_STATUS.EXPIRED;
      await license.save();
      return {
        isValid: false,
        message: LICENSE_MESSAGES.EXPIRED,
        licenseKey: license,
      };
    }

    // Check if device is activated
    const deviceActivation = license.activationHistory.find(
      (activation: any) =>
        activation.deviceId === deviceId && !activation.deactivatedAt
    );

    if (!deviceActivation) {
      return {
        isValid: false,
        message: "Device not activated for this license",
        licenseKey: license,
      };
    }

    return {
      isValid: true,
      message: "License is valid",
      licenseKey: license,
      remainingActivations: license.maxActivations - license.currentActivations,
    };
  } catch (error) {
    throw error;
  }
};

const deleteLicenseKey = async (id: string): Promise<void> => {
  try {
    const licenseKey = await LicenseKey.findById(id);

    if (!licenseKey) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    await LicenseKey.findByIdAndDelete(id);
  } catch (error) {
    throw error;
  }
};

const getLicenseStats = async (
  filters: { startDate?: Date; endDate?: Date } = {}
) => {
  try {
    const matchQuery: any = {};

    if (filters.startDate || filters.endDate) {
      matchQuery.createdAt = {};
      if (filters.startDate) matchQuery.createdAt.$gte = filters.startDate;
      if (filters.endDate) matchQuery.createdAt.$lte = filters.endDate;
    }

    const stats = await LicenseKey.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLicenses: { $sum: 1 },
          activeLicenses: {
            $sum: {
              $cond: [{ $eq: ["$status", LICENSE_STATUS.ACTIVE] }, 1, 0],
            },
          },
          expiredLicenses: {
            $sum: {
              $cond: [{ $eq: ["$status", LICENSE_STATUS.EXPIRED] }, 1, 0],
            },
          },
          suspendedLicenses: {
            $sum: {
              $cond: [{ $eq: ["$status", LICENSE_STATUS.SUSPENDED] }, 1, 0],
            },
          },
          revokedLicenses: {
            $sum: {
              $cond: [{ $eq: ["$status", LICENSE_STATUS.REVOKED] }, 1, 0],
            },
          },
          totalActivations: { $sum: "$currentActivations" },
          averageActivations: { $avg: "$currentActivations" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalLicenses: 0,
        activeLicenses: 0,
        expiredLicenses: 0,
        suspendedLicenses: 0,
        revokedLicenses: 0,
        totalActivations: 0,
        averageActivations: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};

const extendLicenseKey = async (
  id: string,
  extensionDays: number
): Promise<TLicenseKey> => {
  try {
    const licenseKey = await LicenseKey.findById(id);

    if (!licenseKey) {
      throw new AppError(httpStatus.NOT_FOUND, LICENSE_MESSAGES.NOT_FOUND);
    }

    // Check if license is active
    if (licenseKey.status !== LICENSE_STATUS.ACTIVE) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot extend license. Current status: ${licenseKey.status}`
      );
    }

    // Calculate new expiry date
    const currentExpiry = licenseKey.expiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + extensionDays);

    // Update license key
    licenseKey.expiresAt = newExpiry;
    await licenseKey.save();

    return licenseKey;
  } catch (error) {
    throw error;
  }
};

export const LicenseKeyServices = {
  createLicenseKey,
  getAllLicenseKeys,
  getLicenseKeyById,
  getLicenseKeyByKey,
  getUserLicenseKeys,
  updateLicenseKey,
  activateLicense,
  deactivateLicense,
  validateLicense,
  deleteLicenseKey,
  getLicenseStats,
  extendLicenseKey,
};
