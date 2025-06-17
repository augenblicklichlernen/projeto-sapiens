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
      color_hex VARCHAR(7) NOT NULL,
      subject_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      lesson_order INTEGER NOT NULL,
      video_url TEXT, image_url TEXT, audio_url TEXT, lesson_text TEXT,
      q1_text TEXT, q1_options TEXT[], q1_time INTEGER,
      q2_variants JSONB, q2_time INTEGER
    );
    CREATE TABLE IF NOT EXISTS user_lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0, completed_at TIMESTAMP, q2_attempts INTEGER DEFAULT 0,
        q2_variants_seen INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        blocked_until TIMESTAMP, UNIQUE(user_id, lesson_id)
    );
    CREATE TABLE IF NOT EXISTS reinforcement_lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        trigger_lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        content JSONB -- Armazena vídeo, texto, questões de treino, etc.
    );
    CREATE TABLE IF NOT EXISTS user_reinforcement_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reinforcement_lesson_id INTEGER NOT NULL REFERENCES reinforcement_lessons(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP DEFAULT NOW(), completed_at TIMESTAMP,
        UNIQUE(user_id, reinforcement_lesson_id)
    );
    -- NOVA TABELA PARA CERTIFICADOS
    CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        issued_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, subject_id)
    );
  `;
  await pool.query(createTablesQuery);
  console.log('Tabelas (versão finalíssima) verificadas/criadas com sucesso!');
}

module.exports = {
  connect,
  query: (text, params) => pool.query(text, params),
};