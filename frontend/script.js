// =================================================================================
// ARQUIVO script.js COMPLETO E FINAL
// =================================================================================

const API_URL = 'https://sapiens-backend-ogz2.onrender.com';

// --- ELEMENTOS GLOBAIS ---
const lessonView = document.getElementById('lesson-view');
const subjectsGrid = document.getElementById('subjects-grid');
let ytPlayer;

// --- ESTADO DO APLICATIVO ---
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');

// =================================================================================
// FUNÇÕES DE UTILIDADE E INICIALIZAÇÃO
// =================================================================================
function showView(viewId) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); document.getElementById(viewId)?.classList.add('active'); }
function scrollToElement(element) { if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

function initializeApp() {
    if (token && userId) {
        showView('subjects-view');
        fetchSubjects();
        setupUserAreaAndScores();
    } else {
        showView('login-view');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); showView('register-view'); });
    document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); showView('login-view'); });
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    initializeApp();
});

// =================================================================================
// LÓGICA DE AUTENTICAÇÃO E BARRA DE SCORE
// =================================================================================
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        localStorage.setItem('token', data.token); localStorage.setItem('username', data.username); localStorage.setItem('userId', data.userId);
        token = data.token; userId = data.userId;
        initializeApp();
    } catch (error) { alert(`Erro no login: ${error.message}`); }
}
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    try {
        const res = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
        alert('Registro bem-sucedido! Faça o login.');
        showView('login-view');
    } catch (error) { alert(`Erro no registro: ${error.message}`); }
}

