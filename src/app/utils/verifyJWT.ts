import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import AppError from '../error/AppError';
import { USER_ROLE, USER_STATUS } from '../modules/User/user.constant';

export const createToken = (
  jwtPayload: {
    _id?: string;
    name: string;
    email: string;
    mobileNumber?: string;
    profilePhoto?: string;
    emailVerified?: any;
    role: keyof typeof USER_ROLE;
    status: keyof typeof USER_STATUS;
    age?: number;
    cvUrl?: string;
    experienceCertificateUrl?: string;
    universityCertificateUrl?: string;
  },
  secret: string,
  expiresIn: any
): string => {
  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(jwtPayload, secret as jwt.Secret, options);
};
export const verifyToken = (
  token: string,
  secret: string
): JwtPayload | Error => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error: any) {
    throw new AppError(401, 'You are not authorized!');
  }
};