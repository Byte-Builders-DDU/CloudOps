import { Router } from 'express';
import {
  previewChange,
  submitChange,
  getChanges,
  approveChange,
  rejectChange,
  getOperationTimeline,
  getChangeOutcomeController,
} from '../controllers/changeController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.post('/preview', previewChange);
router.post('/submit', submitChange);
router.get('/', getChanges);
router.post('/:id/approve', approveChange);
router.post('/:id/reject', rejectChange);
router.get('/:id/operations', getOperationTimeline);
router.get('/:id/outcome', getChangeOutcomeController);

export default router;
