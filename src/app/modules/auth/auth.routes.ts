import express from "express";
import auth from "../../middlewares/auth";

import { USER_ROLE } from "../User/user.constant";
import { AuthControllers } from "./auth.controller";

const router = express.Router();

router.post(
  "/register",
  //   validateRequest(AuthValidation.registerValidationSchema),
  AuthControllers.registerUser
);

router.post(
  "/social-login",
  //   validateRequest(AuthValidation.socialLoginValidationSchema),
  AuthControllers.socialLogin
);

router.post(
  "/login",
  //   validateRequest(AuthValidation.loginValidationSchema),
  AuthControllers.loginUser
);

router.post(
  "/change-password",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  //   validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthControllers.changePassword
);

router.post(
  "/refresh-token",
  //   validateRequestCookies(AuthValidation.refreshTokenValidationSchema),
  AuthControllers.refreshToken
);
// Add this new route
router.post("/verify-email", AuthControllers.verifyEmail);

router.post("/resend-verification", AuthControllers.resendVerificationEmail);

router.post(
  "/forgot-password",
  //   validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword
);

router.post(
  "/reset-password",
  //   validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthControllers.resetPassword
);

router.get(
  "/me",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.STUDENT, USER_ROLE.TEACHER), // ⬅️ Protect this route with more roles
  AuthControllers.getMyProfile // ⬅️ You will create this controller
);

export const AuthRoutes = router;
