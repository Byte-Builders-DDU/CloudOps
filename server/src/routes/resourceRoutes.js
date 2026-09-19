import { Router } from 'express';
import {
  getResources,
  getResourceById,
  scaleResource,
  restartResource,
  createResource,
} from '../controllers/resourceController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin, requireOperatorOrAdmin } from '../middleware/roleMiddleware.js';

const router = Router();

// All resource routes require authentication
router.use(authenticate);

router.get('/', getResources);
router.get('/:id', getResourceById);

// Scaling and restart require Operator or Admin
router.post('/:id/scale', requireOperatorOrAdmin, scaleResource);
router.post('/:id/restart', requireOperatorOrAdmin, restartResource);

// Creating resource requires Admin
router.post('/', requireAdmin, createResource);

export default router;
