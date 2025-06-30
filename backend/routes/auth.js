// ========================================================================
// PROJETO SAPIENS - AUTH.JS - VERSÃO FINAL E CONSOLIDADA
// ========================================================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();

// IMPORTANTE: Importa a função de verificação de token
const verifyToken = require('../middleware/authMiddleware');

// ------------------------------------------------------------------------
// ROTA DE REGISTRO (Pública)
// ------------------------------------------------------------------------
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [username, hashedPassword]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro em /register:", error);
        res.status(500).json({ message: 'Erro ao registrar usuário. Talvez o nome já exista.' });
    }
});

// ------------------------------------------------------------------------
// ROTA DE LOGIN (Pública)
// ------------------------------------------------------------------------
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Usuário ou senha inválidos.' });
        }
        const user = result.rows[0];
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Usuário ou senha inválidos.' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'seu_segredo_secreto', { expiresIn: '7d' }); // Aumentei a expiração para 7 dias
        res.json({ token, username: user.username, userId: user.id });
    } catch (error) {
        console.error("Erro em /login:", error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// ------------------------------------------------------------------------
// ROTA DE EXCLUSÃO DE CONTA (Protegida)
// ------------------------------------------------------------------------
router.delete('/me', verifyToken, async (req, res) => {
    // Graças ao middleware `verifyToken`, já temos o ID do usuário verificado em req.userId.
    // Isso garante que um usuário só pode excluir a si mesmo.
    const userIdToDelete = req.userId;

    try {
        await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
        // O banco de dados com "ON DELETE CASCADE" irá limpar automaticamente
        // todas as entradas em user_lesson_progress, certificates, etc.
        
        res.status(200).json({ message: 'Conta de usuário excluída com sucesso.' });

    } catch (error) {
        console.error(`Erro ao excluir usuário ${userIdToDelete}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao excluir a conta.' });
    }
});

module.exports = router;