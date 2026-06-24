# 🐷 Мультивалютна Копілка (currency-piggybank)

Невеликий вебзастосунок для обліку грошей у різних валютах: можна класти й знімати кошти, а загальний баланс перераховується в обрану валюту за реальним курсом ЄЦБ.

---

## Стек технологій

| Шар          | Технологія                                                                |
| ------------ | ------------------------------------------------------------------------- |
| Бекенд       | Node.js + Express                                                         |
| Мова         | TypeScript (запуск через `tsx`, без компіляції в `.js`)                   |
| База даних   | PostgreSQL (драйвер `pg`)                                                 |
| Курси валют  | [Frankfurter API](https://www.frankfurter.app/) (безкоштовний, без ключа) |
| Фронтенд     | HTML + Tailwind (CDN) + TypeScript, збирається через `esbuild`            |
| Форматування | Prettier                                                                  |

---

## Архітектура

Бекенд побудований шарами — кожен шар знає лише про сусідній знизу:

```
Браузер (src/frontend/app.ts)
   │  HTTP (fetch)
   ▼
routes/api.ts            маршрути: адреса → функція
   ▼
controllers/             розбирає HTTP-запит, перевіряє формат, віддає відповідь
   ▼
services/                бізнес-логіка (депозит, зняття, баланс, конвертація)
   ├──► repositories/     єдине місце з SQL до PostgreSQL
   └──► services/ratesProvider.ts   курси валют (Frankfurter + кеш у пам'яті)
```

**Навіщо:** контролер не знає SQL, репозиторій не знає про HTTP, логіка не залежить від бази. Кожну частину можна міняти й тестувати окремо.

---

## Структура файлів

```
src/
├─ server.ts                          точка входу: піднімає Express, викликає initDb()
├─ config/
│  └─ db.ts                           пул з'єднань pg + initDb() (CREATE TABLE)
├─ routes/
│  └─ api.ts                          таблиця маршрутів /api/*
├─ controllers/
│  └─ transactionController.ts        HTTP-шар + валідація формату
├─ services/
│  ├─ transactionService.ts           бізнес-логіка
│  └─ ratesProvider.ts                клієнт Frankfurter + кеш курсів
└─ repositories/
   └─ transactionRepository.ts        SQL-запити до таблиці transactions

public/
├─ index.html                         розмітка сторінки
└─ js/app.js                          згенерований esbuild бандл (у .gitignore)

.env                                  креденшали БД (у .gitignore)
tsconfig.json / .prettierrc.json      конфіги TypeScript і Prettier
```

---

## Як запустити

**Передумови:** встановлений і запущений PostgreSQL.

1. Встанови залежності:

    ```bash
    npm install
    ```

2. Створи файл `.env` у корені (приклад):

    ```env
    DB_USER=postgres
    DB_PASSWORD=твій_пароль
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=postgres
    PORT=3000
    ```

3. Збери фронтенд:

    ```bash
    npm run build:client
    ```

4. Запусти сервер:

    ```bash
    npm run dev
    ```

5. Відкрий <http://localhost:3000>.

Таблиця `transactions` створюється автоматично при старті (`initDb()`).

---

## npm-скрипти

| Команда                | Що робить                                         |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | сервер із автоперезапуском (`tsx watch`)          |
| `npm start`            | сервер без стеження                               |
| `npm run build:client` | збирає `src/frontend/app.ts` → `public/js/app.js` |
| `npm run watch:client` | те саме, з автоперезбіркою при змінах             |
| `npm run typecheck`    | перевірка типів (`tsc --noEmit`)                  |
| `npm run format`       | форматує весь проект (Prettier)                   |
| `npm run format:check` | перевіряє форматування, нічого не міняючи         |

---

## API

Усі шляхи з префіксом `/api`.

| Метод  | Шлях                    | Тіло / параметри              | Опис                                 |
| ------ | ----------------------- | ----------------------------- | ------------------------------------ |
| `POST` | `/deposits`             | `{ amount, currency, date? }` | додати надходження                   |
| `POST` | `/withdrawals`          | `{ amount, currency, date? }` | додати зняття                        |
| `GET`  | `/balance?currency=USD` | —                             | агрегований баланс у вказаній валюті |
| `GET`  | `/transactions`         | —                             | історія операцій                     |
| `GET`  | `/currencies`           | —                             | список підтримуваних валют           |

`date` необов'язкова — за замовчуванням сьогодні. `amount` має бути числом > 0.

---

## Модель даних

Таблиця `transactions`:

| Колонка      | Тип              | Примітка                                                                          |
| ------------ | ---------------- | --------------------------------------------------------------------------------- |
| `id`         | `SERIAL`         | первинний ключ                                                                    |
| `amount`     | `NUMERIC(14, 2)` | сума у валюті операції (напр. `200.00`); точний десятковий тип, без похибок float |
| `currency`   | `TEXT`           | код валюти (`USD`, `EUR`…)                                                        |
| `type`       | `TEXT`           | `'deposit'` або `'withdrawal'` (перевіряється `CHECK`)                            |
| `date`       | `DATE`           | дата операції                                                                     |
| `created_at` | `TIMESTAMPTZ`    | момент створення запису                                                           |

---

## Як рахується баланс

1. `repository.netByCurrency()` рахує в БД чистий підсумок по кожній валюті:
   `SUM(депозити) − SUM(зняття)`.
2. `service.getBalance(target)` конвертує підсумок **кожної** валюти в цільову через `ratesProvider.convert()` і додає.
3. Овердрафт дозволено — баланс може бути від'ємним.

Курси кешуються в пам'яті на 1 годину (курси ЄЦБ оновлюються раз на день). Якщо Frankfurter недоступний — використовується останній збережений кеш.

---

## Фронтенд

Браузер не виконує TypeScript, тому `src/frontend/app.ts` збирається через `esbuild` у `public/js/app.js`, який віддає `express.static('public')`.

> **Важливо:** редагуєш завжди `.ts`, а `.js` перезбирається командою `npm run build:client` (або автоматично через `npm run watch:client`).
