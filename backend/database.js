const { Pool } = require('pg');

let pool;

async function connect() {
  // O Render.com nos dará essa URL de conexão
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pool.query('SELECT NOW()'); // Testa a conexão
    console.log('Banco de dados conectado com sucesso!');
    await createTables();
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  }
}

// Função que cria as tabelas do nosso sistema caso elas não existam
async function createTables() {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      color_hex VARCHAR(7) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      lesson_order INTEGER NOT NULL,
      video_url TEXT,
      image_url TEXT,
      audio_url TEXT,
      lesson_text TEXT,
      q1_text TEXT,
      q1_options TEXT[], -- Array de 5 strings
      q1_time INTEGER,
      q2_variants JSONB, -- Armazena as 3 variantes da questão 2
      q2_time INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      score INTEGER DEFAULT 0,
      completed_at TIMESTAMP,
      attempts_q2 INTEGER DEFAULT 0,
      blocked_until TIMESTAMP
    );
  `;
  await pool.query(createTablesQuery);
  console.log('Tabelas verificadas/criadas com sucesso!');
}

module.exports = {
  connect,
  query: (text, params) => pool.query(text, params),
};