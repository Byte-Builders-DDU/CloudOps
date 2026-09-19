import { Router } from 'express';
import { getResourceMetrics, getAggregatedMetrics, getResourceForecast } from '../controllers/metricController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/aggregated', getAggregatedMetrics);
router.get('/forecast/:resourceId', getResourceForecast);
router.get('/:resourceId', getResourceMetrics);

export default router;
