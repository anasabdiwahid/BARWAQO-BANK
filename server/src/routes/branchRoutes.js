import { Router } from 'express';
import { getBranches, createBranch } from '../controllers/branchController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Publicly or authenticated: anyone can get branches for selection
router.get('/', getBranches);

router.post(
  '/',
  authenticate,
  requireRoles(ROLES.SUPER_ADMIN),
  createBranch
);

export default router;

