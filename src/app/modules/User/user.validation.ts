import { z } from 'zod';
import { USER_ROLE, USER_STATUS } from './user.constant';

const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }),
    role: z.enum([...Object.keys(USER_ROLE)] as [string, ...string[]]),
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Invalid email address',
      }),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(6, {
        message: 'Password must be at least 6 characters',
      }),
    mobileNumber: z.string({
      required_error: 'Mobile number is required',
    }),
    nid: z.string().optional(),
    profilePhoto: z.string().optional(),
    address: z.string().optional(),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    role: z.enum([...Object.keys(USER_ROLE)] as [string, ...string[]]).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    status: z.enum([...Object.keys(USER_STATUS)] as [string, ...string[]]).optional(),
    mobileNumber: z.string().optional(),
    nid: z.string().optional(),
    profilePhoto: z.string().optional(),
    address: z.string().optional(),
    age: z.number().optional(),
    cvUrl: z.string().optional(),
    experienceCertificateUrl: z.string().optional(),
    universityCertificateUrl: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
