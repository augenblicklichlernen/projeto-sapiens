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

// =================================================================================
// =================================================================================
const cors = require('cors');

// --- CONFIGURAÇÃO CORS UNIVERSAL ---
app.use(cors()); // Permite todas as origens por padrão. É a forma mais simples e eficaz para começar.

// Habilita o pre-flight para todas as rotas
app.options('*', cors()); 
// --- FIM DA CONFIGURAÇÃO CORS ---

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