import mongoose, { Schema } from 'mongoose';
import { IInstallmentPlan } from './installmentPlan.interfaces';

const installmentPlanSchema = new Schema<IInstallmentPlan>({
  name: { type: String,  unique: true },
  installments: { type: Number,  },
  discountPercent: { type: Number, },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const InstallmentPlan = mongoose.model<IInstallmentPlan>(
  'InstallmentPlan',
  installmentPlanSchema
);
