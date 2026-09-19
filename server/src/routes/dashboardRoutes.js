import { Router } from 'express';
import {
  getDashboardSummary,
  getDashboardTraffic,
  getDashboardResourceHealth,
  getDashboardCostOverview,
  getDashboardProviderDistribution,
  getDashboardRecommendations,
  getDashboardActivity,
  getDashboardAlerts,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// All dashboard endpoints require valid authentication
router.use(authenticate);

router.get('/summary', getDashboardSummary);
router.get('/traffic', getDashboardTraffic);
router.get('/resource-health', getDashboardResourceHealth);
router.get('/cost-overview', getDashboardCostOverview);
router.get('/provider-distribution', getDashboardProviderDistribution);
router.get('/recommendations', getDashboardRecommendations);
router.get('/activity', getDashboardActivity);
router.get('/alerts', getDashboardAlerts);

export default router;
