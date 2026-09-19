import { Router } from 'express';
import {
  getCostSummary,
  getCostRecords,
  getBudgetStatus,
  updateBudget,
  getCostArbitrage,
  getRealizedSavings,
} from '../controllers/costController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { resolveWorkspace, requireWorkspaceAdmin } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/summary', getCostSummary);
router.get('/records', getCostRecords);
router.get('/budget', getBudgetStatus);
router.put('/budget', requireWorkspaceAdmin, updateBudget);
router.get('/arbitrage', getCostArbitrage);
router.get('/realized-savings', getRealizedSavings);

export default router;
