// =================================================================================
// ARQUIVO server.js (VERSÃO FINAL COM ORDEM CORRIGIDA)
// =================================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');

// 1. INICIALIZA O SERVIDOR EXPRESS
const app = express();

// 2. CONFIGURA O CORS
const whitelist = ['https://sapiens-frontend-3g1w.onrender.com']; // URL do seu frontend
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// 3. CONFIGURA O RESTO DO MIDDLEWARE E ROTAS
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('O cérebro do Projeto Sapiens está no ar!');
});

// 4. INICIA O SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await db.connect();
    console.log(`Servidor rodando na porta ${PORT}!`);
  } catch (err) {
    console.error("ERRO CRÍTICO AO INICIAR O SERVIDOR:", err);
  }
});