import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', inventoryController.createInventoryItem);
router.get('/', inventoryController.getInventoryItems);
router.get('/low-stock', inventoryController.getLowStockItems);
router.get('/:id', inventoryController.getInventoryItemById);
router.put('/:id', inventoryController.updateInventoryItem);
router.post('/:id/transaction', inventoryController.createTransaction);

export default router;
