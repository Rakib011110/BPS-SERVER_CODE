import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import { createToken } from "../../utils/verifyJWT";
import { USER_ROLE } from "../User/user.constant";
import { TLoginUser, TRegisterUser } from "./auth.interface";
import AppError from "../../error/AppError";
import config from "../../../config";
import { User } from "../User/user.model";
import axios from "axios";

import crypto from "crypto";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../../utils/emailSender";
import { TUser } from "../User/user.interface";
import { TForgotPassword, TResetPassword } from "./auth.interface";
import { TSocialProvider } from "./auth.constant";

// Add this to your existing imports

// Update your registerUser function to include email verification
export const registerUser = async (payload: TRegisterUser) => {
  const existingUser = await User.isUserExistsByEmail(payload.email);

  // 1. If user exists and already verified
  if (existingUser) {
    if (existingUser.emailVerified === true) {
      throw new AppError(
        httpStatus.CONFLICT,
        "This user already exists and is verified."
      );
    }

    if (existingUser.emailVerified === false) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This user already exists but is not verified. Please check your email."
      );
    }
  }

  // 2. Proceed to register new user
  payload.role = USER_ROLE.USER;

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newUser = await User.create({
    ...payload,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpires: verificationTokenExpires,
  });

  await sendVerificationEmail(newUser.email, verificationToken);

  const jwtPayload = {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    mobileNumber: newUser.mobileNumber,
    role: newUser.role,
    status: newUser.status,
    emailVerified: newUser.emailVerified,
    age: newUser.age,
    cvUrl: newUser.cvUrl,
    experienceCertificateUrl: newUser.experienceCertificateUrl,
    universityCertificateUrl: newUser.universityCertificateUrl,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      emailVerified: newUser.emailVerified,
    },
  };
};
// Add this new function for email verification
const verifyEmail = async (token: string) => {
  // Find user with this token and check expiration
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired token");
  }
  // Check if already verified
  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified.");
  }
  // Check if token is expired
  if (
    user.emailVerificationTokenExpires &&
    user.emailVerificationTokenExpires < new Date()
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Verification token has expired."
    );
  }

  // Update user to mark email as verified
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save();

  return {
    message: "Email verified successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  };
};

const loginUser = async (payload: TLoginUser) => {
  const user = await User.isUserExistsByEmail(payload?.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const userStatus = user?.status;

  if (userStatus === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
  }

  //checking if the password is correct

  if (!(await User.isPasswordMatched(payload?.password, user?.password)))
    throw new AppError(httpStatus.FORBIDDEN, "Password do not matched");

  const jwtPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    emailVerified: user.emailVerified,
    status: user.status,
    age: user.age,
    cvUrl: user.cvUrl,
    experienceCertificateUrl: user.experienceCertificateUrl,
    universityCertificateUrl: user.universityCertificateUrl,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await User.isUserExistsByEmail(userData.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const userStatus = user?.status;

  if (userStatus === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
  }

  if (!(await User.isPasswordMatched(payload.oldPassword, user?.password)))
    throw new AppError(httpStatus.FORBIDDEN, "Password do not matched");

  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findOneAndUpdate(
    {
      email: userData.email,
      role: userData.role,
    },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    }
  );

  return null;
};

const refreshToken = async (token: string) => {
  // checking if the given token is valid
  const decoded = jwt.verify(
    token,
    config.jwt_refresh_secret as string
  ) as JwtPayload;

  const { email, iat } = decoded;

  // checking if the user is exist
  const user = await User.isUserExistsByEmail(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
  }

  if (
    user.passwordChangedAt &&
    User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized !");
  }

  const jwtPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    mobileNumber: user.mobileNumber,
    role: user.role,
    status: user.status,
    age: user.age,
    cvUrl: user.cvUrl,
    experienceCertificateUrl: user.experienceCertificateUrl,
    universityCertificateUrl: user.universityCertificateUrl,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
  };
};

