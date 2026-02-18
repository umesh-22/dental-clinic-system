import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/download', documentController.downloadDocument);
router.delete('/:id', documentController.deleteDocument);

export default router;
