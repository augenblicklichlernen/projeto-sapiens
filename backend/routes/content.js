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

// Rota para submeter a resposta do quiz (VERSÃO FINAL COM VERIFICAÇÃO DE CONCLUSÃO)
router.post('/submit-quiz', async (req, res) => {
    const { userId, lessonId, isCorrect } = req.body;
    try {
        if (isCorrect) {
            // Acertou a questão 2, completa a lição e ganha o score
            await db.query(
                'UPDATE user_lesson_progress SET score = 1, completed_at = NOW() WHERE user_id = $1 AND lesson_id = $2',
                [userId, lessonId]
            );

            // VERIFICA SE ESTA FOI A ÚLTIMA LIÇÃO DA MATÉRIA
            const lessonInfo = await db.query('SELECT subject_id FROM lessons WHERE id = $1', [lessonId]);
            const subjectId = lessonInfo.rows[0].subject_id;

            const totalLessonsInSubject = await db.query('SELECT COUNT(*) as total FROM lessons WHERE subject_id = $1', [subjectId]);
            const completedLessonsByUser = await db.query('SELECT COUNT(*) as completed FROM user_lesson_progress WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE subject_id = $2) AND score > 0', [userId, subjectId]);
            
            if (parseInt(completedLessonsByUser.rows[0].completed, 10) === parseInt(totalLessonsInSubject.rows[0].total, 10)) {
                // Se o número de lições completas for igual ao total, a matéria terminou
                return res.json({ status: 'subject_finished', subjectId: subjectId, message: 'Parabéns, você completou a matéria!' });
            }

            // Se não, apenas a lição terminou
            return res.json({ status: 'completed', message: 'Parabéns, você completou a lição!' });

        } else {
            // Lógica de erro na questão 2
            const progress = await db.query('SELECT q2_attempts FROM user_lesson_progress WHERE user_id = $1 AND lesson_id = $2', [userId, lessonId]);
            const newAttempts = progress.rows[0].q2_attempts + 1;

            if (newAttempts >= 2) { // Errou pela 2a vez
                const oneHourLater = new Date(Date.now() + 3600 * 1000).toISOString();
                await db.query(
                    'UPDATE user_lesson_progress SET q2_attempts = $1, blocked_until = $2 WHERE user_id = $3 AND lesson_id = $4',
                    [newAttempts, oneHourLater, userId, lessonId]
                );
                return res.json({ status: 'blocked', message: 'Número máximo de tentativas atingido. Tente mais tarde.' });
            } else { // Errou pela 1a vez
                await db.query('UPDATE user_lesson_progress SET q2_attempts = $1 WHERE user_id = $2 AND lesson_id = $3', [newAttempts, userId, lessonId]);
                return res.json({ status: 'retry', message: 'Resposta incorreta. Você será redirecionado para o início da lição.' });
            }
        }
    } catch (error) { 
        console.error("Erro ao processar resposta do quiz:", error);
        res.status(500).json({ message: 'Erro ao processar resposta.'}); 
    }
});
        
        res.json({ status: 'continue', message: 'Questão de treino finalizada.' });
    } catch (error) { res.status(500).json({ message: 'Erro ao processar resposta.'}); }
});

if (result.status === 'completed') {
    // VERIFICA SE ESTA FOI A ÚLTIMA LIÇÃO
    const lessonCheck = await db.query('SELECT subject_id, (SELECT COUNT(*) FROM lessons WHERE subject_id = l.subject_id) as total FROM lessons l WHERE l.id = $1', [lessonId]);
    const progressCheck = await db.query('SELECT COUNT(*) as completed FROM user_lesson_progress WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE subject_id = $2) AND score > 0', [userId, lessonCheck.rows[0].subject_id]);

    if (progressCheck.rows[0].completed == lessonCheck.rows[0].total) {
        return res.json({ status: 'subject_finished', subjectId: lessonCheck.rows[0].subject_id, message: 'Parabéns, você completou a matéria!' });
    }
    return res.json({ status: 'completed', message: 'Parabéns, você completou a lição!' });
} 

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

// ROTA PARA DESBLOQUEAR LIÇÃO DE REFORÇO
router.post('/unlock-reinforcement', async (req, res) => {
    const { userId, triggerLessonId } = req.body;
    try {
        // Encontra a lição de reforço vinculada
        const rfLesson = await db.query('SELECT id FROM reinforcement_lessons WHERE trigger_lesson_id = $1', [triggerLessonId]);
        if (rfLesson.rows.length > 0) {
            const rfLessonId = rfLesson.rows[0].id;
            // Insere, ignorando se já existir (evita erros de duplicidade)
            await db.query(
                'INSERT INTO user_reinforcement_progress (user_id, reinforcement_lesson_id) VALUES ($1, $2) ON CONFLICT (user_id, reinforcement_lesson_id) DO NOTHING',
                [userId, rfLessonId]
            );
            return res.json({ unlocked: true, title: rfLesson.rows[0].title });
        }
        res.json({ unlocked: false });
    } catch (error) { res.status(500).json({ message: 'Erro no servidor.'}); }
});

// ROTA PARA GERAR CERTIFICADO
router.post('/generate-certificate', async (req, res) => {
    const { userId, subjectId, fullName } = req.body;
    try {
        await db.query(
            'INSERT INTO certificates (user_id, subject_id, full_name) VALUES ($1, $2, $3) ON CONFLICT (user_id, subject_id) DO UPDATE SET full_name = $3',
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