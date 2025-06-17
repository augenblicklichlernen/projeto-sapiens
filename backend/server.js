// Importa as ferramentas necessárias
require('dotenv').config();
const express = require('express');
// =================================================================================
// COLE ESTE BLOCO NO server.js, LOGO APÓS a linha `const app = express();`
// =================================================================================

const cors = require('cors');

// --- INÍCIO DA CONFIGURAÇÃO CORS FINAL E ROBUSTA ---
const whitelist = ['https://sapiens-frontend-3g1w.onrender.com']; // URL do seu frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como apps mobile ou Postman) ou se a origem estiver na whitelist
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
// --- FIM DA CONFIGURAÇÃO CORS ---
const db = require('./database'); // Nosso arquivo de conexão com o banco de dados
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const adminRoutes = require('./routes/admin');

// Inicializa o cérebro (o servidor)
const app = express();

// --- INÍCIO DA CONFIGURAÇÃO CORS MANUAL E ROBUSTA ---
app.use((req, res, next) => {
  // Permite que QUALQUER origem acesse a API. 
  // Para maior segurança no futuro, você pode substituir '*' pela URL do seu frontend.
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Define os métodos HTTP que são permitidos
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  
  // Define os cabeçalhos que o cliente (frontend) pode enviar na requisição
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  
  // Indica que as credenciais (como cookies ou tokens de autorização) podem ser enviadas
  res.setHeader('Access-Control-Allow-Credentials', true);
  
  // Passa para o próximo middleware da fila
  next();
});
// --- FIM DA CONFIGURAÇÃO CORS MANUAL E ROBUSTA ---
app.use(express.json()); // Permite que o servidor entenda dados em formato JSON

// Define as rotas (os caminhos que o frontend pode acessar)
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/admin', adminRoutes);

// Rota de teste para ver se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('O cérebro do Projeto Sapiens está no ar!');
});

//forçar deploy
// O cérebro começa a "ouvir" por requisições na porta definida
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await db.connect();
  console.log(`Servidor rodando na porta ${PORT}`);
});