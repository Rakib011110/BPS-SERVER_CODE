import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../User/user.constant";
import validateRequest from "../../middlewares/validateRequest";
import { DigitalDownloadController } from "./digitalDownload.controller";
import { DigitalDownloadValidation } from "./digitalDownload.validation";

const router = express.Router();

// Public route for processing downloads (no auth needed, token-based)
router.get("/download/:token", DigitalDownloadController.processDownload);

// Public route for serving secure files (no auth needed, token-based)
router.get("/file/:fileToken", DigitalDownloadController.serveSecureFile);

// Protected routes - require authentication
router.post(
  "/generate-token",
  auth(USER_ROLE.CUSTOMER, USER_ROLE.USER),
  validateRequest(DigitalDownloadValidation.generateTokenValidation),
  DigitalDownloadController.generateDownloadToken
);

router.get(
  "/my-downloads",
  auth(USER_ROLE.CUSTOMER, USER_ROLE.USER),
  DigitalDownloadController.getUserDownloads
);

// Admin routes
router.get(
  "/admin/all",
  auth(USER_ROLE.ADMIN),
  DigitalDownloadController.getAllDownloads
);

router.patch(
  "/admin/revoke/:downloadId",
  auth(USER_ROLE.ADMIN),
  DigitalDownloadController.revokeDownloadAccess
);

router.patch(
  "/admin/regenerate/:downloadId",
  auth(USER_ROLE.ADMIN),
  validateRequest(DigitalDownloadValidation.regenerateTokenValidation),
  DigitalDownloadController.regenerateDownloadToken
);

router.delete(
  "/admin/cleanup",
  auth(USER_ROLE.ADMIN),
  DigitalDownloadController.cleanupExpiredDownloads
);

export const DigitalDownloadRoutes = router;
