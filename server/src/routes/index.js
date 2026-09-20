import { Router } from 'express';
import authRoutes from './authRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import metricRoutes from './metricRoutes.js';
import scalingRoutes from './scalingRoutes.js';
import costRoutes from './costRoutes.js';
import policyRoutes from './policyRoutes.js';
import auditRoutes from './auditRoutes.js';
import accountRoutes from './accountRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import changeRoutes from './changeRoutes.js';
import copilotRoutes from './copilotRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import runbookRoutes from './runbookRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/resources', resourceRoutes);
router.use('/services', serviceRoutes);
router.use('/metrics', metricRoutes);
router.use('/scaling', scalingRoutes);
router.use('/changes', changeRoutes);
router.use('/copilot', copilotRoutes);
router.use('/costs', costRoutes);
router.use('/policies', policyRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/accounts', accountRoutes);
router.use('/runbooks', runbookRoutes);
router.use('/notifications', notificationRoutes);

// Health probe endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CloudOps API Engine (PRD/DESIGN Compliant)',
    version: '2.0.0',
  });
});

export default router;
