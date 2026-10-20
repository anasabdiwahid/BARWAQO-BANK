import { Router } from 'express';
import {
  getSuperAdminDashboard,
  getAdminDashboard,
  getManagerDashboard,
  getEmployeeDashboard,
  getCustomerDashboard,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.get('/super-admin', requireRoles(ROLES.SUPER_ADMIN), getSuperAdminDashboard);
router.get('/admin', requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), getAdminDashboard);
router.get('/manager', requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), getManagerDashboard);
router.get('/employee', requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), getEmployeeDashboard);
router.get('/customer', requireRoles(ROLES.CUSTOMER), getCustomerDashboard);

export default router;

