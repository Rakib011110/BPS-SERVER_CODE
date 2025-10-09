import express from "express";
import { UserControllers } from "./user.controller";
import {
  uploadProfilePhoto,
  uploadProfileFiles,
} from "../../../lib/multer/multer";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "./user.constant";

const router = express.Router();

// Admin only routes
router.post("/create-user", auth(USER_ROLE.ADMIN), UserControllers.createUsers);
router.get("/", auth(USER_ROLE.ADMIN), UserControllers.getAllUsers);
router.get("/:id", auth(USER_ROLE.ADMIN), UserControllers.getAUser);
router.put(
  "/:id",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  uploadProfileFiles,
  UserControllers.updateUser
);
router.post(
  "/:id/upload-profile-photo",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  uploadProfilePhoto.single("profilePhoto"),
  UserControllers.uploadProfilePhoto
);
router.delete("/:id", auth(USER_ROLE.ADMIN), UserControllers.deleteUser);

// Admin user management specific routes
router.put(
  "/:id/status",
  auth(USER_ROLE.ADMIN),
  UserControllers.updateUserStatus
);
router.put("/:id/role", auth(USER_ROLE.ADMIN), UserControllers.updateUserRole);
router.post(
  "/:id/reset-password",
  auth(USER_ROLE.ADMIN),
  UserControllers.adminResetPassword
);

export const UserRoutes = router;
