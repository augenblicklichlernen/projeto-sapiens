// arquivo: backend/routes/content.js - VERSÃO FINAL E SEGURA

const express = require('express');
const db = require('../database');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

// ========================================================================
// ROTAS PÚBLICAS (não precisam de login)
// ========================================================================

router.get('/subjects', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM subjects ORDER BY is_extra, subject_order, name');
        const mainSubjects = result.rows.filter(s => !s.is_extra);
        const extraSubjects = result.rows.filter(s => s.is_extra);
        res.json({ main: mainSubjects, extra: extraSubjects });
    } catch (error) {
        console.error("Erro em /subjects:", error);
        res.status(500).json({ message: 'Erro ao buscar matérias.' });
    }
});

router.get('/lessons/:subjectId', async (req, res) => {
    try {
        const result = await db.query('SELECT id, title, lesson_order FROM lessons WHERE subject_id = $1 ORDER BY lesson_order', [req.params.subjectId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar lições.' });
    }
});

router.get('/lesson-detail/:lessonId', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM lessons WHERE id = $1', [req.params.lessonId]);
        res.json(result.rows[0] || null);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes.' });
    }
});

router.get('/reinforcement-lesson/:lessonId', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM reinforcement_lessons WHERE id = $1', [req.params.lessonId]);
        res.json(result.rows[0] || null);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar detalhes.' });
    }
});


// ========================================================================
// ROTAS PROTEGIDAS (precisam de login e token válido)
// ========================================================================

router.post('/start-lesson', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ message: 'lessonId é obrigatório.' });
    try {
        let { rows } = await db.query('SELECT * FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
        if (rows.length === 0) {
            await db.query('INSERT INTO user_lesson_progress (user_id, lesson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, lessonId]);
            const newResult = await db.query('SELECT * FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
            rows = newResult.rows;
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Erro na rota /start-lesson:", error);
        res.status(500).json({ message: 'Erro no servidor ao iniciar a lição.' });
    }
});

router.post('/submit-quiz', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { lessonId, isCorrect, variantIndex } = req.body;
    try {
        if (isCorrect) {
            await db.query('UPDATE user_lesson_progress SET score = 1, completed_at = NOW() WHERE user_id = $1 AND lesson_id = $2 AND completed_at IS NULL', [userId, lessonId]);
            const r = await db.query('SELECT subject_id, (SELECT COUNT(*) FROM lessons WHERE subject_id=l.subject_id) as total FROM lessons l WHERE id=$1', [lessonId]);
            const { subject_id, total } = r.rows[0];
            const p = await db.query('SELECT COUNT(*) as completed FROM user_lesson_progress WHERE user_id=$1 AND lesson_id IN (SELECT id FROM lessons WHERE subject_id=$2) AND score > 0', [userId, subject_id]);
            if (parseInt(p.rows[0].completed) >= parseInt(total)) {
                return res.json({ status: 'subject_finished', subjectId: subject_id, message: 'Parabéns, você completou a matéria!' });
            }
            return res.json({ status: 'completed', message: 'Parabéns, você completou a lição!' });
        } else {
            const p = await db.query('SELECT q2_attempts FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
            const newAttempts = (p.rows[0]?.q2_attempts || 0) + 1;
            await db.query('UPDATE user_lesson_progress SET q2_variants_seen = array_append(q2_variants_seen, $1) WHERE user_id = $2 AND lesson_id = $3', [variantIndex, userId, lessonId]);
            if (newAttempts >= 2) {
                const oneHourLater = new Date(Date.now() + 3600 * 1000);
                await db.query('UPDATE user_lesson_progress SET q2_attempts=$1, blocked_until=$2 WHERE user_id=$3 AND lesson_id=$4', [newAttempts, oneHourLater, userId, lessonId]);
                return res.json({ status: 'blocked', message: 'Número máximo de tentativas atingido. Tente mais tarde.' });
            } else {
                await db.query('UPDATE user_lesson_progress SET q2_attempts=$1 WHERE user_id=$2 AND lesson_id=$3', [newAttempts, userId, lessonId]);
                return res.json({ status: 'retry', message: 'Resposta incorreta. Você será redirecionado.' });
            }
        }
    } catch (error) {
        console.error("Erro em /submit-quiz:", error);
        res.status(500).json({ message: 'Erro ao processar resposta.' });
    }
});

router.post('/unlock-reinforcement', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { triggerLessonId } = req.body;
    try {
        const { rows } = await db.query('SELECT id, title FROM reinforcement_lessons WHERE trigger_lesson_id = $1', [triggerLessonId]);
        if (rows.length > 0) {
            await db.query('INSERT INTO user_reinforcement_progress (user_id, reinforcement_lesson_id) VALUES ($1, $2) ON CONFLICT (user_id, reinforcement_lesson_id) DO NOTHING', [userId, rows[0].id]);
            return res.json({ unlocked: true, title: rows[0].title });
        }
        res.json({ unlocked: false });
    } catch (error) {
        console.error("Erro em /unlock-reinforcement:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

router.post('/generate-certificate', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { subjectId, fullName } = req.body;
    try {
        await db.query('INSERT INTO certificates (user_id, subject_id, full_name) VALUES ($1, $2, $3) ON CONFLICT (user_id, subject_id) DO UPDATE SET full_name = $3', [userId, subjectId, fullName]);
        res.status(201).json({ message: 'Certificado gerado!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

router.get('/certificates/user', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const r = await db.query('SELECT c.full_name, s.name as subject_name, (SELECT COUNT(*) FROM lessons WHERE subject_id=s.id) as total_lessons FROM certificates c JOIN subjects s ON c.subject_id=s.id WHERE c.user_id=$1', [userId]);
        res.json(r.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar certificados.' });
    }
});

router.get('/scores/user', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const r = await db.query('SELECT s.id, s.name, s.color_hex, (SELECT COUNT(*) FROM lessons l WHERE l.subject_id=s.id) as total_lessons, (SELECT COUNT(*) FROM user_lesson_progress ulp WHERE ulp.user_id=$1 AND ulp.lesson_id IN (SELECT id FROM lessons WHERE subject_id=s.id) AND ulp.score > 0) as user_score FROM subjects s ORDER BY s.is_extra, s.subject_order', [userId]);
        res.json(r.rows.map(row => ({ ...row, total_lessons: parseInt(row.total_lessons), user_score: parseInt(row.user_score) || 0 })));
    } catch (error) {
        console.error("Erro em /scores:", error);
        res.status(500).json({ message: 'Erro ao buscar scores.' });
    }
});

router.get('/reinforcement/user', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const result = await db.query('SELECT rl.id, rl.title FROM reinforcement_lessons rl JOIN user_reinforcement_progress urp ON rl.id = urp.reinforcement_lesson_id WHERE urp.user_id = $1', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar reforço.' });
    }
});

module.exports = router;