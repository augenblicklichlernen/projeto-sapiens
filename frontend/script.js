// ========================================================================
// PROJETO SAPIENS - SCRIPT.JS - VERSÃO FINAL E CONSOLIDADA
// ========================================================================

// ------------------------------------------------------------------------
// 1. CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
// ------------------------------------------------------------------------

const API_URL = 'https://sapiens-backend-ogz2.onrender.com';
let token, userId;
let ytPlayer, lessonView, subjectsGrid; // Elementos da UI cacheados para performance

// ------------------------------------------------------------------------
// 2. INICIALIZAÇÃO DO APLICATIVO
// ------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    // Mapeia os elementos principais do DOM para as variáveis globais
    lessonView = document.getElementById('lesson-view');
    subjectsGrid = document.getElementById('subjects-grid');
    
    // Configura todos os "ouvintes de evento" da página
    setupEventListeners();
    
    // Verifica se o usuário já está logado e atualiza a interface de acordo
    updateUIBasedOnLogin();
}

// ------------------------------------------------------------------------
// 3. FUNÇÕES DE UTILIDADE E CONTROLE DA INTERFACE (UI)
// ------------------------------------------------------------------------

// Mostra uma "view" (div principal) e esconde as outras
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(viewId);
    if (view) view.classList.add('active');
}

// Desloga o usuário, limpa os dados locais e atualiza a interface
function forceLogout(message) {
    if (message) alert(message);
    localStorage.clear();
    updateUIBasedOnLogin();
}

// Função central que gerencia o que é exibido no cabeçalho e na página
function updateUIBasedOnLogin() {
    const loggedInView = document.getElementById('logged-in-view');
    const loggedOutView = document.getElementById('logged-out-view');
    const usernameDisplay = document.getElementById('username-display');
    const scoreContainer = document.getElementById('score-bar-container');
    const headerRightGroup = document.querySelector('.header-right-group');
    
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');

    // Garante que o botão de certificados seja removido antes de decidir se deve recriá-lo
    const oldCertsBtn = document.getElementById('my-certs-btn');
    if (oldCertsBtn) oldCertsBtn.remove();

    if (token && userId) { // --- ESTADO LOGADO ---
        loggedInView.classList.remove('hidden');
        loggedOutView.classList.add('hidden');
        usernameDisplay.textContent = `Olá, ${localStorage.getItem('username')}!`;
        scoreContainer.style.display = 'flex';
        
        // Adiciona o botão de certificados
        const certsBtn = document.createElement('button');
        certsBtn.id = 'my-certs-btn';
        certsBtn.textContent = 'Meus Certificados';
        scoreContainer.insertAdjacentElement('afterend', certsBtn);

        // Carrega os dados do usuário
        updateScores();
        fetchSubjects();
        fetchReinforcementLessons();
        showView('subjects-view');

    } else { // --- ESTADO DESLOGADO ---
        loggedInView.classList.add('hidden');
        loggedOutView.classList.remove('hidden');
        scoreContainer.style.display = 'none';
        showView('login-view');
    }
}

// ------------------------------------------------------------------------
// 4. LÓGICA DE AUTENTICAÇÃO
// ------------------------------------------------------------------------

async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.userId);
        updateUIBasedOnLogin();
    } catch (err) {
        alert(`Erro no login: ${err.message}`);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const u = document.getElementById('register-username').value;
    const p = document.getElementById('register-password').value;
    try {
        const res = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }
        alert('Registro bem-sucedido! Por favor, faça o login.');
        showView('login-view');
    } catch (err) {
        alert(`Erro no registro: ${err.message}`);
    }
}

// ------------------------------------------------------------------------
// 5. FUNÇÕES DE CARREGAMENTO DE CONTEÚDO
// ------------------------------------------------------------------------

