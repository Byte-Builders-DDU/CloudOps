import { Router } from 'express';
import {
  getRecommendations,
  dismissRecommendation,
  previewScaling,
} from '../controllers/scalingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOperatorOrAdmin } from '../middleware/roleMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/recommendations', getRecommendations);
router.post('/preview', previewScaling);
router.post('/dismiss/:id', requireOperatorOrAdmin, dismissRecommendation);

export default router;
