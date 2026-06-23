import express from 'express';
import apiRoutes from './routes/api.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/api', apiRoutes);

app.listen(3000, () => console.log('🚀 Сервер працює: http://localhost:3000'));