async function fetchSubjects() {
    if (!subjectsGrid) return;
    try {
        const res = await fetch(`${API_URL}/api/content/subjects`);
        if (!res.ok) throw new Error('Falha ao buscar matérias.');
        const data = await res.json();
        
        subjectsGrid.innerHTML = '';
        if (data.main?.length) {
            data.main.forEach(s => {
                const card = document.createElement('div');
                card.className = 'subject-card';
                card.style.setProperty('--subject-color', s.color_hex);
                card.innerHTML = `<h3>${s.name}</h3>`;
                card.addEventListener('click', () => loadLessons(s.id, s.name));
                subjectsGrid.appendChild(card);
            });
        }
        
        let extraContainer = document.getElementById('extra-subjects-container');
        if (!extraContainer) {
            extraContainer = document.createElement('div');
            extraContainer.id = 'extra-subjects-container';
            subjectsGrid.insertAdjacentElement('afterend', extraContainer);
        }
        extraContainer.innerHTML = '';
        if (data.extra?.length) {
            extraContainer.innerHTML = '<hr><h2>Matérias Extras</h2>';
            data.extra.forEach(s => {
                const card = document.createElement('div');
                card.className = 'subject-card extra';
                card.style.setProperty('--subject-color', s.color_hex);
                card.innerHTML = `<h3>${s.name}</h3>`;
                card.addEventListener('click', () => loadLessons(s.id, s.name));
                extraContainer.appendChild(card);
            });
        }
    } catch (err) {
        console.error("Erro em fetchSubjects:", err);
        if (subjectsGrid) subjectsGrid.innerHTML = '<p>Erro ao carregar matérias.</p>';
    }
}

