import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUserStatus } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserStatusSchema } from '../validators/userValidator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Staff management endpoints
router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  validate(createUserSchema),
  createUser
);

router.get(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  getUsers
);

router.get(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  getUserById
);

router.patch(
  '/:id/status',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
  validate(updateUserStatusSchema),
  updateUserStatus
);

export default router;

