import express from 'express';
import sqlite3 from 'sqlite3';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ініціалізація бази даних SQLite
const db = new sqlite3.Database('./piggybank.db', (err) => {
    if (err) console.error('БД error:', err.message);
    else console.log('База даних SQLite готова.');
});

// Створення таблиці
db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT CHECK(type IN ('deposit', 'withdrawal')) NOT NULL
    )
`);

// 1. Додати / забрати гроші
app.post('/api/transactions', (req, res) => {
    const { amount, currency, date, type } = req.body;
    if (!amount || !currency || !date || !type) {
        return res.status(400).json({ error: 'Всі поля обовʼязкові' });
    }
    const sql = `INSERT INTO transactions (amount, currency, date, type) VALUES (?, ?, ?, ?)`;
    db.run(sql, [amount, currency, date, type], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, message: 'Успішно додано' });
    });
});

// 2. Отримати історію
app.get('/api/transactions', (req, res) => {
    db.all(`SELECT * FROM transactions ORDER BY date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Підрахунок балансу 
app.get('/api/balance', (req, res) => {
    const targetCurrency = req.query.target || 'USD';

    db.all(`SELECT amount, currency, type FROM transactions`, [], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        try {
            const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${targetCurrency}`);
            if (!response.ok) throw new Error('Помилка АПІ курсів валют');
            
            const data = await response.json();
            const rates = data.rates;
            let total = 0;

            for (let tx of rows) {
                let amountInTarget = 0;
                if (tx.currency === targetCurrency) {
                    amountInTarget = tx.amount;
                } else if (rates[tx.currency]) {
                    amountInTarget = tx.amount / rates[tx.currency];
                } else {
                    continue;
                }

                if (tx.type === 'deposit') total += amountInTarget;
                else if (tx.type === 'withdrawal') total -= amountInTarget;
            }

            res.json({ targetCurrency, total: Number(total.toFixed(2)) });
        } catch (apiError) {
            res.status(500).json({ error: apiError.message });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Сервер працює: http://localhost:${PORT}`);
});