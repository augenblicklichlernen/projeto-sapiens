// =================================================================================
// ARQUIVO server.js (VERSÃO DE ESTABILIDADE MÁXIMA)
// =================================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importa a biblioteca
const db = require('./database');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');

const app = express();

// --- CONFIGURAÇÃO CORS UNIVERSAL E ROBUSTA ---
// Permite requisições de todas as origens.
app.use(cors());
app.options('*', cors()); // Habilita pre-flight para todas as rotas
// --- FIM DA CONFIGURAÇÃO CORS ---

app.use(express.json());

// Define as rotas
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('O cérebro do Projeto Sapiens está no ar!');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await db.connect();
    console.log(`Servidor rodando na porta ${PORT}!`);
  } catch (err) {
    console.error("ERRO CRÍTICO AO INICIAR O SERVIDOR:", err);
  }
});