// =================================================================================
// ARQUIVO script.js COMPLETO (Versão FINAL CORRIGIDA)
// =================================================================================

const API_URL = 'https://sapiens-backend-ogz2.onrender.com';

// --- ELEMENTOS GLOBAIS ---
const appContent = document.getElementById('app-content');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const subjectsView = document.getElementById('subjects-view');
const lessonView = document.getElementById('lesson-view');
const subjectsGrid = document.getElementById('subjects-grid');
let ytPlayer; // Variável global para o player do YouTube

// --- ESTADO DO APLICATIVO ---
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');

// =================================================================================
// FUNÇÕES DE UTILIDADE
// =================================================================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) viewToShow.classList.add('active');
}

function scrollToElement(element) {
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


// =================================================================================
// LÓGICA DE AUTENTICAÇÃO
// =================================================================================
function setupAuthListeners() {
    document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); showView('register-view'); });
    document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); showView('login-view'); });
    
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.userId);
        token = data.token;
        userId = data.userId;
        initializeApp();
    } catch (error) { alert(`Erro no login: ${error.message}`); }
}
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        if (!response.ok) {
            const errorData = await response.json(); throw new Error(errorData.message);
        }
        alert('Registro bem-sucedido! Faça o login.');
        showView('login-view');
    } catch (error) { alert(`Erro no registro: ${error.message}`); }
}


// =================================================================================
// LÓGICA PRINCIPAL DO APLICATIVO
// =================================================================================

