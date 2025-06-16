const express = require('express');
const db = require('../database');
const router = express.Router();
// Adicione um middleware para verificar o token aqui se quiser proteger as rotas

// Rota para buscar todas as matérias
router.get('/subjects', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM subjects ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar matérias.' });
    }
});

// Rota para buscar todas as lições de uma matéria
router.get('/lessons/:subjectId', async (req, res) => {
    const { subjectId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM lessons WHERE subject_id = $1 ORDER BY lesson_order',
            [subjectId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar lições.' });
    }
});

// ... (Aqui entraria a lógica complexa de progresso, score, etc.)
// A lógica completa de resposta de questão, bloqueio, etc., seria bem extensa.
// Vou colocar uma versão simplificada para ilustrar.
router.post('/submit-answer', async (req, res) => {
    // Aqui viria a lógica de verificar resposta, atualizar score, bloquear, etc.
    // Esta parte é a mais complexa e demandaria muitas linhas de código.
    // Por enquanto, vamos deixar como um placeholder.
    res.json({ message: 'Resposta recebida!' });
});


// =====================================================================
// ADICIONE ESTA NOVA ROTA NO FINAL DE content.js
// =====================================================================

// Rota para buscar os detalhes de UMA lição específica
router.get('/lesson-detail/:lessonId', async (req, res) => {
    const { lessonId } = req.params;
    try {
        const result = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lição não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes da lição.' });
    }
});

module.exports = router;