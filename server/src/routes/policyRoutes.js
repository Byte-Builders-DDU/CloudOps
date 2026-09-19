import { Router } from 'express';
import {
  getPolicies,
  getPolicyById,
  togglePolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from '../controllers/policyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { resolveWorkspace, requireWorkspaceAdmin } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/', getPolicies);
router.get('/:id', getPolicyById);

// Policy mutations require workspace ADMIN
router.patch('/:id/toggle', requireWorkspaceAdmin, togglePolicy);
router.post('/', requireWorkspaceAdmin, createPolicy);
router.put('/:id', requireWorkspaceAdmin, updatePolicy);
router.delete('/:id', requireWorkspaceAdmin, deletePolicy);

export default router;
