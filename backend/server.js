require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');
const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => res.send('O cérebro do Projeto Sapiens está no ar!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => { try { await db.connect(); console.log(`Servidor rodando na porta ${PORT}!`); } catch (err) { console.error("ERRO CRÍTICO AO INICIAR:", err); } });