const express = require('express');
const db = require('../database');
const router = express.Router();
// Middleware de autenticação (a ser adicionado para segurança)
// const authMiddleware = require('../middleware/auth');
// router.use(authMiddleware);

// Rota para buscar todas as matérias
router.get('/subjects', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM subjects ORDER BY name');
        res.json(result.rows);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar matérias.' }); }
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

// --- NOVAS ROTAS PARA O QUIZ ---

// Rota para o aluno iniciar uma lição (obter estado atual)
router.get('/start-lesson/:lessonId/user/:userId', async (req, res) => {
    const { lessonId, userId } = req.params;
    try {
        let progress = await db.query('SELECT * FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
        if (progress.rows.length === 0) {
            // Cria um registro de progresso se não existir
            await db.query('INSERT INTO user_lesson_progress (user_id, lesson_id) VALUES ($1, $2)', [userId, lessonId]);
            progress = await db.query('SELECT * FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
        }
        res.json(progress.rows[0]);
    } catch (error) { res.status(500).json({ message: 'Erro ao iniciar lição.'}); }
});

// Rota para submeter a resposta do quiz
router.post('/submit-quiz', async (req, res) => {
    const { userId, lessonId, questionType, isCorrect } = req.body;
    try {
        if (questionType === 'q2' && !isCorrect) {
            // Lógica de erro na questão 2
            const progress = await db.query('SELECT q2_attempts FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
            const newAttempts = progress.rows[0].q2_attempts + 1;

            if (newAttempts >= 2) { // Errou pela 2a vez
                const oneHourLater = new Date(Date.now() + 3600 * 1000).toISOString();
                await db.query(
                    'UPDATE user_lesson_progress SET q2_attempts = $1, blocked_until = $2 WHERE user_id = $3 AND lesson_id = $4',
                    [newAttempts, oneHourLater, userId, lessonId]
                );
                return res.json({ status: 'blocked', message: 'Número máximo de tentativas. Tente esta lição novamente mais tarde.' });
            } else { // Errou pela 1a vez
                await db.query('UPDATE user_lesson_progress SET q2_attempts = $1 WHERE user_id = $2 AND lesson_id = $3', [newAttempts, userId, lessonId]);
                return res.json({ status: 'retry', message: 'Resposta incorreta. Você será redirecionado para o início da lição.' });
            }
        }
        
        if (questionType === 'q2' && isCorrect) {
            // Acertou a questão 2, completa a lição e ganha o score
            await db.query(
                'UPDATE user_lesson_progress SET score = 1, completed_at = NOW() WHERE user_id = $1 AND lesson_id = $2',
                [userId, lessonId]
            );
            return res.json({ status: 'completed', message: 'Parabéns, você completou a lição!' });
        }
        
        res.json({ status: 'continue', message: 'Questão de treino finalizada.' });
    } catch (error) { res.status(500).json({ message: 'Erro ao processar resposta.'}); }
});

// ROTA PARA BUSCAR O SCORE DO ALUNO
router.get('/scores/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT 
                s.name, 
                s.color_hex, 
                (SELECT COUNT(*) FROM lessons l WHERE l.subject_id = s.id) as total_lessons,
                (SELECT SUM(ulp.score) FROM user_lesson_progress ulp WHERE ulp.user_id = $1 AND ulp.lesson_id IN (SELECT id FROM lessons WHERE subject_id = s.id)) as user_score
            FROM 
                subjects s
            ORDER BY s.name;
        `;
        const result = await db.query(query, [userId]);
        
        const scores = result.rows.map(row => ({
            name: row.name,
            color_hex: row.color_hex,
            total_lessons: parseInt(row.total_lessons, 10),
            user_score: parseInt(row.user_score, 10) || 0
        }));

        res.json(scores);
    } catch (error) {
        console.error("Erro ao buscar scores:", error);
        res.status(500).json({ message: 'Erro ao buscar scores.' });
    }
});

module.exports = router;