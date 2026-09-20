import { Router } from 'express';
import {
  chatWithCopilot,
  getCopilotThreads,
  getCopilotThread,
  getOperationalBrief,
  recordFeedback,
  getCopilotStatus,
  diagnoseCopilot,
} from '../controllers/copilotController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { resolveWorkspace } from '../middleware/tenantMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(resolveWorkspace);

router.get('/status', getCopilotStatus);
router.post('/diagnose', diagnoseCopilot);
router.post('/chat', chatWithCopilot);
router.get('/threads', getCopilotThreads);
router.get('/threads/:id', getCopilotThread);
router.get('/brief', getOperationalBrief);
router.post('/feedback', recordFeedback);

export default router;
