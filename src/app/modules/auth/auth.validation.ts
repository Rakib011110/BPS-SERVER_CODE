import { z } from "zod";
import { SOCIAL_PROVIDERS } from "./auth.constant";

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
    }),
    email: z
      .string({
        required_error: "Email is required",
      })
      .email({
        message: "Invalid email address",
      }),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, {
        message: "Password must be at least 6 characters",
      }),
    mobileNumber: z.string({
      required_error: "Mobile number is required",
    }),
    nid: z.string().optional(),
    address: z.string().optional(),
  }),
});

const socialLoginValidationSchema = z.object({
  body: z.object({
    provider: z.enum(
      [
        SOCIAL_PROVIDERS.GOOGLE,
        SOCIAL_PROVIDERS.FACEBOOK,
        SOCIAL_PROVIDERS.GITHUB,
      ],
      {
        required_error: "Social provider is required",
      }
    ),
    accessToken: z.string({
      required_error: "Access token is required",
    }),
    providerId: z.string({
      required_error: "Provider ID is required",
    }),
    email: z.string().email({
      message: "Invalid email address",
    }),
    name: z.string({
      required_error: "Name is required",
    }),
    profilePhoto: z.string().optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email({
        message: "Invalid email address",
      }),
    password: z.string({
      required_error: "Password is required",
    }),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string({
      required_error: "Old password is required",
    }),
    newPassword: z
      .string({
        required_error: "New password is required",
      })
      .min(6, {
        message: "Password must be at least 6 characters",
      }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: "Refresh token is required",
    }),
  }),
});

const verifyEmailValidationSchema = z.object({
  body: z.object({
    token: z.string({
      required_error: "Verification token is required",
    }),
  }),
});

const resendVerificationEmailValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email({
        message: "Invalid email address",
      }),
  }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email({
        message: "Invalid email address",
      }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    token: z.string({
      required_error: "Reset token is required",
    }),
    newPassword: z
      .string({
        required_error: "New password is required",
      })
      .min(6, {
        message: "Password must be at least 6 characters",
      }),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  socialLoginValidationSchema,
  loginValidationSchema,
  changePasswordValidationSchema,
  refreshTokenValidationSchema,
  verifyEmailValidationSchema,
  resendVerificationEmailValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
};
