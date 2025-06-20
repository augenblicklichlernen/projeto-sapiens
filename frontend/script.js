// =================================================================================
// SAPIENS - script.js - VERSÃO FINAL ESTÁVEL - 20/06
// =================================================================================

// --- 1. CONFIGURAÇÃO E ESTADO GLOBAL ---
const API_URL = 'https://sapiens-backend-ogz2.onrender.com';
let token;
let userId;
let ytPlayer;
let lessonView;
let subjectsGrid;

// --- PONTO DE ENTRADA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', initializeApp);


// =================================================================================
// 2. DEFINIÇÃO DE TODAS AS FUNÇÕES
// =================================================================================

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(viewId);
    if(view) view.classList.add('active');
}

function scrollToElement(element) {
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.userId);
        initializeApp();
    } catch (error) {
        alert(`Erro no login: ${error.message}`);
    }
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
    } catch (error) {
        alert(`Erro no registro: ${error.message}`);
    }
}

function setupUserAreaAndScores() {
    const userArea = document.getElementById('user-area');
    userArea.innerHTML = `<span>Olá, ${localStorage.getItem('username')}!</span><button id="logout-button">Sair</button>`;
    
    const scoreContainer = document.getElementById('score-bar-container');
    if (scoreContainer) scoreContainer.style.display = 'flex';
    
    const headerRightGroup = document.querySelector('.header-right-group');
    let certButton = document.getElementById('my-certs-btn');
    if (headerRightGroup && !certButton) {
        certButton = document.createElement('button');
        certButton.id = 'my-certs-btn';
        certButton.textContent = 'Meus Certificados';
        scoreContainer.insertAdjacentElement('afterend', certButton);
    }
}

