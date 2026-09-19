import { Router } from 'express';
import { getServices, getServiceById } from '../controllers/serviceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/', getServices);
router.get('/:id', getServiceById);

export default router;