const resendVerificationEmail = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
  }

  // Generate new token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Update user with new token
  user.emailVerificationToken = verificationToken;
  user.emailVerificationTokenExpires = verificationTokenExpires;
  await user.save();

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken);

  return {
    message: "Verification email resent successfully",
  };
};

const getMyProfile = async (userId: string): Promise<TUser | null> => {
  const user = await User.findById(userId);
  return user;
};

const forgotPassword = async (payload: TForgotPassword) => {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found with this email");
  }

  // Check if user is blocked
  if (user.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
  }

  // Generate password reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Update user with reset token
  user.passwordResetToken = resetToken;
  user.passwordResetTokenExpires = resetTokenExpires;
  await user.save();

  // Send password reset email
  await sendPasswordResetEmail(user.email, resetToken);

  return {
    message: "Password reset email sent successfully",
  };
};

const resetPassword = async (payload: TResetPassword) => {
  // Find user with this token and check expiration
  const user = await User.findOne({
    passwordResetToken: payload.token,
    passwordResetTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired password reset token"
    );
  }

  // Set the new password - the pre('save') middleware will hash it automatically
  user.password = payload.newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = new Date();

  // Save the user - this will trigger the pre('save') middleware to hash the password
  await user.save();

  return {
    message: "Password reset successfully",
  };
};

// Social Login Service
interface TSocialLoginPayload {
  provider: TSocialProvider;
  accessToken: string;
  providerId: string;
  email: string;
  name: string;
  profilePhoto?: string;
}

const socialLogin = async (payload: TSocialLoginPayload) => {
  const { provider, accessToken, providerId, email, name, profilePhoto } =
    payload;

  // Verify the access token with the respective provider
  let isValidToken = false;
  let providerUserData: any = null;

  try {
    switch (provider) {
      case "GOOGLE":
        const googleResponse = await axios.get(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
        );
        providerUserData = googleResponse.data;
        isValidToken =
          providerUserData.id === providerId &&
          providerUserData.email === email;
        break;

      case "FACEBOOK":
        const facebookResponse = await axios.get(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );
        providerUserData = facebookResponse.data;
        isValidToken =
          providerUserData.id === providerId &&
          providerUserData.email === email;
        break;

      case "GITHUB":
        const githubResponse = await axios.get(`https://api.github.com/user`, {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        });
        providerUserData = githubResponse.data;
        isValidToken = providerUserData.id.toString() === providerId;
        break;

      default:
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Unsupported social provider"
        );
    }
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid social login token");
  }

  if (!isValidToken) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid social login credentials"
    );
  }

  // Check if user exists with this email
  let user = await User.findOne({ email });

  if (user) {
    // Check if this social login is already connected
    const existingSocialLogin = user.socialLogins?.find(
      (login) => login.provider === provider && login.providerId === providerId
    );

    if (!existingSocialLogin) {
      // Add new social login to existing user
      user.socialLogins = user.socialLogins || [];
      user.socialLogins.push({
        provider,
        providerId,
        email,
        connectedAt: new Date(),
      });
      await user.save();
    }
  } else {
    // Create new user with social login
    user = await User.create({
      name,
      email,
      role: USER_ROLE.USER,
      emailVerified: true, // Social logins are pre-verified
      profilePhoto: profilePhoto || null,
      password: crypto.randomBytes(32).toString("hex"), // Random password for social users
      mobileNumber: "", // Will be updated later by user
      socialLogins: [
        {
          provider,
          providerId,
          email,
          connectedAt: new Date(),
        },
      ],
    });
  }

  // Generate JWT tokens
  const jwtPayload = {
    _id: user._id?.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    profilePhoto: user.profilePhoto,
    emailVerified: user.emailVerified,
    mobileNumber: user.mobileNumber,
  };

  const accessToken_jwt = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken: accessToken_jwt,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
    },
  };
};

export const AuthServices = {
  registerUser,
  socialLogin,
  loginUser,
  changePassword,
  refreshToken,
  verifyEmail,
  resendVerificationEmail,
  getMyProfile,
  forgotPassword,
  resetPassword,
};
