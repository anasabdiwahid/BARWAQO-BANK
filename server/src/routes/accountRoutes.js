import { Router } from 'express';
import { getAccountByNumber, getAccountTransactions, getAccountStatement } from '../controllers/accountController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/:accountNumber', getAccountByNumber);
router.get('/:accountNumber/transactions', getAccountTransactions);
router.get('/:accountNumber/statement', getAccountStatement);

export default router;

