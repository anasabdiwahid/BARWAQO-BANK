import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getAuditLogs
);

export default router;

