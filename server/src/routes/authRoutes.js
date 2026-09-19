import { Router } from 'express';
import { login, register, getMe, getDemoAccounts } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
