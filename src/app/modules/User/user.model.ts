/* eslint-disable no-useless-escape */
import bcryptjs from "bcryptjs";
import mongoose, { Schema, model } from "mongoose";
import { USER_ROLE, USER_STATUS } from "./user.constant";
import { IUserModel, TUser } from "./user.interface";
import config from "../../../config";

const userSchema = new Schema<TUser, IUserModel>(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.keys(USER_ROLE),
      required: true,
    },
    email: {
      type: String,
      required: true,
      //validate email
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    status: {
      type: String,
      enum: Object.keys(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    passwordChangedAt: {
      type: Date,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    nid: {
      type: String,
      required: false,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    // email verify
    emailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      select: true,
    },
    emailVerificationTokenExpires: {
      type: Date,
      select: true,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },

    // Social login fields
    socialLogins: [
      {
        provider: {
          type: String,
          enum: ["GOOGLE", "FACEBOOK", "GITHUB"],
        },
        providerId: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        connectedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Course purchase and payment

    // Address
    address: { type: String },

    // New fields for membership application
    age: { type: Number },
    cvUrl: { type: String },
    experienceCertificateUrl: { type: String },
    universityCertificateUrl: { type: String },

    // Academic Qualifications
    degreeType: { type: String },
    universityName: { type: String },
    degreeTitle: { type: String },

    // Previous Job Experience
    jobExperiences: [
      {
        organizationName: { type: String, required: true },
        startDate: { type: String, required: true },
        position: { type: String, required: true },
        endDate: { type: String },
      },
    ],

    // IEB Membership
    iebNo: { type: String },

    // Professional Affiliation / Recognition
    affiliationTitle: { type: String },
    affiliationInstitution: { type: String },
    affiliationStartDate: { type: Date },
    affiliationValidTill: { type: Date },
    affiliationDocument: { type: String },

    // BASE Membership ID (generated after approval)
    membershipId: { type: String, unique: true, sparse: true },
  },

  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  // only hash when password was created or changed
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcryptjs.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

// set '' after saving password
userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  return await User.findOne({ email }).select("+password");
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword
) {
  return await bcryptjs.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: number,
  jwtIssuedTimestamp: number
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, IUserModel>("User", userSchema);
