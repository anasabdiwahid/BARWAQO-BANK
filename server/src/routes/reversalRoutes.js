import { Router } from 'express';
import { requestReversal, listReversals, reviewReversal } from '../controllers/reversalController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { requestReversalSchema, reviewReversalSchema } from '../validators/reversalValidator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Staff and authorized users can submit reversal requests
router.post(
  '/request',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  validate(requestReversalSchema),
  requestReversal
);

router.get(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  listReversals
);

// Review & execute: Manager, Admin, Super Admin
router.post(
  '/:id/review',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  validate(reviewReversalSchema),
  reviewReversal
);

export default router;

