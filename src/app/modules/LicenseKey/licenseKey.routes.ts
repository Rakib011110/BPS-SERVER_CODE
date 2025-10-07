import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLE } from "../User/user.constant";
import { LicenseKeyControllers } from "./licenseKey.controller";
import { LicenseKeyValidations } from "./licenseKey.validation";

const router = express.Router();

// Public validation endpoint
router.post(
  "/validate",
  validateRequest(LicenseKeyValidations.validateLicenseValidationSchema),
  LicenseKeyControllers.validateLicense
);

// User endpoints - authenticated users can manage their license keys
router.get(
  "/my-licenses",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER),
  LicenseKeyControllers.getMyLicenseKeys
);

router.post(
  "/activate",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER),
  validateRequest(LicenseKeyValidations.activateLicenseValidationSchema),
  LicenseKeyControllers.activateLicense
);

router.post(
  "/deactivate",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER),
  validateRequest(LicenseKeyValidations.deactivateLicenseValidationSchema),
  LicenseKeyControllers.deactivateLicense
);

router.get(
  "/key/:licenseKey",
  auth(USER_ROLE.USER, USER_ROLE.CUSTOMER, USER_ROLE.ADMIN),
  LicenseKeyControllers.getLicenseKeyByKey
);

// Admin endpoints - full license management
router.post(
  "/",
  auth(USER_ROLE.ADMIN),
  validateRequest(LicenseKeyValidations.createLicenseKeyValidationSchema),
  LicenseKeyControllers.createLicenseKey
);

router.get(
  "/",
  auth(USER_ROLE.ADMIN),
  validateRequest(LicenseKeyValidations.getLicenseKeysValidationSchema),
  LicenseKeyControllers.getAllLicenseKeys
);

router.get(
  "/stats",
  auth(USER_ROLE.ADMIN),
  LicenseKeyControllers.getLicenseStats
);

router.get(
  "/user/:userId",
  auth(USER_ROLE.ADMIN),
  LicenseKeyControllers.getUserLicenseKeys
);

router.get(
  "/:id",
  auth(USER_ROLE.ADMIN),
  LicenseKeyControllers.getLicenseKeyById
);

router.put(
  "/:id",
  auth(USER_ROLE.ADMIN),
  validateRequest(LicenseKeyValidations.updateLicenseKeyValidationSchema),
  LicenseKeyControllers.updateLicenseKey
);

router.delete(
  "/:id",
  auth(USER_ROLE.ADMIN),
  LicenseKeyControllers.deleteLicenseKey
);

export const LicenseKeyRoutes = router;