// --- TELA DE MATÉRIAS ---
async function fetchSubjects() {
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`, { headers: { 'Authorization': `Bearer ${token}` } });
        const subjects = await response.json();
        subjectsGrid.innerHTML = '';
        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.style.setProperty('--subject-color', subject.color_hex);
            card.innerHTML = `<h3>${subject.name}</h3>`;
            card.addEventListener('click', () => loadLessons(subject.id, subject.name));
            subjectsGrid.appendChild(card);
        });
    } catch (error) { console.error('Erro ao buscar matérias:', error); }
}

// --- TELA DE LIÇÕES ---
async function loadLessons(subjectId, subjectName) {
    showView('lesson-view');
    lessonView.innerHTML = '<h2>Carregando lições...</h2>';
    try {
        const response = await fetch(`${API_URL}/api/content/lessons/${subjectId}`);
        const lessons = await response.json();
        if (lessons.length === 0) {
            lessonView.innerHTML = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button><h2>Nenhuma lição disponível.</h2>`;
            return;
        }
        let subjectTitle = subjectName ? `<h2>${subjectName}</h2>` : '';
        lessonView.innerHTML = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar para Matérias</button>${subjectTitle}<ul class="lesson-list">`;
        const lessonList = lessonView.querySelector('.lesson-list');
        lessons.forEach(lesson => {
            lessonList.innerHTML += `<li class="lesson-item"><span>Lição ${lesson.lesson_order}: ${lesson.title}</span><button class="start-lesson-btn" data-lesson-id="${lesson.id}">Iniciar</button></li>`;
        });
    } catch (error) { lessonView.innerHTML = `<h2>Erro ao carregar.</h2><p>${error.message}</p>`; }
}


// --- TELA DE CONTEÚDO DA LIÇÃO E QUIZ ---
document.body.addEventListener('click', async e => {
    if (e.target && e.target.classList.contains('start-lesson-btn')) {
        const lessonId = e.target.dataset.lessonId;
        renderLessonContent(lessonId);
    }
});

async function renderLessonContent(lessonId) {
    showView('lesson-view');
    lessonView.innerHTML = `<h2>Carregando lição...</h2>`;
    try {
        const lessonRes = await fetch(`${API_URL}/api/content/lesson-detail/${lessonId}`);
        const lesson = await lessonRes.json();
        
        lessonView.innerHTML = `
            <button class="back-btn" onclick="loadLessons(${lesson.subject_id}, '')">← Voltar para Lições</button>
            <div id="lesson-content-area"><h2>${lesson.title}</h2><div id="video-placeholder"></div></div>
            <div id="post-video-content" style="display:none;"><hr><h3>Recursos Adicionais</h3><img src="${lesson.image_url}" alt="Imagem da lição" style="max-width: 100%; border-radius: 8px;"><br/><audio controls src="${lesson.audio_url}"></audio><br/><button id="show-text-btn">Ver Explicação Escrita</button></div>
            <div id="text-content" style="display:none;"><hr><h3>Explicação Detalhada</h3><div>${lesson.lesson_text}</div><button id="start-quiz-btn">Iniciar Questões</button></div>
            <div id="quiz-content" style="display:none;"></div>`;
        
        createYouTubePlayer(lesson);
    } catch (error) { lessonView.innerHTML = `<h2>Erro ao carregar.</h2><p>${error.message}</p>`; }
}

// --- LÓGICA DO PLAYER DE VÍDEO ---
function createYouTubePlayer(lesson) {
    const videoId = new URL(lesson.video_url).searchParams.get('v');
    let progressCheckInterval;

    ytPlayer = new YT.Player('video-placeholder', {
        height: '480', width: '100%', videoId: videoId, playerVars: { 'origin': window.location.origin },
        events: {
            'onStateChange': (event) => {
                if (event.data == YT.PlayerState.PLAYING) {
                    const duration = ytPlayer.getDuration();
                    progressCheckInterval = setInterval(() => {
                        const currentTime = ytPlayer.getCurrentTime();
                        if (duration > 0 && (currentTime / duration) >= 0.8) {
                            showPostVideoContent();
                            clearInterval(progressCheckInterval);
                        }
                    }, 1000);
                } else {
                    clearInterval(progressCheckInterval);
                }
            }
        }
    });
    
    document.getElementById('show-text-btn').addEventListener('click', () => {
        const textContent = document.getElementById('text-content');
        textContent.style.display = 'block';
        scrollToElement(textContent);
    });
    document.getElementById('start-quiz-btn').addEventListener('click', () => renderQuiz(lesson));
}

function showPostVideoContent() {
    const postVideoContent = document.getElementById('post-video-content');
    if (postVideoContent.style.display === 'none') {
        postVideoContent.style.display = 'block';
        scrollToElement(postVideoContent);
    }
}

// --- LÓGICA COMPLETA DO QUIZ ---
async function renderQuiz(lesson) {
    const quizContent = document.getElementById('quiz-content');
    quizContent.style.display = 'block';
    scrollToElement(quizContent);
    
    let timerInterval;
    let selectedOption = null;

    function startTimer(duration, display) {
        let timer = duration;
        display.textContent = `Tempo: ${timer}s`;
        timerInterval = setInterval(() => {
            timer--;
            display.textContent = `Tempo: ${timer}s`;
            if (timer <= 0) {
                clearInterval(timerInterval);
                handleAnswer('q1', lesson.q1_options[0], null, 'O tempo acabou!');
            }
        }, 1000);
    }

    function showFeedback(isCorrect, explanation) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'quiz-feedback';
        feedbackDiv.className = isCorrect ? 'correct' : 'incorrect';
        feedbackDiv.innerHTML = `<p>${explanation}</p>`;
        
        const confirmBtn = document.getElementById('confirm-answer-btn');
        if(confirmBtn) confirmBtn.insertAdjacentElement('afterend', feedbackDiv);
        
        const nextBtn = document.createElement('button');
        nextBtn.id = 'next-question-btn';
        feedbackDiv.appendChild(nextBtn);
        
        return nextBtn;
    }

    async function handleAnswer(questionType, correctAnswer, selectedAnswerText, feedbackPrefix = '') {
        clearInterval(timerInterval);
        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
        document.getElementById('confirm-answer-btn').disabled = true;

        const isCorrect = selectedAnswerText === correctAnswer;

        document.querySelectorAll('.option-btn').forEach(btn => {
            if (btn.textContent === correctAnswer) btn.classList.add('correct');
            if (btn === selectedOption && !isCorrect) btn.classList.add('incorrect');
        });
        
        if (questionType === 'q1') {
            const feedbackText = feedbackPrefix + (isCorrect ? " Resposta Correta! Este foi um treino." : " Resposta Incorreta. A resposta correta está em verde.");
            const nextBtn = showFeedback(isCorrect, feedbackText);
            nextBtn.textContent = "Iniciar Questão 2";
            nextBtn.addEventListener('click', () => renderQuestion2());
        } else if (questionType === 'q2') {
            const response = await fetch(`${API_URL}/api/content/submit-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, lessonId: lesson.id, questionType: 'q2', isCorrect })
            });
            const result = await response.json();
            const nextBtn = showFeedback(isCorrect, feedbackPrefix + " " + result.message);
            
            if (result.status === 'completed') {
                nextBtn.textContent = "Ver Próxima Lição";
                nextBtn.addEventListener('click', () => loadLessons(lesson.subject_id, ''));
            } else if (result.status === 'retry' || result.status === 'blocked') {
                nextBtn.textContent = "Voltar para o Vídeo";
                nextBtn.addEventListener('click', () => renderLessonContent(lesson.id));
            }
        }
    }
    
    async function renderQuestion2() {
        const progressRes = await fetch(`${API_URL}/api/content/start-lesson/${lesson.id}/user/${userId}`);
        const progress = await progressRes.json();
        
        if (progress.blocked_until) {
            const now = new Date();
            const blockedUntil = new Date(progress.blocked_until);
            if (now < blockedUntil) {
                alert(`Lição bloqueada. Tente novamente em ${blockedUntil.toLocaleTimeString()}`);
                loadLessons(lesson.subject_id, '');
                return;
            }
        }

        const seenVariants = progress.q2_variants_seen || [];
        const availableVariants = [0, 1, 2].filter(i => !seenVariants.includes(i));
        
        if (availableVariants.length === 0) {
            alert('Você já tentou todas as variantes. Avançando com penalidade.');
            loadLessons(lesson.subject_id, '');
            return;
        }

        const variantIndex = availableVariants[Math.floor(Math.random() * availableVariants.length)];
        const question = lesson.q2_variants[variantIndex];
        const correctAnswer = question.options[0];

        quizContent.innerHTML = `<h3>Questão 2 (Avaliativa)</h3><p>${question.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;
        const optionsContainer = quizContent.querySelector('.options-container');
        const timerDisplay = document.getElementById('timer');
        
        const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; });
        startTimer(lesson.q2_time, timerDisplay);
        
        selectedOption = null;
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (selectedOption) selectedOption.classList.remove('selected');
                selectedOption = btn;
                selectedOption.classList.add('selected');
                document.getElementById('confirm-answer-btn').disabled = false;
            });
        });

        document.getElementById('confirm-answer-btn').addEventListener('click', () => { handleAnswer('q2', correctAnswer, selectedOption ? selectedOption.textContent : null); });
    }

    function renderQuestion1() {
        const correctAnswer = lesson.q1_options[0];
        quizContent.innerHTML = `<h3>Questão 1 (Treino)</h3><p>${lesson.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;
        const optionsContainer = quizContent.querySelector('.options-container');
        const timerDisplay = document.getElementById('timer');
        
        const shuffledOptions = [...lesson.q1_options].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; });
        startTimer(lesson.q1_time, timerDisplay);
        
        selectedOption = null;
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (selectedOption) selectedOption.classList.remove('selected');
                selectedOption = btn;
                selectedOption.classList.add('selected');
                document.getElementById('confirm-answer-btn').disabled = false;
            });
        });
        document.getElementById('confirm-answer-btn').addEventListener('click', () => { handleAnswer('q1', correctAnswer, selectedOption ? selectedOption.textContent : null); });
    }
    renderQuestion1();
}


// =================================================================================
// INICIALIZAÇÃO DO APLICATIVO
// =================================================================================
function initializeApp() {
    if (token && userId) {
        showView('subjects-view');
        fetchSubjects();
        const userArea = document.getElementById('user-area');
        userArea.innerHTML = `<span>Olá, ${localStorage.getItem('username')}!</span><button id="logout-button">Sair</button>`;
        document.getElementById('logout-button').addEventListener('click', () => {
            localStorage.clear(); window.location.reload();
        });
    } else {
        showView('login-view');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    initializeApp();
});