import { Router } from 'express';
import {
    createDeposit,
    createWithdrawal,
    getBalance,
    getTransactions,
    getCurrencies,
} from '../controllers/transactionController';

const router = Router();

router.post('/deposits', createDeposit);
router.post('/withdrawals', createWithdrawal);
router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.get('/currencies', getCurrencies);

export default router;
