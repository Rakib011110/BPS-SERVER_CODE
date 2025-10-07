import { User } from "./user.model";
import { TUser } from "./user.interface";
import { createToken } from "../../utils/verifyJWT";
import config from "../../../config";
import bcrypt from "bcrypt";
import AppError from "../../error/AppError";
import httpStatus from "http-status";
import { USER_STATUS, USER_ROLE } from "./user.constant";

const createUserIntoDB = async (payload: TUser) => {
  try {
    const newUser = await User.create(payload);
    return newUser;
  } catch (error) {
    throw error;
  }
};

const getAllUsersFromDb = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    throw error;
  }
};

const getAUserFromDb = async (id: string) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw error;
  }
};

const updpateUserInDb = async (id: string, payload: Partial<TUser>) => {
  try {
    const user = await User.findByIdAndUpdate(id, payload, { new: true });
    if (!user) {
      throw new Error("User not found");
    }

    // Generate new JWT with updated user data
    const jwtPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      profilePhoto: user.profilePhoto,
      age: user.age,
      cvUrl: user.cvUrl,
      experienceCertificateUrl: user.experienceCertificateUrl,
      universityCertificateUrl: user.universityCertificateUrl,
      degreeType: user.degreeType,
      universityName: user.universityName,
      degreeTitle: user.degreeTitle,
      jobExperiences: user.jobExperiences,
      membershipId: user.membershipId,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string
    );

    return {
      user,
      accessToken,
    };
  } catch (error) {
    throw error;
  }
};

const deleteUserFromDb = async (id: string) => {
  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new Error("User not found");
    }
    return deletedUser;
  } catch (error) {
    throw error;
  }
};

const updateUserStatus = async (
  id: string,
  status: keyof typeof USER_STATUS
) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    user.status = status;
    await user.save();

    return user;
  } catch (error) {
    throw error;
  }
};

const updateUserRole = async (id: string, role: keyof typeof USER_ROLE) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    user.role = role;
    await user.save();

    return user;
  } catch (error) {
    throw error;
  }
};

const adminResetPassword = async (id: string, newPassword: string) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // Hash the new password
    const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return {
      message: "Password reset successfully",
      userId: user._id,
    };
  } catch (error) {
    throw error;
  }
};

export const UserServices = {
  createUserIntoDB,
  getAllUsersFromDb,
  getAUserFromDb,
  updpateUserInDb,
  deleteUserFromDb,
  updateUserStatus,
  updateUserRole,
  adminResetPassword,
};