async function updateScores() {
    const scoreList = document.getElementById('score-list');
    if (!scoreList) return;
    try {
        const res = await fetch(`${API_URL}/api/content/scores/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Falha ao buscar scores');
        const scores = await res.json();
        scoreList.innerHTML = '';
        if (scores && scores.length > 0) {
            scores.forEach(score => {
                const percentage = score.total_lessons > 0 ? ((score.user_score / score.total_lessons) * 100).toFixed(0) : 0;
                scoreList.innerHTML += `<li><span class="score-name" style="color:${score.color_hex};">${score.name}</span><span class="score-value">${score.user_score}/${score.total_lessons} (${percentage}%)</span></li>`;
            });
        }
    } catch(error) {
        console.error("Erro ao atualizar scores:", error);
        scoreList.innerHTML = '<li>Erro ao carregar.</li>';
    }
}

async function fetchSubjects() {
    if (!subjectsGrid) return;
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar matérias.');
        const data = await response.json();
        subjectsGrid.innerHTML = '';
        if (data.main && data.main.length > 0) {
            data.main.forEach(subject => {
                const card = document.createElement('div'); card.className = 'subject-card'; card.style.setProperty('--subject-color', subject.color_hex); card.innerHTML = `<h3>${subject.name}</h3>`; card.addEventListener('click', () => loadLessons(subject.id, subject.name)); subjectsGrid.appendChild(card);
            });
        }
        let extraContainer = document.getElementById('extra-subjects-container');
        if (!extraContainer) { extraContainer = document.createElement('div'); extraContainer.id = 'extra-subjects-container'; subjectsGrid.insertAdjacentElement('afterend', extraContainer); }
        extraContainer.innerHTML = '';
        if (data.extra && data.extra.length > 0) {
            extraContainer.innerHTML = '<hr><h2>Matérias Extras</h2>';
            data.extra.forEach(subject => {
                const card = document.createElement('div'); card.className = 'subject-card extra'; card.style.setProperty('--subject-color', subject.color_hex); card.innerHTML = `<h3>${subject.name}</h3>`; card.addEventListener('click', () => loadLessons(subject.id, subject.name)); extraContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erro em fetchSubjects:', error);
        if (subjectsGrid) subjectsGrid.innerHTML = '<p>Erro ao carregar matérias.</p>';
    }
}

async function loadLessons(subjectId, subjectName) {
    if (!lessonView) return;
    showView('lesson-view');
    lessonView.innerHTML = '<h2>Carregando...</h2>';
    try {
        const response = await fetch(`${API_URL}/api/content/lessons/${subjectId}`);
        if (!response.ok) throw new Error('Falha ao buscar lições.');
        const lessons = await response.json();
        let title = subjectName ? `<h2>${subjectName}</h2>` : '';
        let backBtn = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button>`;
        if (lessons.length === 0) { lessonView.innerHTML = `${backBtn}${title}<h2>Nenhuma lição disponível.</h2>`; return; }
        lessonView.innerHTML = `${backBtn}${title}<ul class="lesson-list"></ul>`;
        const lessonList = lessonView.querySelector('.lesson-list');
        lessons.forEach(lesson => {
            const item = document.createElement('li'); item.className = 'lesson-item'; item.innerHTML = `<span>Lição ${lesson.lesson_order}: ${lesson.title}</span><button class="start-lesson-btn" data-lesson-id="${lesson.id}">Iniciar</button>`; lessonList.appendChild(item);
        });
    } catch (error) { console.error('Erro em loadLessons:', error); lessonView.innerHTML = `<h2>Erro.</h2><p>${error.message}</p>`; }
}

async function fetchReinforcementLessons() {
    const reinforcementSection = document.getElementById('reinforcement-section');
    const reinforcementList = document.getElementById('reinforcement-list');
    if (!reinforcementSection || !reinforcementList) return;
    try {
        const res = await fetch(`${API_URL}/api/content/reinforcement/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const lessons = await res.json();
        if (lessons.length > 0) {
            reinforcementSection.style.display = 'block';
            reinforcementList.innerHTML = '';
            lessons.forEach(lesson => {
                const card = document.createElement('div');
                card.className = 'subject-card reinforcement-card';
                card.style.borderColor = '#4299e1';
                card.innerHTML = `<h3>${lesson.title}</h3>`;
                card.dataset.lessonId = lesson.id;
                reinforcementList.appendChild(card);
            });
        } else {
            reinforcementSection.style.display = 'none';
        }
    } catch (error) { console.error("Erro ao buscar lições de reforço:", error); }
}

async function renderLessonContent(lessonId) {
    if (!lessonView) return;
    showView('lesson-view');
    lessonView.innerHTML = `<h2>Carregando...</h2>`;
    try {
        const res = await fetch(`${API_URL}/api/content/lesson-detail/${lessonId}`);
        const lesson = await res.json();
        lessonView.innerHTML = `<button class="back-btn" onclick="loadLessons(${lesson.subject_id}, '')">← Voltar</button><div id="lesson-main-content"><h2>${lesson.title}</h2><div id="video-placeholder"></div><div id="post-video-content" style="display:none;"><hr><h3>Recursos</h3><img src="${lesson.image_url}" alt="Imagem da lição"><br/><audio controls src="${lesson.audio_url}"></audio><br/><button id="show-text-btn">Ver Explicação</button></div><div id="text-content" style="display:none;"><hr><h3>Explicação</h3><div>${lesson.lesson_text}</div><button id="start-quiz-btn">Iniciar Questões</button></div></div><div id="quiz-content-wrapper" style="display:none;"></div>`;
        createYouTubePlayer(lesson);
    } catch (error) { lessonView.innerHTML = `<h2>Erro.</h2><p>${error.message}</p>`; }
}

function createYouTubePlayer(lesson) {
    let interval;
    try {
        const videoId = new URL(lesson.video_url).searchParams.get('v');
        ytPlayer = new YT.Player('video-placeholder', { height: '480', width: '100%', videoId: videoId, events: { 'onStateChange': e => { if (e.data === YT.PlayerState.PLAYING) { interval = setInterval(() => { const duration = ytPlayer.getDuration(); if (duration > 0 && (ytPlayer.getCurrentTime() / duration) >= 0.8) { showPostVideoContent(); clearInterval(interval); } }, 1000); } else { clearInterval(interval); } } } });
    } catch(e) { console.error("URL do vídeo inválida:", lesson.video_url); document.getElementById('video-placeholder').innerHTML = '<p>Vídeo indisponível.</p>'; }
    document.getElementById('show-text-btn')?.addEventListener('click', () => { const el = document.getElementById('text-content'); el.style.display = 'block'; scrollToElement(el); });
    document.getElementById('start-quiz-btn')?.addEventListener('click', () => { document.getElementById('lesson-main-content').style.display = 'none'; renderQuiz(lesson); });
}

function showPostVideoContent() {
    const el = document.getElementById('post-video-content');
    if (el && el.style.display === 'none') { el.style.display = 'block'; scrollToElement(el); }
}

async function renderQuiz(lesson) {
    fetch(`${API_URL}/api/content/unlock-reinforcement`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, triggerLessonId: lesson.id }) }).then(res => res.json()).then(data => { if (data.unlocked) { showReinforcementToast(data.title); fetchReinforcementLessons(); } });
    const quizWrapper = document.getElementById('quiz-content-wrapper');
    quizWrapper.style.display = 'block'; quizWrapper.innerHTML = '<div id="quiz-content"></div>';
    const quizContent = document.getElementById('quiz-content');
    scrollToElement(quizWrapper);
    let timerInterval, selectedOption = null;
    function startTimer(duration, display, onTimeUp) { let timer = duration; display.textContent = `Tempo: ${timer}s`; timerInterval = setInterval(() => { timer--; display.textContent = `Tempo: ${timer}s`; if (timer <= 0) { clearInterval(timerInterval); onTimeUp(); } }, 1000); }
    function showFeedback(isCorrect, explanation) { const feedbackDiv = document.createElement('div'); feedbackDiv.id = 'quiz-feedback'; feedbackDiv.className = isCorrect ? 'correct' : 'incorrect'; feedbackDiv.innerHTML = `<p>${explanation}</p><button id="next-question-btn"></button>`; const confirmBtn = quizContent.querySelector('#confirm-answer-btn'); if (confirmBtn) { confirmBtn.style.display = 'none'; confirmBtn.insertAdjacentElement('afterend', feedbackDiv); } return feedbackDiv.querySelector('#next-question-btn'); }
    async function handleAnswer(questionType, correctAnswer, selectedAnswerText, feedbackPrefix = '') { clearInterval(timerInterval); quizContent.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = true; }); quizContent.querySelector('#confirm-answer-btn').disabled = true; const isCorrect = selectedAnswerText === correctAnswer; quizContent.querySelectorAll('.option-btn').forEach(btn => { if (btn.textContent === correctAnswer) btn.classList.add('correct'); if (btn === selectedOption && !isCorrect) btn.classList.add('incorrect'); }); if (questionType === 'q1') { const feedbackText = feedbackPrefix + (isCorrect ? " Correto! Este foi um treino." : " Incorreto. A resposta certa está em verde."); const nextBtn = showFeedback(isCorrect, feedbackText); nextBtn.textContent = "Iniciar Questão 2"; nextBtn.addEventListener('click', renderQuestion2); } else if (questionType === 'q2') { const res = await fetch(`${API_URL}/api/content/submit-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, lessonId: lesson.id, isCorrect }) }); const result = await res.json(); const nextBtn = showFeedback(isCorrect, feedbackPrefix + " " + result.message); if (result.status === 'completed') { nextBtn.textContent = "Ver Próxima Lição"; nextBtn.addEventListener('click', () => { updateScores(); loadLessons(lesson.subject_id, ''); }); } else if (result.status === 'subject_finished') { nextBtn.textContent = "Gerar Certificado"; nextBtn.addEventListener('click', () => handleSubjectFinished(result.subjectId)); } else { nextBtn.textContent = "Voltar ao Vídeo"; nextBtn.addEventListener('click', () => renderLessonContent(lesson.id)); } } }
    async function renderQuestion2() { const progressRes = await fetch(`${API_URL}/api/content/start-lesson/${lesson.id}/user/${userId}`); if(!progressRes.ok) { alert('Erro de comunicação.'); return; } const progress = await progressRes.json(); if (progress.blocked_until && new Date() < new Date(progress.blocked_until)) { alert(`Lição bloqueada. Tente novamente em ${new Date(progress.blocked_until).toLocaleTimeString()}`); return loadLessons(lesson.subject_id, ''); } const seenVariants = progress.q2_variants_seen || []; const availableVariants = [0, 1, 2].filter(i => !seenVariants.includes(i)); if (availableVariants.length === 0) { alert('Você já tentou todas as variantes. Avançando com penalidade.'); return loadLessons(lesson.subject_id, ''); } const variantIndex = availableVariants[Math.floor(Math.random() * availableVariants.length)]; const question = lesson.q2_variants[variantIndex]; const correctAnswer = question.options[0]; quizContent.innerHTML = `<h3>Questão 2 (Avaliativa)</h3><p>${question.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`; const optionsContainer = quizContent.querySelector('.options-container'); const timerDisplay = document.getElementById('timer'); const onTimeUp = () => handleAnswer('q2', correctAnswer, null, 'O tempo acabou!'); startTimer(lesson.q2_time, timerDisplay, onTimeUp); [...question.options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; }); selectedOption = null; optionsContainer.querySelectorAll('.option-btn').forEach(btn => { btn.addEventListener('click', () => { if (selectedOption) selectedOption.classList.remove('selected'); selectedOption = btn; btn.classList.add('selected'); quizContent.querySelector('#confirm-answer-btn').disabled = false; }); }); quizContent.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q2', correctAnswer, selectedOption ? selectedOption.textContent : null)); }
    function renderQuestion1() { const correctAnswer = lesson.q1_options[0]; quizContent.innerHTML = `<h3>Questão 1 (Treino)</h3><p>${lesson.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`; const optionsContainer = quizContent.querySelector('.options-container'); const timerDisplay = document.getElementById('timer'); const onTimeUp = () => handleAnswer('q1', correctAnswer, null, 'O tempo acabou!'); startTimer(lesson.q1_time, timerDisplay, onTimeUp); [...lesson.q1_options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; }); selectedOption = null; optionsContainer.querySelectorAll('.option-btn').forEach(btn => { btn.addEventListener('click', () => { if (selectedOption) selectedOption.classList.remove('selected'); selectedOption = btn; btn.classList.add('selected'); quizContent.querySelector('#confirm-answer-btn').disabled = false; }); }); quizContent.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q1', correctAnswer, selectedOption ? selectedOption.textContent : null)); }
    renderQuestion1();
}

