import { Router } from 'express';
import { getCostSummary, getCostRecords } from '../controllers/costController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getCostSummary);
router.get('/records', getCostRecords);

export default router;
