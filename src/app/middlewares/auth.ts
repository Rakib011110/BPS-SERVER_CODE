import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../utils/catchAsync";
import { USER_ROLE } from "../modules/User/user.constant";
import { User } from "../modules/User/user.model";
import AppError from "../error/AppError";
import config from "../../config";
import { verifyToken } from "../utils/verifyJWT";

const auth = (...requiredRoles: (keyof typeof USER_ROLE)[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;

    // checking if the token is missing
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized!");
    }

    // Extract token from Bearer format
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    const decoded = verifyToken(
      token,
      config.jwt_access_secret as string
    ) as JwtPayload;

    const { role, email, iat } = decoded;

    // checking if the user is exist
    const user = await User.isUserExistsByEmail(email);

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "This user is not found !");
    }

    // checking if the user is already deleted
    const status = user?.status;

    if (status === "BLOCKED") {
      throw new AppError(httpStatus.FORBIDDEN, "This user is blocked !");
    }

    if (
      user.passwordChangedAt &&
      User.isJWTIssuedBeforePasswordChanged(
        user.passwordChangedAt,
        iat as number
      )
    ) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized !");
    }

    // Add user information to the request object
    req.user = {
      ...decoded,
      _id: user._id?.toString() || "",
      id: user._id?.toString() || "",
      email: decoded.email,
      role: decoded.role,
    };

    if (requiredRoles && !requiredRoles.includes(role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    next();
  });
};

// Middleware for optional authentication (for public endpoints that can show different content for authenticated users)
const optionalAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer ")) {
      try {
        token = token.slice(7);
        const decoded = verifyToken(
          token,
          config.jwt_access_secret as string
        ) as JwtPayload;

        const { email } = decoded;
        const user = await User.isUserExistsByEmail(email);

        if (user && user.status !== "BLOCKED") {
          req.user = {
            ...decoded,
            _id: user._id?.toString() || "",
            id: user._id?.toString() || "",
            email: decoded.email,
            role: decoded.role,
          };
        }
      } catch (error) {
        // Silently ignore invalid tokens for optional auth
      }
    }

    next();
  }
);

// Specific role check middlewares
const requireAdmin = auth("ADMIN");
const requireVendor = auth("VENDOR");
const requireCustomer = auth("CUSTOMER");
const requireAdminOrVendor = auth("ADMIN", "VENDOR");
const requireAnyRole = auth("ADMIN", "VENDOR", "CUSTOMER", "USER");

export default auth;
export {
  optionalAuth,
  requireAdmin,
  requireVendor,
  requireCustomer,
  requireAdminOrVendor,
  requireAnyRole,
};
