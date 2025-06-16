// Importa as ferramentas necessárias
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database'); // Nosso arquivo de conexão com o banco de dados
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');

// Inicializa o cérebro (o servidor)
const app = express();
app.use(cors()); // Permite que o Frontend converse com o Backend
app.use(express.json()); // Permite que o servidor entenda dados em formato JSON

// Define as rotas (os caminhos que o frontend pode acessar)
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);

// Rota de teste para ver se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('O cérebro do Projeto Sapiens está no ar!');
});

// O cérebro começa a "ouvir" por requisições na porta definida
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await db.connect();
  console.log(`Servidor rodando na porta ${PORT}`);
});