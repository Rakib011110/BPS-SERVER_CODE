// src/modules/installmentPlan/installmentPlan.route.ts

import express from 'express';
import {
  listInstallmentPlans,
  createInstallment,
  updateInstallment,
  deleteInstallment,
} from './installmentPlan.controller';

const router = express.Router();

router.get('/', listInstallmentPlans);
router.post('/', createInstallment);
router.put('/:name', updateInstallment);
router.delete('/:name', deleteInstallment);

export const installmentPlanRoutes = router;