async function renderReinforcementLesson(lessonId) {
    if (!lessonView) return;
    showView('lesson-view');
    lessonView.innerHTML = `<h2>Carregando...</h2>`;
    try {
        const res = await fetch(`${API_URL}/api/content/reinforcement-lesson/${lessonId}`);
        if (!res.ok) throw new Error("Não foi possível carregar a lição de reforço.");
        const rfLesson = await res.json();
        const content = rfLesson.content;
        let html = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button><h2>Reforço: ${rfLesson.title}</h2>`;
        if (content.video_url) { html += `<div id="video-placeholder"><iframe width="100%" height="480" src="${content.video_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe></div>`; }
        if (content.image_url) { html += `<img src="${content.image_url}" alt="Imagem de reforço" style="max-width: 100%; margin-top: 20px;">`; }
        if (content.audio_url) { html += `<audio controls src="${content.audio_url}" style="width: 100%; margin-top: 10px;"></audio>`; }
        if (content.text) { html += `<div style="margin-top: 20px;">${content.text}</div>`; }
        if (content.questions && content.questions.length > 0) {
            html += `<hr style="margin-top: 30px;"><h3>Questões de Treino</h3>`;
            content.questions.forEach((q, index) => {
                html += `<div class="quiz-question" style="margin-bottom: 30px;" data-correct-answer="${q.options[0]}"><h4>Questão ${index + 1}</h4>Questão ${index + 1}</h4><p>${q.text}</p><div class="options-container">${q.options.map(opt => `<button class="option-btn">${opt}</button>`).join('')}</div></div>`;
            });
        }
        lessonView.innerHTML = html;
 // ADICIONE ESTE BLOCO PARA DAR VIDA AOS BOTÕES
    lessonView.querySelectorAll('.quiz-question .option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const questionBlock = btn.closest('.quiz-question');
            const correctAnswer = questionBlock.dataset.correctAnswer; // Pega a resposta correta do HTML
            const selectedAnswer = btn.textContent;
            const feedbackDiv = questionBlock.querySelector('.rf-feedback');

            // Desabilita todos os botões da questão para impedir nova resposta
            questionBlock.querySelectorAll('.option-btn').forEach(b => b.disabled = true);

            // Lógica de verificação e feedback visual
            if (selectedAnswer === correctAnswer) {
                btn.classList.add('correct');
                feedbackDiv.textContent = 'Resposta Correta!';
                feedbackDiv.className = 'rf-feedback correct';
            } else {
                btn.classList.add('incorrect');
                feedbackDiv.textContent = `Incorreto. A resposta certa era: ${correctAnswer}`;
                feedbackDiv.className = 'rf-feedback incorrect';
            }
            feedbackDiv.style.display = 'block';
        });
    });

} catch (error) { // ...
        // Adiciona interatividade aos botões da lição de reforço
        lessonView.querySelectorAll('.quiz-question .option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const parentOptions = btn.closest('.options-container');
                parentOptions.querySelectorAll('.option-btn').forEach(otherBtn => otherBtn.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

// ADICIONE ESTE BLOCO PARA DAR VIDA AOS BOTÕES DE REFORÇO
    lessonView.querySelectorAll('.quiz-question .option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const questionBlock = btn.closest('.quiz-question');
            const correctAnswer = "A resposta correta viria do seu 'content' no DB"; // Placeholder
            
            // Desabilita todos os botões da questão
            questionBlock.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
            
            // Marca a selecionada como verde (sem verificação, já que é treino)
            btn.classList.add('correct');
        });
    });


    } catch (error) {
        console.error("Erro ao renderizar lição de reforço:", error);
        lessonView.innerHTML = `<h2>Erro ao carregar lição de reforço.</h2>`;
    }
}

