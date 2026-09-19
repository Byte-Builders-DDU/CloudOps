import { Router } from 'express';
import {
  getRecommendations,
  applyRecommendation,
  dismissRecommendation,
} from '../controllers/scalingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireOperatorOrAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/recommendations', getRecommendations);
router.post('/apply/:id', requireOperatorOrAdmin, applyRecommendation);
router.post('/dismiss/:id', requireOperatorOrAdmin, dismissRecommendation);

export default router;
