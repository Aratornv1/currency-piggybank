import express from 'express';
import apiRoutes from './routes/api';
import { initDb } from './config/db';

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/api', apiRoutes);

const PORT = Number(process.env.PORT) || 3000;

initDb()
    .then(() => app.listen(PORT, () => console.log(`🚀 Сервер працює: http://localhost:${PORT}`)))
    .catch((err: Error) => {
        console.error('❌ Не вдалося ініціалізувати БД:', err.message);
        process.exit(1);
    });
