import { Router } from 'express';
import { getRunbooks, getRunbookById, createRunbook, updateRunbook } from '../controllers/runbookController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/', getRunbooks);
router.get('/:id', getRunbookById);
router.post('/', requireAdmin, createRunbook);
router.put('/:id', requireAdmin, updateRunbook);

export default router;
