import { Router } from 'express';
import { getResourceMetrics, getAggregatedMetrics } from '../controllers/metricController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/aggregated', getAggregatedMetrics);
router.get('/:resourceId', getResourceMetrics);

export default router;
