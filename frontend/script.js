// =================================================================================
// ARQUIVO script.js (VERSÃO FINAL LEGÍVEL E CORRIGIDA)
// =================================================================================

const API_URL = 'https://sapiens-backend-ogz2.onrender.com';
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');
let ytPlayer;

function showView(viewId) { document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); const view = document.getElementById(viewId); if(view) view.classList.add('active'); }
function scrollToElement(element) { if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

async function handleLogin(e) { e.preventDefault(); const username = document.getElementById('login-username').value; const password = document.getElementById('login-password').value; try { const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); const data = await res.json(); if (!res.ok) throw new Error(data.message); localStorage.setItem('token', data.token); localStorage.setItem('username', data.username); localStorage.setItem('userId', data.userId); initializeApp(); } catch (error) { alert(`Erro no login: ${error.message}`); } }
async function handleRegister(e) { e.preventDefault(); const username = document.getElementById('register-username').value; const password = document.getElementById('register-password').value; try { const res = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.message); } alert('Registro bem-sucedido! Faça o login.'); showView('login-view'); } catch (error) { alert(`Erro no registro: ${error.message}`); } }

function setupUserAreaAndScores() {
    const userArea = document.getElementById('user-area');
    userArea.innerHTML = `<span>Olá, ${localStorage.getItem('username')}!</span><button id="logout-button">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', () => { localStorage.clear(); window.location.reload(); });
    const scoreContainer = document.getElementById('score-bar-container');
    if (scoreContainer) scoreContainer.style.display = 'flex';
    document.getElementById('score-toggle-btn')?.addEventListener('click', () => { const panel = document.getElementById('score-panel'); panel.classList.toggle('visible'); if (panel.classList.contains('visible')) updateScores(); });
    const headerRightGroup = document.querySelector('.header-right-group');
    if (headerRightGroup && !document.getElementById('my-certs-btn')) {
        const certButton = document.createElement('button');
        certButton.id = 'my-certs-btn';
        certButton.textContent = 'Meus Certificados';
        certButton.onclick = loadCertificates;
        scoreContainer.insertAdjacentElement('afterend', certButton);
    }
}
async function updateScores() { try { const res = await fetch(`${API_URL}/api/content/scores/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } }); if (!res.ok) throw new Error('Falha ao buscar scores'); const scores = await res.json(); const scoreList = document.getElementById('score-list'); scoreList.innerHTML = ''; scores.forEach(score => { const percentage = score.total_lessons > 0 ? ((score.user_score / score.total_lessons) * 100).toFixed(0) : 0; scoreList.innerHTML += `<li><span class="score-name" style="color:${score.color_hex};">${score.name}</span><span class="score-value">${score.user_score}/${score.total_lessons} (${percentage}%)</span></li>`; }); } catch(error) { console.error("Erro ao atualizar scores:", error); } }

async function fetchReinforcementLessons() {
    const reinforcementSection = document.getElementById('reinforcement-section');
    const reinforcementList = document.getElementById('reinforcement-list');
    try {
        // Rota a ser criada no backend
        const res = await fetch(`${API_URL}/api/content/reinforcement/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` }});
        const lessons = await res.json();
        
        if (lessons.length > 0) {
            reinforcementSection.style.display = 'block';
            reinforcementList.innerHTML = '';
            lessons.forEach(lesson => {
                const card = document.createElement('div');
                card.className = 'subject-card'; // Reutilizando estilo
                card.style.borderColor = '#4299e1'; // Cor azul para destacar
                card.innerHTML = `<h3>${lesson.title}</h3>`;
                // Adicionar evento de clique para iniciar a lição de reforço
                // card.onclick = () => renderReinforcementLesson(lesson.id);
                reinforcementList.appendChild(card);
            });
        } else {
            reinforcementSection.style.display = 'none';
        }
    } catch (error) {
        console.error("Erro ao buscar lições de reforço:", error);
        reinforcementSection.style.display = 'none';
    }
}

