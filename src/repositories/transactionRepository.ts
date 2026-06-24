import { pool } from '../config/db';

export type TxType = 'deposit' | 'withdrawal';

export interface TransactionRow {
    id: number;
    amount: number; // у валюті операції (напр. 200.00)
    currency: string;
    type: TxType;
    date: string;
    created_at: string;
}

export interface NewTransaction {
    amount: number;
    currency: string;
    type: TxType;
    date: string; // 'YYYY-MM-DD'
}

export interface CurrencyNet {
    currency: string;
    net: number; // sum(deposit) - sum(withdrawal) у валюті операції
}

export const insertTransaction = async (tx: NewTransaction): Promise<number> => {
    const sql = `INSERT INTO transactions (amount, currency, type, date)
                 VALUES ($1, $2, $3, $4) RETURNING id`;
    const { rows } = await pool.query(sql, [tx.amount, tx.currency, tx.type, tx.date]);
    return rows[0].id;
};

export const findAllTransactions = async (): Promise<TransactionRow[]> => {
    const { rows } = await pool.query(
        `SELECT id, amount, currency, type, date, created_at
         FROM transactions
         ORDER BY date DESC, id DESC`,
    );
    // pg повертає NUMERIC як рядок — приводимо amount до числа
    return rows.map((r: any) => ({ ...r, amount: Number(r.amount) }));
};

export const netByCurrency = async (): Promise<CurrencyNet[]> => {
    const { rows } = await pool.query(
        `SELECT currency,
                SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) AS net
         FROM transactions
         GROUP BY currency`,
    );
    // pg повертає SUM(numeric) як рядок — приводимо до числа
    return rows.map((r: { currency: string; net: string }) => ({
        currency: r.currency,
        net: Number(r.net),
    }));
};
