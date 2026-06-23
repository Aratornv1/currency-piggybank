import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
});

// Створює таблицю транзакцій, якщо її ще немає.
export const initDb = async (): Promise<void> => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id          SERIAL PRIMARY KEY,
            amount      BIGINT NOT NULL CHECK (amount >= 0),
            currency    TEXT NOT NULL,
            type        TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
            date        DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);
};
