import { USER_ROLE } from '../User/user.constant';



export type TVerifyEmail = {
  token: string;
};

export type TLoginUser = {
  email: string;
  password: string;
};


export type TRegisterUser = {
  name: string;
  email: string;
  mobileNumber: string;
  nid?: string;
  password: string;
  role: keyof typeof USER_ROLE;
  address?: string;
};

export type TForgotPassword = {
  email: string;
};

export type TResetPassword = {
  token: string;
  newPassword: string;
};