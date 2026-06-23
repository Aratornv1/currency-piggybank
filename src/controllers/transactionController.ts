import type { Request, Response } from 'express';
import * as service from '../services/transactionService';

const parsePositiveAmount = (v: unknown): number | null => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
};

const fail = (res: Response, err: unknown) => {
    const e = err as { status?: number; message?: string };
    res.status(e.status ?? 500).json({ error: e.message ?? 'Внутрішня помилка' });
};

// Спільний обробник для /deposits і /withdrawals: валідує лише формат запиту.
const recordHandler =
    (action: (input: service.RecordInput) => Promise<{ id: number }>) =>
    async (req: Request, res: Response) => {
        const amount = parsePositiveAmount(req.body?.amount);
        const currency = req.body?.currency;
        const date = req.body?.date;

        if (amount === null || typeof currency !== 'string') {
            return res.status(400).json({ error: 'Потрібні amount (> 0) та currency' });
        }

        const input: service.RecordInput = { amount, currency };
        if (typeof date === 'string') input.date = date;

        try {
            res.status(201).json(await action(input));
        } catch (err) {
            fail(res, err);
        }
    };

export const createDeposit = recordHandler(service.deposit);
export const createWithdrawal = recordHandler(service.withdraw);

export const getBalance = async (req: Request, res: Response) => {
    const currency = typeof req.query.currency === 'string' ? req.query.currency : 'USD';
    try {
        res.json(await service.getBalance(currency));
    } catch (err) {
        fail(res, err);
    }
};

export const getTransactions = async (_req: Request, res: Response) => {
    try {
        res.json(await service.getHistory());
    } catch (err) {
        fail(res, err);
    }
};

export const getCurrencies = async (_req: Request, res: Response) => {
    try {
        res.json(await service.listCurrencies());
    } catch (err) {
        fail(res, err);
    }
};
