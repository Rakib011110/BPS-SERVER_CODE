/* eslint-disable no-unused-vars */
import { Model } from "mongoose";
import { USER_ROLE, USER_STATUS } from "./user.constant";
import { TSocialProvider } from "../auth/auth.constant";

export type TUser = {
  isPasswordMatch(password: string): unknown;
  _id?: string;
  name: string;
  role: keyof typeof USER_ROLE;
  email: string;
  password: string;
  status: keyof typeof USER_STATUS;
  passwordChangedAt?: Date;
  mobileNumber?: string;
  nid?: string;
  profilePhoto?: string;

  // verify
  emailVerified?: any;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;

  // Password reset fields
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;

  // Social login fields
  socialLogins?: Array<{
    provider: TSocialProvider;
    providerId: string;
    email: string;
    connectedAt: Date;
  }>;

  // Address (simple string field)
  address?: string;

  // New fields for membership application
  age?: number;
  cvUrl?: string;
  experienceCertificateUrl?: string;
  universityCertificateUrl?: string;

  // Academic Qualifications
  degreeType?: string;
  universityName?: string;
  degreeTitle?: string;

  // Previous Job Experience
  jobExperiences?: {
    organizationName: string;
    startDate: string; // dd-mm-yyyy format
    position: string;
    endDate?: string; // dd-mm-yyyy format or 'Present'
  }[];

  // IEB Membership
  iebNo?: string;

  // Professional Affiliation / Recognition
  affiliationTitle?: string;
  affiliationInstitution?: string;
  affiliationStartDate?: Date;
  affiliationValidTill?: Date;
  affiliationDocument?: string;

  // BASE Membership ID (generated after approval)
  membershipId?: string;

  createdAt?: Date;
  updatedAt?: Date;
};

export interface IUserModel extends Model<TUser> {
  isUserExistsByEmail(id: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number
  ): boolean;
}