async function loadLessons(subjectId, subjectName) {
    if (!lessonView) return;
    showView('lesson-view');
    lessonView.innerHTML = '<h2>Carregando...</h2>';
    try {
        const res = await fetch(`${API_URL}/api/content/lessons/${subjectId}`);
        if (!res.ok) throw new Error('Falha ao buscar lições.');
        const lessons = await res.json();

        if (lessons.length === 0) {
            alert("Não há lições disponíveis para esta matéria ou ela foi removida.");
            showView('subjects-view');
            return;
        }

        let title = subjectName ? `<h2>${subjectName}</h2>` : '';
        let backBtn = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button>`;
        
        lessonView.innerHTML = `${backBtn}${title}<ul class="lesson-list"></ul>`;
        const list = lessonView.querySelector('.lesson-list');
        lessons.forEach(l => {
            const item = document.createElement('li');
            item.className = 'lesson-item';
            item.innerHTML = `<span>Lição ${l.lesson_order}: ${l.title}</span><button class="start-lesson-btn" data-lesson-id="${l.id}">Iniciar</button>`;
            list.appendChild(item);
        });
    } catch (err) {
        console.error("Erro em loadLessons:", err);
        lessonView.innerHTML = `<h2>Erro ao carregar.</h2><p>${err.message}</p>`;
    }
}

async function renderLessonContent(id) {
    if (!lessonView) return;
    showView('lesson-view');
    lessonView.innerHTML = `<h2>Carregando...</h2>`;
    try {
        const res = await fetch(`${API_URL}/api/content/lesson-detail/${id}`);
        const lesson = await res.json();

        // **VERIFICAÇÃO DE LIÇÃO DELETADA**
        if (!lesson) {
            alert("Esta lição não está mais disponível.");
            showView('subjects-view');
            return;
        }

        lessonView.innerHTML = `
            <button class="back-btn" onclick="loadLessons(${lesson.subject_id}, '')">← Voltar</button>
            <div id="lesson-main-content"><h2>${lesson.title}</h2><div id="video-placeholder"></div><div id="post-video-content" style="display:none;"><hr><h3>Recursos</h3><img src="${lesson.image_url}" alt="Imagem da lição"><br/><audio controls src="${lesson.audio_url}"></audio><br/><button id="show-text-btn">Explicação</button></div><div id="text-content" style="display:none;"><hr><h3>Explicação</h3><div>${lesson.lesson_text}</div><button id="start-quiz-btn">Questões</button></div></div>
            <div id="quiz-content-wrapper" style="display:none;"></div>`;
        createYouTubePlayer(lesson);
    } catch (err) {
        console.error("Erro em renderLessonContent:", err);
        lessonView.innerHTML = `<h2>Erro ao carregar a lição.</h2><p>${err.message}</p>`;
    }
}

function createYouTubePlayer(lesson) {
    let interval;
    try {
        const videoId = new URL(lesson.video_url).searchParams.get('v');
        ytPlayer = new YT.Player('video-placeholder', {
            height: '480', width: '100%', videoId: videoId,
            events: {
                'onStateChange': (e) => {
                    if (e.data === YT.PlayerState.PLAYING) {
                        interval = setInterval(() => {
                            const duration = ytPlayer.getDuration();
                            if (duration > 0 && (ytPlayer.getCurrentTime() / duration) >= 0.8) {
                                showPostVideoContent();
                                clearInterval(interval);
                            }
                        }, 1000);
                    } else { clearInterval(interval); }
                }
            }
        });
    } catch (e) {
        document.getElementById('video-placeholder').innerHTML = '<p>Vídeo indisponível.</p>';
        showPostVideoContent();
    }
    
    document.getElementById('show-text-btn')?.addEventListener('click', () => { document.getElementById('text-content').style.display = 'block'; });
    document.getElementById('start-quiz-btn')?.addEventListener('click', () => { document.getElementById('lesson-main-content').style.display = 'none'; renderQuiz(lesson); });
}

function showPostVideoContent() {
    const el = document.getElementById('post-video-content');
    if (el?.style.display === 'none') {
        el.style.display = 'block';
    }
}

// ------------------------------------------------------------------------
// 6. LÓGICA DE QUIZ, SCORES E CERTIFICADOS
// ------------------------------------------------------------------------

async function updateScores() { /* ... Sua função original ... */ }
async function renderQuiz(lesson) { /* ... Sua função original ... */ }
async function fetchReinforcementLessons() { /* ... Sua função original ... */ }
async function renderReinforcementLesson(id) { /* ... Sua função original ... */ }
function showReinforcementToast(title) { /* ... Sua função original ... */ }
async function handleSubjectFinished(id) { /* ... Sua função original ... */ }
async function loadCertificates() { /* ... Sua função original ... */ }
function showCertificate(cert) { /* ... Sua função original ... */ }

// (Colei as funções acima sem alteração para manter a funcionalidade, mas com a ressalva da necessidade de refatorar o renderQ2)
async function updateScores() { const sl = document.getElementById('score-list'); if(!sl) return; try { const res = await fetch(`${API_URL}/api/content/scores/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) { if(res.status === 401 || res.status === 403) return forceLogout("Esta conta não possui mais acesso a este site."); throw new Error('Falha ao buscar scores'); } const scores = await res.json(); sl.innerHTML = ''; if (scores?.length) { scores.forEach(s => { const p = s.total_lessons > 0 ? ((s.user_score / s.total_lessons) * 100).toFixed(0) : 0; sl.innerHTML += `<li><span class="score-name" style="color:${s.color_hex};">${s.name}</span><span class="score-value">${s.user_score}/${s.total_lessons} (${p}%)</span></li>`; }); } } catch (err) { console.error("Erro ao atualizar scores:", err); if (sl) sl.innerHTML = '<li>Erro ao carregar.</li>'; } }
async function renderQuiz(lesson) { fetch(`${API_URL}/api/content/unlock-reinforcement`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, triggerLessonId: lesson.id }) }).then(r => r.json()).then(d => { if (d.unlocked) { showReinforcementToast(d.title); fetchReinforcementLessons(); } }); const qw = document.getElementById('quiz-content-wrapper'); qw.style.display = 'block'; qw.innerHTML = '<div id="quiz-content"></div>'; const qc = document.getElementById('quiz-content'); let timer, selOpt; function startTimer(d, disp, onUp) { let t = d; disp.textContent = `Tempo: ${t}s`; timer = setInterval(() => { t--; disp.textContent = `Tempo: ${t}s`; if (t <= 0) { clearInterval(timer); onUp(); } }, 1000); } function showFeedback(isOk, expl) { const fb = document.createElement('div'); fb.id = 'quiz-feedback'; fb.className = isOk ? 'correct' : 'incorrect'; fb.innerHTML = `<p>${expl}</p><button id="next-question-btn"></button>`; const cb = qc.querySelector('#confirm-answer-btn'); if (cb) { cb.style.display = 'none'; cb.insertAdjacentElement('afterend', fb); } return fb.querySelector('#next-question-btn'); } async function handleAnswer(type, correct, selected, prefix = '') { clearInterval(timer); qc.querySelectorAll('.option-btn').forEach(b => b.disabled = true); qc.querySelector('#confirm-answer-btn').disabled = true; const isOk = selected === correct; qc.querySelectorAll('.option-btn').forEach(b => { if (b.textContent === correct) b.classList.add('correct'); if (b === selOpt && !isOk) b.classList.add('incorrect'); }); if (type === 'q1') { const fbTxt = prefix + (isOk ? " Correto! Treino." : " Incorreto."); const nextBtn = showFeedback(isOk, fbTxt); nextBtn.textContent = "Questão 2"; nextBtn.addEventListener('click', renderQ2); } else if (type === 'q2') { const res = await fetch(`${API_URL}/api/content/submit-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, lessonId: lesson.id, isCorrect: isOk, variantIndex: lesson.variantIndex }) }); const result = await res.json(); const nextBtn = showFeedback(isOk, prefix + " " + result.message); if (result.status === 'completed') { nextBtn.textContent = "Próxima Lição"; nextBtn.addEventListener('click', () => { updateScores(); loadLessons(lesson.subject_id); }); } else if (result.status === 'subject_finished') { nextBtn.textContent = "Gerar Certificado"; nextBtn.addEventListener('click', () => handleSubjectFinished(result.subjectId)); } else { nextBtn.textContent = "Voltar ao Vídeo"; nextBtn.addEventListener('click', () => renderLessonContent(lesson.id)); } } } async function renderQ2() { const pRes = await fetch(`${API_URL}/api/content/start-lesson/${lesson.id}/user/${userId}`); if (!pRes.ok) { if (pRes.status === 401 || pRes.status === 403) { return forceLogout("Esta conta não possui mais acesso a este site."); } return alert('Erro de comunicação.'); } const p = await pRes.json(); if (p.blocked_until && new Date() < new Date(p.blocked_until)) { alert(`Lição bloqueada. Tente em ${new Date(p.blocked_until).toLocaleTimeString()}`); return loadLessons(lesson.subject_id); } const seen = p.q2_variants_seen || []; const available = [0, 1, 2].filter(i => !seen.includes(i)); if (available.length === 0) { alert('Variantes esgotadas. Avançando.'); return loadLessons(lesson.subject_id); } const vIdx = available[Math.floor(Math.random() * available.length)]; lesson.variantIndex = vIdx; const q = lesson.q2_variants[vIdx]; const correct = q.options[0]; qc.innerHTML = `<h3>Questão 2</h3><p>${q.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`; const opts = qc.querySelector('.options-container'), timerDisp = qc.querySelector('#timer'); const onUp = () => handleAnswer('q2', correct, null, 'Tempo esgotado!'); startTimer(lesson.q2_time, timerDisp, onUp); [...q.options].sort(() => .5 - Math.random()).forEach(o => opts.innerHTML += `<button class="option-btn">${o}</button>`); selOpt = null; opts.querySelectorAll('.option-btn').forEach(b => b.addEventListener('click', () => { if (selOpt) selOpt.classList.remove('selected'); selOpt = b; b.classList.add('selected'); qc.querySelector('#confirm-answer-btn').disabled = false; })); qc.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q2', correct, selOpt?.textContent)); } function renderQ1() { const correct = lesson.q1_options[0]; qc.innerHTML = `<h3>Questão 1</h3><p>${lesson.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`; const opts = qc.querySelector('.options-container'), timerDisp = qc.querySelector('#timer'); const onUp = () => handleAnswer('q1', correct, null, 'Tempo esgotado!'); startTimer(lesson.q1_time, timerDisp, onUp); [...lesson.q1_options].sort(() => .5 - Math.random()).forEach(o => opts.innerHTML += `<button class="option-btn">${o}</button>`); selOpt = null; opts.querySelectorAll('.option-btn').forEach(b => b.addEventListener('click', () => { if (selOpt) selOpt.classList.remove('selected'); selOpt = b; b.classList.add('selected'); qc.querySelector('#confirm-answer-btn').disabled = false; })); qc.querySelector('#confirm-answer-btn').addEventListener('click', () => handleAnswer('q1', correct, selOpt?.textContent)); } renderQ1(); }
async function fetchReinforcementLessons() { const rs = document.getElementById('reinforcement-section'), rl = document.getElementById('reinforcement-list'); if (!rs || !rl) return; try { const res = await fetch(`${API_URL}/api/content/reinforcement/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }); const lessons = await res.json(); if (lessons.length > 0) { rs.style.display = 'block'; rl.innerHTML = ''; lessons.forEach(l => { const c = document.createElement('div'); c.className = 'subject-card reinforcement-card'; c.style.borderColor = '#4299e1'; c.innerHTML = `<h3>${l.title}</h3>`; c.dataset.lessonId = l.id; rl.appendChild(c); }); } else { rs.style.display = 'none'; } } catch (err) { console.error("Erro ao buscar reforço:", err); } }
async function renderReinforcementLesson(id) { if (!lessonView) return; showView('lesson-view'); lessonView.innerHTML = `<h2>Carregando...</h2>`; try { const res = await fetch(`${API_URL}/api/content/reinforcement-lesson/${id}`); if (!res.ok) throw new Error("Falha ao carregar reforço."); const rfL = await res.json(); if(!rfL) { alert("Esta lição de reforço não está mais disponível."); return showView('subjects-view'); } const c = rfL.content; let html = `<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button><h2>Reforço: ${rfL.title}</h2>`; if (c.video_url) html += `<iframe width="100%" height="480" src="${c.video_url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>`; if (c.image_url) html += `<img src="${c.image_url}" alt="Reforço">`; if (c.audio_url) html += `<audio controls src="${c.audio_url}"></audio>`; if (c.text) html += `<div>${c.text}</div>`; if (c.questions?.length) { html += `<hr><h3>Questões de Treino</h3>`; c.questions.forEach((q, i) => { html += `<div class="quiz-question" data-correct-answer="${q.options[0]}"><h4>Questão ${i+1}</h4><p>${q.text}</p><div class="options-container">${[...q.options].sort(()=>.5-Math.random()).map(o=>`<button class="option-btn">${o}</button>`).join('')}</div><div class="rf-feedback"></div></div>`; }); } lessonView.innerHTML = html; lessonView.querySelectorAll('.quiz-question .option-btn').forEach(b => b.addEventListener('click', () => { const qb = b.closest('.quiz-question'), ca = qb.dataset.correctAnswer, sa = b.textContent, f = qb.querySelector('.rf-feedback'); qb.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true); if (sa === ca) { b.classList.add('correct'); f.textContent = 'Correto!'; f.className = 'rf-feedback correct'; } else { b.classList.add('incorrect'); f.textContent = `Incorreto. Resposta: ${ca}`; f.className = 'rf-feedback incorrect'; } f.style.display = 'block'; })); } catch (err) { lessonView.innerHTML = `<h2>Erro ao carregar.</h2>`; } }
function showReinforcementToast(title) { let t = document.getElementById('reinforcement-toast'); if (!t) { t = document.createElement('div'); t.id = 'reinforcement-toast'; document.body.appendChild(t); } t.textContent = `Reforço desbloqueado: ${title}!`; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 5000); }
async function handleSubjectFinished(id) { const name = prompt("Parabéns! Você concluiu a matéria!\nInsira seu nome completo para o certificado:", ""); if (name?.trim() && name.length <= 40) { try { await fetch(`${API_URL}/api/content/generate-certificate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, subjectId: id, fullName: name.trim() }) }); alert('Certificado gerado!'); loadLessons(id); } catch (err) { alert("Erro ao gerar certificado."); } } else if (name) { alert("Nome inválido."); } }
async function loadCertificates() { showView('certificates-view'); const list = document.getElementById('certificates-list'); list.innerHTML = 'Carregando...'; try { const res = await fetch(`${API_URL}/api/content/certificates/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }); const certs = await res.json(); list.innerHTML = ''; if (certs.length === 0) { list.innerHTML = '<p>Nenhum certificado.</p>'; return; } certs.forEach(c => { const i = document.createElement('div'); i.className = 'subject-card certificate-card'; i.innerHTML = `<h3>Certificado: ${c.subject_name}</h3>`; i.dataset.certData = JSON.stringify(c); list.appendChild(i); }); } catch (e) { console.error("Erro ao carregar certificados:", e); list.innerHTML = 'Erro ao carregar.'; } }
function showCertificate(cert) { const modal = document.getElementById('certificate-modal'); const content = document.getElementById('certificate-content'); if (!modal) { return; } content.innerHTML = `<div id="certificate-text"><p>Certificado de Conclusão</p><p>Certificamos que</p><p><strong>${cert.full_name}</strong></p><p>concluiu com sucesso a matéria <strong>${cert.subject_name}</strong>.</p><p>Total de Lições: ${cert.total_lessons}</p><p style="font-size: 2rem; margin-top: 15px;">🏅</p></div><button id="print-cert-btn" title="Imprimir Certificado">🖨️</button><button id="close-modal-btn" title="Fechar">X</button>`; content.querySelector('#print-cert-btn').addEventListener('click', () => window.print()); content.querySelector('#close-modal-btn').addEventListener('click', () => { modal.classList.remove('visible'); }); modal.classList.add('visible'); }

