import { Router } from 'express';
import { previewTransfer, executeTransfer, getTransferByReference, listTransfers } from '../controllers/transferController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { transferPreviewSchema, executeTransferSchema } from '../validators/transferValidator.js';

const router = Router();

router.use(authenticate);

router.post('/preview', validate(transferPreviewSchema), previewTransfer);
router.post('/execute', validate(executeTransferSchema), executeTransfer);
router.get('/', listTransfers);
router.get('/:reference', getTransferByReference);

export default router;

