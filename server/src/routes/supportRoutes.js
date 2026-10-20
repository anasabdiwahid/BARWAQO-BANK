import { Router } from 'express';
import { createTicket, getTickets, getTicketById, addTicketMessage, updateTicketStatus } from '../controllers/supportController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roleCheck.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.use(authenticate);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/:id/messages', addTicketMessage);
router.patch(
  '/:id/status',
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
  updateTicketStatus
);

export default router;

