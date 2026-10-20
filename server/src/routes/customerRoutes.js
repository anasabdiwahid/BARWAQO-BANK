import { Router } from 'express';
import { registerCustomer, searchCustomers, getCustomerDetails } from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { registerCustomerSchema } from '../validators/customerValidator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

// Registration: Employee, Manager, Admin, Super Admin
router.post(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  validate(registerCustomerSchema),
  registerCustomer
);

// Search: All staff
router.get(
  '/',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  searchCustomers
);

// Detail: All staff
router.get(
  '/:id',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  getCustomerDetails
);

export default router;

