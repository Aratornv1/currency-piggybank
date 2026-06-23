
import type { Request, Response } from 'express';
import { pool } from '../config/db.js';
import { getRates } from '../services/currencyCache.js';

export const addTransaction = async (req: Request, res: Response) => {
    const { amount, currency, date, type } = req.body;
    try {
        const sql = `INSERT INTO transactions (amount, currency, date, type) VALUES ($1, $2, $3, $4) RETURNING id`;
        await pool.query(sql, [Math.round(Number(amount) * 100), currency, date, type]);
        res.status(201).json({ message: 'Успішно' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM transactions ORDER BY date DESC`);
        res.json(result.rows.map((row: any) => ({ ...row, amount: row.amount / 100 })));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getBalance = async (req: Request, res: Response) => {
    const targetCurrency = req.query.target || 'USD';
    const rates = await getRates(targetCurrency as string);
    res.json({ targetCurrency, total: 100.00 });
};