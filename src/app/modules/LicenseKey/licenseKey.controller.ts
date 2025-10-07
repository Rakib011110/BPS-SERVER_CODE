import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { LicenseKeyServices } from "./licenseKey.service";
import { LICENSE_MESSAGES } from "./licenseKey.constant";

const createLicenseKey = catchAsync(async (req, res) => {
  const result = await LicenseKeyServices.createLicenseKey(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: LICENSE_MESSAGES.GENERATED,
    data: result,
  });
});

const getAllLicenseKeys = catchAsync(async (req, res) => {
  const result = await LicenseKeyServices.getAllLicenseKeys(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License keys retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getLicenseKeyById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LicenseKeyServices.getLicenseKeyById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License key retrieved successfully!",
    data: result,
  });
});

const getLicenseKeyByKey = catchAsync(async (req, res) => {
  const { licenseKey } = req.params;
  const result = await LicenseKeyServices.getLicenseKeyByKey(licenseKey);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License key retrieved successfully!",
    data: result,
  });
});

const getMyLicenseKeys = catchAsync(async (req, res) => {
  const userId = req.user?._id;
  const result = await LicenseKeyServices.getUserLicenseKeys(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your license keys retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const getUserLicenseKeys = catchAsync(async (req, res) => {
  const { userId } = req.user?._id;
  const result = await LicenseKeyServices.getUserLicenseKeys(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User license keys retrieved successfully!",
    data: result.result,
    meta: result.meta,
  });
});

const updateLicenseKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await LicenseKeyServices.updateLicenseKey(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License key updated successfully!",
    data: result,
  });
});

const activateLicense = catchAsync(async (req, res) => {
  const result = await LicenseKeyServices.activateLicense(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: LICENSE_MESSAGES.ACTIVATED,
    data: result,
  });
});

const deactivateLicense = catchAsync(async (req, res) => {
  const result = await LicenseKeyServices.deactivateLicense(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: LICENSE_MESSAGES.DEACTIVATED,
    data: result,
  });
});

const validateLicense = catchAsync(async (req, res) => {
  const { licenseKey, deviceId } = req.body;
  const result = await LicenseKeyServices.validateLicense(licenseKey, deviceId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License validation completed!",
    data: result,
  });
});

const deleteLicenseKey = catchAsync(async (req, res) => {
  const { id } = req.params;
  await LicenseKeyServices.deleteLicenseKey(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License key deleted successfully!",
    data: null,
  });
});

const getLicenseStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filters: any = {};

  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const result = await LicenseKeyServices.getLicenseStats(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "License statistics retrieved successfully!",
    data: result,
  });
});

export const LicenseKeyControllers = {
  createLicenseKey,
  getAllLicenseKeys,
  getLicenseKeyById,
  getLicenseKeyByKey,
  getMyLicenseKeys,
  getUserLicenseKeys,
  updateLicenseKey,
  activateLicense,
  deactivateLicense,
  validateLicense,
  deleteLicenseKey,
  getLicenseStats,
};
