// src/modules/installmentPlan/installmentPlan.controller.ts

import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import sendResponse from '../../../utils/sendResponse';
import { createInstallmentPlan, deleteInstallmentPlan, listActiveInstallmentPlans, updateInstallmentPlan } from './installmentPlan.services';


export const listInstallmentPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await listActiveInstallmentPlans();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Installment plans fetched',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const createInstallment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createInstallmentPlan(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Plan created',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateInstallment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await updateInstallmentPlan(req.params.name, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Plan updated',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteInstallment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteInstallmentPlan(req.params.name);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Plan deleted',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
