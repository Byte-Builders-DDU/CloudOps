import { Router } from 'express';
import { getAccounts, syncAccount, createAccount, deleteAccount } from '../controllers/accountController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOperatorOrAdmin, requireAdmin } from '../middleware/roleMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/', getAccounts);
router.post('/', requireAdmin, createAccount);
router.post('/:id/sync', requireOperatorOrAdmin, syncAccount);
router.delete('/:id', requireAdmin, deleteAccount);

export default router;
