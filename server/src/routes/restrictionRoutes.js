import { Router } from 'express';
import { createRestriction, listRestrictions, releaseRestriction } from '../controllers/restrictionController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { createRestrictionSchema, releaseRestrictionSchema } from '../validators/restrictionValidator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Applying restrictions: Staff only
router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  validate(createRestrictionSchema),
  createRestriction
);

router.get(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  listRestrictions
);

// Releasing restrictions: Manager, Admin, Super Admin
router.post(
  '/:id/release',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  validate(releaseRestrictionSchema),
  releaseRestriction
);

export default router;