// ------------------------------------------------------------------------
// 7. OUVINTES DE EVENTO (EVENT LISTENERS)
// ------------------------------------------------------------------------

function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const targetId = target.id;

        if (targetId === 'logout-button') forceLogout();
        if (targetId === 'login-button') showView('login-view');
        if (targetId === 'show-register') { e.preventDefault(); showView('register-view'); }
        if (targetId === 'show-login') { e.preventDefault(); showView('login-view'); }
        if (target.classList.contains('start-lesson-btn')) renderLessonContent(target.dataset.lessonId);
        const reinforcementCard = target.closest('.reinforcement-card');
        if (reinforcementCard) renderReinforcementLesson(reinforcementCard.dataset.lessonId);
        if (targetId === 'score-toggle-btn') {
            const panel = document.getElementById('score-panel');
            if (panel) panel.classList.toggle('visible');
        }
        if (targetId === 'my-certs-btn') loadCertificates();
        const certCard = target.closest('.certificate-card');
        if (certCard) showCertificate(JSON.parse(certCard.dataset.certData));
        if (targetId === 'certificate-modal' && target.classList.contains('visible')) {
            target.classList.remove('visible');
        }
    });

    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') handleLogin(e);
        if (e.target.id === 'register-form') handleRegister(e);
    });
}