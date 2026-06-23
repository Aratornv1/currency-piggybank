import { Router } from 'express';
import { addTransaction, getHistory, getBalance } from '../controllers/transactionController.js';
const router = Router();
router.post('/transactions', addTransaction);
router.get('/transactions', getHistory);
router.get('/balance', getBalance);
export default router;
//# sourceMappingURL=api.js.map