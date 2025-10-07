// src/modules/installmentPlan/installmentPlan.service.ts

import { IInstallmentPlan } from './installmentPlan.interfaces';
import { InstallmentPlan } from './installmentPlan.model';

export const listActiveInstallmentPlans = async (): Promise<IInstallmentPlan[]> => {
  return InstallmentPlan.find({ isActive: true }).sort('installments');
};

export const createInstallmentPlan = async (data: Partial<IInstallmentPlan>) => {
  return InstallmentPlan.create(data);
};

export const updateInstallmentPlan = async (name: string, data: Partial<IInstallmentPlan>) => {
  return InstallmentPlan.findOneAndUpdate({ name }, data, { new: true });
};

export const deleteInstallmentPlan = async (name: string) => {
  return InstallmentPlan.findOneAndDelete({ name });
};
