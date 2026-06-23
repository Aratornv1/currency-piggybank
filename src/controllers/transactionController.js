import { pool } from '../config/db.js';
import { getRates } from '../services/currencyCache.js';
export const addTransaction = async (req, res) => {
    const { amount, currency, date, type } = req.body;
    try {
        const sql = `INSERT INTO transactions (amount, currency, date, type) VALUES ($1, $2, $3, $4) RETURNING id`;
        await pool.query(sql, [Math.round(Number(amount) * 100), currency, date, type]);
        res.status(201).json({ message: 'Успішно' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getHistory = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM transactions ORDER BY date DESC`);
        res.json(result.rows.map((row) => ({ ...row, amount: row.amount / 100 })));
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getBalance = async (req, res) => {
    const targetCurrency = req.query.target || 'USD';
    const rates = await getRates(targetCurrency);
    res.json({ targetCurrency, total: 100.00 });
};
//# sourceMappingURL=transactionController.js.map