// =================================================================================
// COLE ESTA FUNÇÃO COMPLETA NO LUGAR DA ANTIGA fetchSubjects
// =================================================================================

async function fetchSubjects() {
    const subjectsGrid = document.getElementById('subjects-grid');
    if (!subjectsGrid) {
        console.error("Elemento 'subjects-grid' não encontrado no HTML.");
        return;
    }

    // Cria o contêiner para as matérias extras se ele ainda não existir
    let extraSubjectsContainer = document.getElementById('extra-subjects-container');
    if (!extraSubjectsContainer) {
        extraSubjectsContainer = document.createElement('div');
        extraSubjectsContainer.id = 'extra-subjects-container';
        // Insere o novo container depois do grid principal
        subjectsGrid.insertAdjacentElement('afterend', extraSubjectsContainer);
    }

    try {
        const response = await fetch(`${API_URL}/api/content/subjects`, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (!response.ok) {
            // Se a resposta da rede não for OK, lança um erro
            throw new Error('Falha na comunicação com o servidor ao buscar matérias.');
        }

        const data = await response.json();

        // Limpa os contêineres antes de adicionar os novos cards
        subjectsGrid.innerHTML = '';
        extraSubjectsContainer.innerHTML = '';

        // 1. Renderiza as Matérias Principais
        if (data.main && data.main.length > 0) {
            data.main.forEach(subject => {
                const card = document.createElement('div');
                card.className = 'subject-card';
                card.style.setProperty('--subject-color', subject.color_hex);
                card.innerHTML = `<h3>${subject.name}</h3>`;
                card.addEventListener('click', () => loadLessons(subject.id, subject.name));
                subjectsGrid.appendChild(card);
            });
        } else {
            subjectsGrid.innerHTML = '<p>Nenhuma matéria principal disponível no momento.</p>';
        }

        // 2. Renderiza as Matérias Extras
        if (data.extra && data.extra.length > 0) {
            // Adiciona um título para a seção de matérias extras
            extraSubjectsContainer.innerHTML = '<hr><h2>Matérias Extras</h2>';
            data.extra.forEach(subject => { 
                const card = document.createElement('div');
                card.className = 'subject-card extra'; // Adiciona a classe 'extra' para o estilo
                card.style.setProperty('--subject-color', subject.color_hex);
                card.innerHTML = `<h3>${subject.name}</h3>`;
                // Adicionar evento de clique para a matéria extra, se o fluxo for diferente
                card.addEventListener('click', () => loadLessons(subject.id, subject.name));
                extraSubjectsContainer.appendChild(card);
             });
        }
        
    } catch (error) {
        // Se qualquer parte do 'try' falhar, esta mensagem será exibida
        console.error('Erro detalhado em fetchSubjects:', error);
        subjectsGrid.innerHTML = '<p>Ocorreu um erro ao carregar as matérias. Tente recarregar a página.</p>';
    }
}



async function loadLessons(subjectId, subjectName) { const lessonView = document.getElementById('lesson-view'); showView('lesson-view'); lessonView.innerHTML = '<h2>Carregando...</h2>'; try { const response = await fetch(`${API_URL}/api/content/lessons/${subjectId}`); if (!response.ok) throw new Error('Falha ao buscar lições.'); const lessons = await response.json(); let title = subjectName ? `<h2>${subjectName}</h2>` : ''; let backBtn = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button>`; if (lessons.length === 0) { lessonView.innerHTML = `${backBtn}${title}<h2>Nenhuma lição disponível.</h2>`; return; } lessonView.innerHTML = `${backBtn}${title}<ul class="lesson-list"></ul>`; const lessonList = lessonView.querySelector('.lesson-list'); lessons.forEach(lesson => { const item = document.createElement('li'); item.className = 'lesson-item'; item.innerHTML = `<span>Lição ${lesson.lesson_order}: ${lesson.title}</span><button class="start-lesson-btn" data-lesson-id="${lesson.id}">Iniciar</button>`; lessonList.appendChild(item); }); } catch (error) { console.error('Erro em loadLessons:', error); lessonView.innerHTML = `<h2>Erro.</h2><p>${error.message}</p>`; } }
async function renderLessonContent(lessonId) { const lessonView = document.getElementById('lesson-view'); showView('lesson-view'); lessonView.innerHTML = `<h2>Carregando...</h2>`; try { const res = await fetch(`${API_URL}/api/content/lesson-detail/${lessonId}`); const lesson = await res.json(); lessonView.innerHTML = `<button class="back-btn" onclick="loadLessons(${lesson.subject_id}, '')">← Voltar</button><div id="lesson-main-content"><h2>${lesson.title}</h2><div id="video-placeholder"></div><div id="post-video-content" style="display:none;"><hr><h3>Recursos</h3><img src="${lesson.image_url}" alt="Imagem" style="max-width:100%;"><br/><audio controls src="${lesson.audio_url}"></audio><br/><button id="show-text-btn">Ver Explicação</button></div><div id="text-content" style="display:none;"><hr><h3>Explicação</h3><div>${lesson.lesson_text}</div><button id="start-quiz-btn">Iniciar Questões</button></div></div><div id="quiz-content-wrapper" style="display:none;"></div>`; createYouTubePlayer(lesson); } catch (error) { lessonView.innerHTML = `<h2>Erro.</h2><p>${error.message}</p>`; } }
function createYouTubePlayer(lesson) { let interval; const videoId = new URL(lesson.video_url).searchParams.get('v'); ytPlayer = new YT.Player('video-placeholder', { height: '480', width: '100%', videoId: videoId, events: { 'onStateChange': e => { if (e.data === YT.PlayerState.PLAYING) { interval = setInterval(() => { const duration = ytPlayer.getDuration(); if (duration > 0 && (ytPlayer.getCurrentTime() / duration) >= 0.8) { showPostVideoContent(); clearInterval(interval); } }, 1000); } else { clearInterval(interval); } } } }); document.getElementById('show-text-btn')?.addEventListener('click', () => { const el = document.getElementById('text-content'); el.style.display = 'block'; scrollToElement(el); }); document.getElementById('start-quiz-btn')?.addEventListener('click', () => { document.getElementById('lesson-main-content').style.display = 'none'; renderQuiz(lesson); }); }
function showPostVideoContent() { const el = document.getElementById('post-video-content'); if (el.style.display === 'none') { el.style.display = 'block'; scrollToElement(el); } }
async function renderQuiz(lesson) { console.log("Iniciando renderQuiz para a lição:", lesson.title); fetch(`${API_URL}/api/content/unlock-reinforcement`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, triggerLessonId: lesson.id }) }).then(res => res.json()).then(data => { if (data.unlocked) showReinforcementToast(data.title); }); const quizWrapper = document.getElementById('quiz-content-wrapper'); quizWrapper.style.display = 'block'; quizWrapper.innerHTML = '<div id="quiz-content"></div>'; const quizContent = document.getElementById('quiz-content'); scrollToElement(quizWrapper); let timerInterval; let selectedOption = null; function startTimer(duration, display, onTimeUp) { let timer = duration; display.textContent = `Tempo: ${timer}s`; timerInterval = setInterval(() => { timer--; display.textContent = `Tempo: ${timer}s`; if (timer <= 0) { clearInterval(timerInterval); onTimeUp(); } }, 1000); } function showFeedback(isCorrect, explanation) { const feedbackDiv = document.createElement('div'); feedbackDiv.id = 'quiz-feedback'; feedbackDiv.className = isCorrect ? 'correct' : 'incorrect'; feedbackDiv.innerHTML = `<p>${explanation}</p><button id="next-question-btn"></button>`; const confirmBtn = quizContent.querySelector('#confirm-answer-btn'); if (confirmBtn) { confirmBtn.style.display = 'none'; confirmBtn.insertAdjacentElement('afterend', feedbackDiv); } return feedbackDiv.querySelector('#next-question-btn'); } async function handleAnswer(questionType, correctAnswer, selectedAnswerText, feedbackPrefix = '') { clearInterval(timerInterval); quizContent.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = true; }); quizContent.querySelector('#confirm-answer-btn').disabled = true; const isCorrect = selectedAnswerText === correctAnswer; quizContent.querySelectorAll('.option-btn').forEach(btn => { if (btn.textContent === correctAnswer) btn.classList.add('correct'); if (btn === selectedOption && !isCorrect) btn.classList.add('incorrect'); }); if (questionType === 'q1') { const feedbackText = feedbackPrefix + (isCorrect ? " Correto! Este foi um treino." : " Incorreto. A resposta certa está em verde."); const nextBtn = showFeedback(isCorrect, feedbackText); nextBtn.textContent = "Iniciar Questão 2"; nextBtn.addEventListener('click', renderQuestion2); } else if (questionType === 'q2') { const res = await fetch(`${API_URL}/api/content/submit-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, lessonId: lesson.id, isCorrect }) }); const result = await res.json(); const nextBtn = showFeedback(isCorrect, feedbackPrefix + " " + result.message); if (result.status === 'completed') { nextBtn.textContent = "Ver Próxima Lição"; nextBtn.addEventListener('click', () => { updateScores(); loadLessons(lesson.subject_id, ''); }); } else if (result.status === 'subject_finished') { nextBtn.textContent = "Gerar Certificado"; nextBtn.addEventListener('click', () => handleSubjectFinished(result.subjectId)); } else { nextBtn.textContent = "Voltar ao Vídeo"; nextBtn.addEventListener('click', () => renderLessonContent(lesson.id)); } } } async function renderQuestion2() { const progressRes = await fetch(`${API_URL}/api/content/start-lesson/${lesson.id}/user/${userId}`); const progress = await progressRes.json(); if (progress.blocked_until && new Date() < new Date(progress.blocked_until)) { alert(`Lição bloqueada. Tente novamente em ${new Date(progress.blocked_until).toLocaleTimeString()}`); return loadLessons(lesson.subject_id, ''); } const seenVariants = progress.q2_variants_seen || []; const availableVariants = [0, 1, 2].filter(i => !seenVariants.includes(i)); if (availableVariants.length === 0) { alert('Você já tentou todas as variantes. Avançando com penalidade.'); return loadLessons(lesson.subject_id, ''); } const variantIndex = availableVariants[Math.floor(Math.random() * availableVariants.length)]; const question = lesson.q2_variants[variantIndex]; const correctAnswer = question.options[0]; quizContent.innerHTML = `<h3>Questão 2 (Avaliativa)</h3><p>${question.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`; const optionsContainer = quizContent.querySelector('.options-container'); const timerDisplay = document.getElementById('timer'); const onTimeUp = () => handleAnswer('q2', correctAnswer, null, 'O tempo acabou!'); startTimer(lesson.q2_time, timerDisplay, onTimeUp); [...question.options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; }); selectedOption = null; optionsContainer.querySelectorAll('.option-btn').forEach(btn => { btn.addEventListener('click', () => { if (selectedOption) selectedOption.classList.remove('selected'); selectedOption = btn; btn.classList.add('selected'); quizContent.querySelector('#confirm-answer-btn').disabled = false; }); }); quizContent.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q2', correctAnswer, selectedOption ? selectedOption.textContent : null)); } function renderQuestion1() { const correctAnswer = lesson.q1_options[0]; quizContent.innerHTML = `<h3>Questão 1 (Treino)</h3><p>${lesson.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`; const optionsContainer = quizContent.querySelector('.options-container'); const timerDisplay = document.getElementById('timer'); const onTimeUp = () => handleAnswer('q1', correctAnswer, null, 'O tempo acabou!'); startTimer(lesson.q1_time, timerDisplay, onTimeUp); [...lesson.q1_options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; }); selectedOption = null; optionsContainer.querySelectorAll('.option-btn').forEach(btn => { btn.addEventListener('click', () => { if (selectedOption) selectedOption.classList.remove('selected'); selectedOption = btn; btn.classList.add('selected'); quizContent.querySelector('#confirm-answer-btn').disabled = false; }); }); quizContent.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q1', correctAnswer, selectedOption ? selectedOption.textContent : null)); } renderQuestion1(); }
function showReinforcementToast(title) { let toast = document.getElementById('reinforcement-toast'); if (!toast) { toast = document.createElement('div'); toast.id = 'reinforcement-toast'; document.body.appendChild(toast); } toast.textContent = `Nova lição de reforço desbloqueada: ${title}!`; toast.classList.add('show'); setTimeout(() => { toast.classList.remove('show'); }, 5000); }
async function handleSubjectFinished(subjectId) { const fullName = prompt("Parabéns! Você concluiu todas as lições desta matéria!\n\nPara gerar seu certificado, por favor, insira seu nome completo:", ""); if (fullName && fullName.trim() && fullName.length <= 40) { try { await fetch(`${API_URL}/api/content/generate-certificate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, subjectId, fullName: fullName.trim() }) }); alert('Seu certificado foi gerado com sucesso!'); loadLessons(subjectId, ""); } catch (error) { alert("Houve um erro ao gerar seu certificado."); } } else if (fullName) { alert("Nome inválido. Máximo de 40 caracteres."); } }
async function loadCertificates() { showView('certificates-view'); const list = document.getElementById('certificates-list'); list.innerHTML = 'Carregando...'; try { const res = await fetch(`${API_URL}/api/content/certificates/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` }}); const certs = await res.json(); list.innerHTML = ''; if (certs.length === 0) { list.innerHTML = '<p>Você ainda não possui certificados.</p>'; return; } certs.forEach(cert => { const certItem = document.createElement('div'); certItem.className = 'subject-card'; certItem.innerHTML = `<h3>Certificado: ${cert.subject_name}</h3>`; certItem.onclick = () => showCertificate(cert); list.appendChild(certItem); }); } catch (e) { list.innerHTML = 'Erro ao carregar certificados.'; } }
function showCertificate(cert) { const modal = document.getElementById('certificate-modal'); const content = document.getElementById('certificate-content'); content.innerHTML = `<button id="print-cert-btn" onclick="window.print()">🖨️</button><button id="close-modal-btn">X</button><div id="certificate-text"><p style="font-size: 1.5rem; margin-bottom: 30px;">Certificado de Conclusão</p><p>Certificamos que</p><p style="font-size: 2rem; font-family: 'Brush Script MT', cursive; margin: 20px 0;">${cert.full_name}</p><p>concluiu a matéria <strong style="color: #333;">${cert.subject_name}</strong> no Projeto Sapiens, pelo método Augenblicklich-Lernen.</p><p>Total de lições concluídas: ${cert.total_lessons}</p><p style="font-size: 4rem; margin-top: 20px;">🏅</p></div>`; modal.style.display = 'flex'; content.querySelector('#close-modal-btn').onclick = () => modal.style.display = 'none';}

function initializeApp() {
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');
    document.getElementById('show-register')?.addEventListener('click', e => { e.preventDefault(); showView('register-view'); });
    document.getElementById('show-login')?.addEventListener('click', e => { e.preventDefault(); showView('login-view'); });
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.body.addEventListener('click', e => { if (e.target?.classList.contains('start-lesson-btn')) renderLessonContent(e.target.dataset.lessonId); });
    if (token && userId) {
        showView('subjects-view');
        fetchSubjects();
        fetchReinforcementLessons(); // <<< ADICIONE ESTA LINHA
        setupUserAreaAndScores();
    } else {
        showView('login-view');
        document.getElementById('user-area').innerHTML = '<button id="login-button">Entrar</button>';
        document.getElementById('login-button')?.addEventListener('click', () => showView('login-view'));
    }
}
document.addEventListener('DOMContentLoaded', initializeApp);