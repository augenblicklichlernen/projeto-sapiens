const express = require('express');
const db = require('../database');
const router = express.Router();

// Rota para adicionar uma nova matéria (sem mudanças)
router.post('/subject', async (req, res) => {
    const { name, color_hex } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO subjects (name, color_hex) VALUES ($1, $2) RETURNING *',
            [name, color_hex]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar matéria:", error);
        res.status(500).json({ message: 'Erro ao criar matéria.' });
    }
});

// Rota para adicionar uma nova lição (VERSÃO COMPLETA)
router.post('/lesson', async (req, res) => {
    const {
        subject_id,
        title,
        lesson_order,
        video_url,
        image_url,
        audio_url,
        lesson_text,
        q1_text,
        q1_options,
        q1_time,
        q2_variants,
        q2_time
    } = req.body;

    // Validação básica
    if (!subject_id || !title || !lesson_order) {
        return res.status(400).json({ message: 'Matéria, título e ordem são obrigatórios.' });
    }

    try {
        const query = `
            INSERT INTO lessons (
                subject_id, title, lesson_order, video_url, image_url, audio_url, 
                lesson_text, q1_text, q1_options, q1_time, q2_variants, q2_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const values = [
            subject_id, title, lesson_order, video_url, image_url, audio_url, 
            lesson_text, q1_text, q1_options, q1_time, JSON.stringify(q2_variants), q2_time
        ];

        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
        
    } catch (error) {
        console.error("Erro ao criar lição:", error);
        res.status(500).json({ message: 'Erro ao criar lição no servidor.' });
    }
});

// --- NOVAS ROTAS DE EXCLUSÃO ---

// Rota para excluir uma matéria
router.delete('/subject/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Primeiro, verificamos se a matéria existe (opcional, mas bom)
        const subject = await db.query('SELECT * FROM subjects WHERE id = $1', [id]);
        if (subject.rows.length === 0) {
            return res.status(404).json({ message: 'Matéria não encontrada.' });
        }
        
        // Excluir a matéria (o banco de dados está configurado para excluir as lições em cascata)
        await db.query('DELETE FROM subjects WHERE id = $1', [id]);
        
        res.status(200).json({ message: 'Matéria e todas as suas lições foram excluídas com sucesso.' });
    } catch (error) {
        console.error("Erro ao excluir matéria:", error);
        res.status(500).json({ message: 'Erro no servidor ao excluir matéria.' });
    }
});

// Rota para excluir uma lição específica
router.delete('/lesson/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM lessons WHERE id = $1', [id]);
        res.status(200).json({ message: 'Lição excluída com sucesso.' });
    } catch (error) {
        console.error("Erro ao excluir lição:", error);
        res.status(500).json({ message: 'Erro no servidor ao excluir lição.' });
    }
});
module.exports = router;