function showReinforcementToast(title) {
    let toast = document.getElementById('reinforcement-toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'reinforcement-toast'; document.body.appendChild(toast); }
    toast.textContent = `Nova lição de reforço desbloqueada: ${title}!`;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 5000);
}

async function handleSubjectFinished(subjectId) {
    const fullName = prompt("Parabéns! Você concluiu todas as lições desta matéria!\n\nPara gerar seu certificado, por favor, insira seu nome completo:", "");
    if (fullName && fullName.trim() && fullName.length <= 40) {
        try {
            await fetch(`${API_URL}/api/content/generate-certificate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, subjectId, fullName: fullName.trim() }) });
            alert('Certificado gerado! Acesse em "Meus Certificados".');
            loadLessons(subjectId, "");
        } catch (error) { alert("Houve um erro ao gerar seu certificado."); }
    } else if (fullName) { alert("Nome inválido (máximo 40 caracteres)."); }
}

async function loadCertificates() {
    showView('certificates-view');
    const list = document.getElementById('certificates-list');
    list.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`${API_URL}/api/content/certificates/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const certs = await res.json();
        list.innerHTML = '';
        if (certs.length === 0) { list.innerHTML = '<p>Você ainda não possui certificados.</p>'; return; }
        certs.forEach(cert => {
            const item = document.createElement('div');
            item.className = 'subject-card certificate-card';
            item.innerHTML = `<h3>Certificado: ${cert.subject_name}</h3>`;
            item.dataset.certData = JSON.stringify(cert);
            list.appendChild(item);
        });
    } catch (e) {
        list.innerHTML = 'Erro ao carregar.';
    }
}

function showCertificate(cert) {
    const modal = document.getElementById('certificate-modal');
    const content = document.getElementById('certificate-content');
    content.innerHTML = `<button id="print-cert-btn" onclick="window.print()">🖨️</button><button id="close-modal-btn">X</button><div id="certificate-text"><p style="font-size: 1.5rem; margin-bottom: 30px;">Certificado de Conclusão</p><p>Certificamos que</p><p style="font-size: 2rem; font-family: 'Brush Script MT', cursive; margin: 20px 0;">${cert.full_name}</p><p>concluiu a matéria <strong style="color: #333;">${cert.subject_name}</strong> no Projeto Sapiens,<br>pelo método Augenblicklich-Lernen.</p><p>Total de lições concluídas: ${cert.total_lessons}</p><p style="font-size: 4rem; margin-top: 20px;">🏅</p></div>`;
    modal.classList.add('visible');
}

// =================================================================================
// 4. INICIALIZAÇÃO E CONFIGURAÇÃO DE EVENTOS (VERSÃO FINAL CORRIGIDA)
// =================================================================================

function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const targetId = target.id;

        // Botões de navegação de Login/Registro
        if (targetId === 'show-register') { e.preventDefault(); showView('register-view'); }
        if (targetId === 'show-login') { e.preventDefault(); showView('login-view'); }
        if (targetId === 'login-button') { showView('login-view'); }

        // Botão para iniciar uma lição principal
        if (target.classList.contains('start-lesson-btn')) {
            renderLessonContent(target.dataset.lessonId);
        }

        // Botão "Meu Score" no cabeçalho
        if (targetId === 'score-toggle-btn') {
            const panel = document.getElementById('score-panel');
            if(panel) panel.classList.toggle('visible');
            if (panel && panel.classList.contains('visible')) {
                updateScores();
            }
        }

        // Botão "Meus Certificados" no cabeçalho
        if (targetId === 'my-certs-btn') {
            loadCertificates();
        }

        // Card de um certificado específico na lista
        const certCard = target.closest('.certificate-card');
        if (certCard && certCard.dataset.certData) {
            showCertificate(JSON.parse(certCard.dataset.certData));
        }

        // Card de uma lição de reforço na lista
        const reinforcementCard = target.closest('.reinforcement-card');
        if (reinforcementCard && reinforcementCard.dataset.lessonId) {
            renderReinforcementLesson(reinforcementCard.dataset.lessonId);
        }
        
        // Botão de fechar o modal do certificado
        if (target.id === 'close-modal-btn') {
            document.getElementById('certificate-modal').classList.remove('visible');
        }
    });

    // Ouvinte para os formulários
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') { handleLogin(e); }
        if (e.target.id === 'register-form') { handleRegister(e); }
    });
}

function initializeApp() {
    // Define as variáveis globais de elementos do DOM
    lessonView = document.getElementById('lesson-view');
    subjectsGrid = document.getElementById('subjects-grid');

    // Pega os dados de autenticação do armazenamento local
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');
    
    // Configura TODOS os ouvintes de eventos
    setupEventListeners();

    // Decide qual tela mostrar
    if (token && userId) {
        showView('subjects-view');
        fetchSubjects();
        fetchReinforcementLessons();
        setupUserAreaAndScores();
    } else {
        showView('login-view');
        const userArea = document.getElementById('user-area');
        if(userArea) userArea.innerHTML = '<button id="login-button">Entrar</button>';
    }
}