function setupUserAreaAndScores() {
    document.getElementById('user-area').innerHTML = `<span>Olá, ${localStorage.getItem('username')}!</span><button id="logout-button">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', () => { localStorage.clear(); window.location.reload(); });
    
    const scoreContainer = document.getElementById('score-bar-container');
    scoreContainer.style.display = 'block';
    
    document.getElementById('score-toggle-btn').addEventListener('click', () => {
        const scorePanel = document.getElementById('score-panel');
        scorePanel.classList.toggle('visible');
        if (scorePanel.classList.contains('visible')) updateScores();
    });
}

async function updateScores() {
    try {
        const res = await fetch(`${API_URL}/api/content/scores/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` }});
        const scores = await res.json();
        const scoreList = document.getElementById('score-list');
        scoreList.innerHTML = '';
        scores.forEach(score => {
            const percentage = score.total_lessons > 0 ? ((score.user_score / score.total_lessons) * 100).toFixed(0) : 0;
            scoreList.innerHTML += `<li><span class="score-name" style="color:${score.color_hex};">${score.name}</span><span class="score-value">${score.user_score}/${score.total_lessons} (${percentage}%)</span></li>`;
        });
    } catch(error) { console.error("Erro ao atualizar scores:", error); }
}

// =================================================================================
// LÓGICA DE NAVEGAÇÃO (MATÉRIAS E LIÇÕES)
// =================================================================================
async function fetchSubjects() { /* ...código sem mudanças... */ }
async function loadLessons(subjectId, subjectName) { /* ...código sem mudanças... */ }

// =================================================================================
// LÓGICA DA TELA DE LIÇÃO E QUIZ
// =================================================================================
document.body.addEventListener('click', e => { if (e.target?.classList.contains('start-lesson-btn')) renderLessonContent(e.target.dataset.lessonId); });

async function renderLessonContent(lessonId) { /* ...código da função inteira sem mudanças... */ }

function createYouTubePlayer(lesson) { /* ...código sem mudanças... */ }

function showPostVideoContent() { /* ...código sem mudanças... */ }

async function renderQuiz(lesson) {
    const quizWrapper = document.getElementById('quiz-content-wrapper');
    quizWrapper.style.display = 'block';
    quizWrapper.innerHTML = '<div id="quiz-content"></div>';
    const quizContent = document.getElementById('quiz-content');
    scrollToElement(quizWrapper);
    
    let timerInterval, selectedOption = null;

    function startTimer(duration, display) {
        let timer = duration;
        display.textContent = `Tempo: ${timer}s`;
        timerInterval = setInterval(() => {
            timer--;
            display.textContent = `Tempo: ${timer}s`;
            if (timer <= 0) {
                clearInterval(timerInterval);
                const questionType = quizContent.querySelector('h3').textContent.includes('1') ? 'q1' : 'q2';
                const correctAnswer = questionType === 'q1' ? lesson.q1_options[0] : 'depende da variante';
                handleAnswer(questionType, correctAnswer, null, 'O tempo acabou!');
            }
        }, 1000);
    }
    
    function showFeedback(isCorrect, explanation) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'quiz-feedback';
        feedbackDiv.className = isCorrect ? 'correct' : 'incorrect';
        feedbackDiv.innerHTML = `<p>${explanation}</p><button id="next-question-btn"></button>`;
        quizContent.querySelector('#confirm-answer-btn').insertAdjacentElement('afterend', feedbackDiv);
        return feedbackDiv.querySelector('#next-question-btn');
    }

    async function handleAnswer(questionType, correctAnswer, selectedAnswerText, feedbackPrefix = '') {
        clearInterval(timerInterval);
        quizContent.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = true; });
        quizContent.querySelector('#confirm-answer-btn').disabled = true;
        const isCorrect = selectedAnswerText === correctAnswer;

        quizContent.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.textContent === correctAnswer) btn.classList.add('correct');
            if (btn === selectedOption && !isCorrect) btn.classList.add('incorrect');
        });
        
        if (questionType === 'q1') {
            const feedbackText = feedbackPrefix + (isCorrect ? " Correto! Este foi um treino." : " Incorreto. A resposta certa está em verde.");
            const nextBtn = showFeedback(isCorrect, feedbackText);
            nextBtn.textContent = "Iniciar Questão 2";
            nextBtn.addEventListener('click', renderQuestion2);
        } else if (questionType === 'q2') {
            const res = await fetch(`${API_URL}/api/content/submit-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId, lessonId: lesson.id, questionType: 'q2', isCorrect }) });
            const result = await res.json();
            const nextBtn = showFeedback(isCorrect, feedbackPrefix + " " + result.message);
            
            if (result.status === 'completed') {
                nextBtn.textContent = "Ver Próxima Lição";
                nextBtn.addEventListener('click', () => { updateScores(); loadLessons(lesson.subject_id, ''); });
            } else {
                nextBtn.textContent = "Voltar ao Vídeo";
                nextBtn.addEventListener('click', () => renderLessonContent(lesson.id));
            }
        }
    }
    
    async function renderQuestion2() {
        const progressRes = await fetch(`${API_URL}/api/content/start-lesson/${lesson.id}/user/${userId}`);
        const progress = await progressRes.json();
        
        if (progress.blocked_until && new Date() < new Date(progress.blocked_until)) {
            alert(`Lição bloqueada. Tente novamente em ${new Date(progress.blocked_until).toLocaleTimeString()}`);
            return loadLessons(lesson.subject_id, '');
        }

        const seenVariants = progress.q2_variants_seen || [];
        const availableVariants = [0, 1, 2].filter(i => !seenVariants.includes(i));
        if (availableVariants.length === 0) {
            alert('Você já tentou todas as variantes. Avançando com penalidade.');
            return loadLessons(lesson.subject_id, '');
        }

        const variantIndex = availableVariants[Math.floor(Math.random() * availableVariants.length)];
        const question = lesson.q2_variants[variantIndex];
        const correctAnswer = question.options[0];

        quizContent.innerHTML = `<h3>Questão 2 (Avaliativa)</h3><p>${question.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;
        const optionsContainer = quizContent.querySelector('.options-container');
        [...question.options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; });
        startTimer(lesson.q2_time, document.getElementById('timer'));
        
        selectedOption = null;
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (selectedOption) selectedOption.classList.remove('selected');
                selectedOption = btn;
                btn.classList.add('selected');
                quizContent.querySelector('#confirm-answer-btn').disabled = false;
            });
        });
        quizContent.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q2', correctAnswer, selectedOption ? selectedOption.textContent : null));
    }

    function renderQuestion1() {
        const correctAnswer = lesson.q1_options[0];
        quizContent.innerHTML = `<h3>Questão 1 (Treino)</h3><p>${lesson.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;
        const optionsContainer = quizContent.querySelector('.options-container');
        [...lesson.q1_options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; });
        startTimer(lesson.q1_time, document.getElementById('timer'));
        
        selectedOption = null;
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (selectedOption) selectedOption.classList.remove('selected');
                selectedOption = btn;
                btn.classList.add('selected');
                quizContent.querySelector('#confirm-answer-btn').disabled = false;
            });
        });
        quizContent.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q1', correctAnswer, selectedOption ? selectedOption.textContent : null));
    }
    renderQuestion1();
}