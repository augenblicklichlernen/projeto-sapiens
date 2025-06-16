const express = require('express');
const db = require('../database');
const router = express.Router();

// Rota para adicionar uma nova matéria
router.post('/subject', async (req, res) => {
    // Em um app real, teríamos autenticação para garantir que só você pode fazer isso
    const { name, color_hex } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO subjects (name, color_hex) VALUES ($1, $2) RETURNING *',
            [name, color_hex]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar matéria.' });
    }
});

// Rota para adicionar uma nova lição
router.post('/lesson', async (req, res) => {
    const { subject_id, title, lesson_order, video_url, ...outrosCampos } = req.body;
    try {
        // A query de inserção seria complexa, pegando todos os campos da sua descrição
        // Exemplo simplificado:
        const result = await db.query(
            'INSERT INTO lessons (subject_id, title, lesson_order, video_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [subject_id, title, lesson_order, video_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar lição.' });
    }
});

module.exports = router;