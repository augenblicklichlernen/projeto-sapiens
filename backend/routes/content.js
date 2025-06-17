// =================================================================================
// ARQUIVO content.js COMPLETO (Versão FINAL CORRIGIDA)
// =================================================================================

const express = require('express');
const db = require('../database');
const router = express.Router();

// Rota para buscar todas as matérias (VERSÃO DE CORREÇÃO)
router.get('/subjects', async (req, res) => {
    try {
        // Voltando para a ordenação por nome para estabilizar o sistema
        const result = await db.query('SELECT * FROM subjects ORDER BY subject_order');
        res.json(result.rows);
    } catch (error) {
        console.error("ERRO FATAL em /api/content/subjects:", error);
        res.status(500).json({ message: 'Erro ao buscar matérias.' });
    }
});

// Rota para buscar todas as lições de uma matéria
router.get('/lessons/:subjectId', async (req, res) => {
    const { subjectId } = req.params;
    try {
        const result = await db.query(
            'SELECT id, title, lesson_order FROM lessons WHERE subject_id = $1 ORDER BY lesson_order',
            [subjectId]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar lições.' }); }
});

// Rota para buscar os detalhes de UMA lição específica
router.get('/lesson-detail/:lessonId', async (req, res) => {
    const { lessonId } = req.params;
    try {
        const result = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Lição não encontrada.' });
        res.json(result.rows[0]);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar detalhes da lição.' }); }
});

// Rota para o aluno iniciar uma lição (obter estado atual)
router.get('/start-lesson/:lessonId/user/:userId', async (req, res) => {
    const { lessonId, userId } = req.params;
    try {
        let progress = await db.query('SELECT * FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
        if (progress.rows.length === 0) {
            await db.query('INSERT INTO user_lesson_progress (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT (user_id, lesson_id) DO NOTHING', [userId, lessonId]);
            progress = await db.query('SELECT * FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
        }
        res.json(progress.rows[0]);
    } catch (error) { res.status(500).json({ message: 'Erro ao iniciar lição.'}); }
});

// Rota para submeter a resposta do quiz (VERSÃO CORRIGIDA)
router.post('/submit-quiz', async (req, res) => {
    const { userId, lessonId, isCorrect } = req.body;
    try {
        if (isCorrect) {
            await db.query(
                'UPDATE user_lesson_progress SET score = 1, completed_at = NOW() WHERE user_id = $1 AND lesson_id = $2 AND completed_at IS NULL',
                [userId, lessonId]
            );

            const lessonInfo = await db.query('SELECT subject_id FROM lessons WHERE id = $1', [lessonId]);
            const subjectId = lessonInfo.rows[0].subject_id;

            const totalLessonsInSubject = await db.query('SELECT COUNT(*) as total FROM lessons WHERE subject_id = $1', [subjectId]);
            const completedLessonsByUser = await db.query('SELECT COUNT(*) as completed FROM user_lesson_progress WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE subject_id = $2) AND score > 0', [userId, subjectId]);
            
            if (parseInt(completedLessonsByUser.rows[0].completed, 10) === parseInt(totalLessonsInSubject.rows[0].total, 10)) {
                return res.json({ status: 'subject_finished', subjectId: subjectId, message: 'Parabéns, você completou a matéria!' });
            }
            return res.json({ status: 'completed', message: 'Parabéns, você completou a lição!' });
        } else {
            const progress = await db.query('SELECT q2_attempts FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
            const newAttempts = (progress.rows[0].q2_attempts || 0) + 1;

            if (newAttempts >= 2) {
                const oneHourLater = new Date(Date.now() + 3600 * 1000).toISOString();
                await db.query(
                    'UPDATE user_lesson_progress SET q2_attempts = $1, blocked_until = $2 WHERE user_id = $3 AND lesson_id = $4',
                    [newAttempts, oneHourLater, userId, lessonId]
                );
                return res.json({ status: 'blocked', message: 'Número máximo de tentativas atingido. Tente mais tarde.' });
            } else {
                await db.query('UPDATE user_lesson_progress SET q2_attempts = $1 WHERE user_id = $2 AND lesson_id = $3', [newAttempts, userId, lessonId]);
                return res.json({ status: 'retry', message: 'Resposta incorreta. Você será redirecionado para o início da lição.' });
            }
        }
    } catch (error) { 
        console.error("Erro ao processar resposta do quiz:", error);
        res.status(500).json({ message: 'Erro ao processar resposta.'}); 
    }
});


// ROTA PARA DESBLOQUEAR LIÇÃO DE REFORÇO
router.post('/unlock-reinforcement', async (req, res) => {
    const { userId, triggerLessonId } = req.body;
    try {
        const rfLessonQuery = await db.query('SELECT id, title FROM reinforcement_lessons WHERE trigger_lesson_id = $1', [triggerLessonId]);
        if (rfLessonQuery.rows.length > 0) {
            const rfLesson = rfLessonQuery.rows[0];
            await db.query(
                'INSERT INTO user_reinforcement_progress (user_id, reinforcement_lesson_id) VALUES ($1, $2) ON CONFLICT (user_id, reinforcement_lesson_id) DO NOTHING',
                [userId, rfLesson.id]
            );
            return res.json({ unlocked: true, title: rfLesson.title });
        }
        res.json({ unlocked: false });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.'}); }
});

// ROTA PARA GERAR CERTIFICADO
router.post('/generate-certificate', async (req, res) => {
    const { userId, subjectId, fullName } = req.body;
    try {
        await db.query(
            'INSERT INTO certificates (user_id, subject_id, full_name) VALUES ($1, $2, $3) ON CONFLICT (user_id, subject_id) DO UPDATE SET full_name = $1',
            [userId, subjectId, fullName]
        );
        res.status(201).json({ message: 'Certificado gerado com sucesso!' });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.'}); }
});

// ROTA PARA BUSCAR CERTIFICADOS DO USUÁRIO
router.get('/certificates/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT c.full_name, c.issued_at, s.name as subject_name, (SELECT COUNT(*) FROM lessons WHERE subject_id = s.id) as total_lessons FROM certificates c JOIN subjects s ON c.subject_id = s.id WHERE c.user_id = $1',
            [userId]
        );
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar certificados.'}); }
});

module.exports = router;