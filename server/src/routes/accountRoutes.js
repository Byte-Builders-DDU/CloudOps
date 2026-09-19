import { Router } from 'express';
import { getAccounts, syncAccount } from '../controllers/accountController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOperatorOrAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAccounts);
router.post('/:id/sync', requireOperatorOrAdmin, syncAccount);

export default router;
