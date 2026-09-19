import { Router } from 'express';
import {
  getPolicies,
  togglePolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from '../controllers/policyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getPolicies);

// Policy mutations require ADMIN
router.patch('/:id/toggle', requireAdmin, togglePolicy);
router.post('/', requireAdmin, createPolicy);
router.put('/:id', requireAdmin, updatePolicy);
router.delete('/:id', requireAdmin, deletePolicy);

export default router;
