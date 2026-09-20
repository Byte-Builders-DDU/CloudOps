import { Router } from 'express';
import {
  getAccounts,
  syncAccount,
  createAccount,
  deleteAccount,
  getAzureConnectorStatus,
  diagnoseAzureConnector,
  getAwsConnectorStatus,
  diagnoseAwsConnector,
} from '../controllers/accountController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOperatorOrAdmin, requireAdmin } from '../middleware/roleMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/azure/status', getAzureConnectorStatus);
router.post('/azure/diagnose', requireOperatorOrAdmin, diagnoseAzureConnector);
router.get('/aws/status', getAwsConnectorStatus);
router.post('/aws/diagnose', requireOperatorOrAdmin, diagnoseAwsConnector);
router.get('/', getAccounts);
router.post('/', requireAdmin, createAccount);
router.post('/:id/sync', requireOperatorOrAdmin, syncAccount);
router.delete('/:id', requireAdmin, deleteAccount);

export default router;
