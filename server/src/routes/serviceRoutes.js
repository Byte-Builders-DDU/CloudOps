import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/serviceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  resolveWorkspace,
  requireWorkspaceAdmin,
  requireWorkspaceOperatorOrAdmin,
} from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', requireWorkspaceOperatorOrAdmin, createService);
router.put('/:id', requireWorkspaceOperatorOrAdmin, updateService);
router.delete('/:id', requireWorkspaceAdmin, deleteService);

export default router;
