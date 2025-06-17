// =================================================================================
// ARQUIVO script.js (VERSÃO FINALÍSSIMA CORRIGIDA)
// =================================================================================

// --- CONFIGURAÇÃO E ESTADO GLOBAL ---
const API_URL = 'https://sapiens-backend-ogz2.onrender.com';
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');

// --- ELEMENTOS GLOBAIS DO DOM ---
// Definidos aqui para serem acessíveis por todas as funções
const subjectsGrid = document.getElementById('subjects-grid');
const lessonView = document.getElementById('lesson-view');
let ytPlayer;


// =================================================================================
// 1. DEFINIÇÃO DE TODAS AS FUNÇÕES
// =================================================================================

function showView(viewId) { /* ... função sem mudanças ... */ }
function scrollToElement(element) { /* ... função sem mudanças ... */ }
async function handleLogin(e) { /* ... função sem mudanças ... */ }
async function handleRegister(e) { /* ... função sem mudanças ... */ }
function setupUserAreaAndScores() { /* ... função sem mudanças ... */ }
async function updateScores() { /* ... função sem mudanças ... */ }
async function loadCertificates() { /* ... função sem mudanças ... */ }
function showCertificate(cert) { /* ... função sem mudanças ... */ }

async function fetchSubjects() {
    if (!subjectsGrid) {
        console.error("Elemento subjectsGrid não encontrado!");
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha na resposta da rede ao buscar matérias.');
        
        const subjects = await response.json();
        
        while (subjectsGrid.firstChild) {
            subjectsGrid.removeChild(subjectsGrid.firstChild);
        }

        if (!Array.isArray(subjects) || subjects.length === 0) {
            subjectsGrid.innerHTML = '<p>Nenhuma matéria cadastrada ainda.</p>';
            return;
        }

        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.style.setProperty('--subject-color', subject.color_hex);
            card.innerHTML = `<h3>${subject.name}</h3>`;
            card.addEventListener('click', () => loadLessons(subject.id, subject.name));
            subjectsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Erro detalhado em fetchSubjects:', error);
        subjectsGrid.innerHTML = '<p>Ocorreu um erro ao carregar as matérias.</p>';
    }
}

async function loadLessons(subjectId, subjectName) { /* ... função sem mudanças ... */ }
async function renderLessonContent(lessonId) { /* ... função sem mudanças ... */ }
function createYouTubePlayer(lesson) { /* ... função sem mudanças ... */ }
function showPostVideoContent() { /* ... função sem mudanças ... */ }
// =================================================================================
// COLE ESTE NOVO BLOCO NO LUGAR DA ANTIGA FUNÇÃO renderQuiz
// =================================================================================
async function renderQuiz(lesson) {
    console.log("Iniciando renderQuiz para a lição:", lesson.title);
    const quizWrapper = document.getElementById('quiz-content-wrapper');
    quizWrapper.style.display = 'block';
    quizWrapper.innerHTML = '<div id="quiz-content"></div>';
    const quizContent = document.getElementById('quiz-content');
    scrollToElement(quizWrapper);

    // Desbloqueia lição de reforço
    fetch(`${API_URL}/api/content/unlock-reinforcement`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, triggerLessonId: lesson.id })})
        .then(res => res.json()).then(data => { if (data.unlocked) showReinforcementToast(data.title); });

    let timerInterval;
    let selectedOption = null;

    function startTimer(duration, display, onTimeUp) {
        let timer = duration;
        display.textContent = `Tempo: ${timer}s`;
        timerInterval = setInterval(() => {
            timer--;
            display.textContent = `Tempo: ${timer}s`;
            if (timer <= 0) {
                clearInterval(timerInterval);
                console.log("Tempo esgotado!");
                onTimeUp();
            }
        }, 1000);
    }

    function showFeedback(isCorrect, explanation) {
        console.log("Mostrando feedback:", explanation);
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'quiz-feedback';
        feedbackDiv.className = isCorrect ? 'correct' : 'incorrect';
        feedbackDiv.innerHTML = `<p>${explanation}</p><button id="next-question-btn"></button>`;
        const confirmBtn = quizContent.querySelector('#confirm-answer-btn');
        if (confirmBtn) {
             confirmBtn.style.display = 'none'; // Esconde o botão de confirmar
             confirmBtn.insertAdjacentElement('afterend', feedbackDiv);
        }
        return feedbackDiv.querySelector('#next-question-btn');
    }

    async function handleAnswer(questionType, correctAnswer, selectedAnswerText, feedbackPrefix = '') {
        console.log(`Manipulando resposta para ${questionType}. Correta: ${correctAnswer}, Selecionada: ${selectedAnswerText}`);
        clearInterval(timerInterval);
        quizContent.querySelectorAll('.option-btn').forEach(btn => { btn.disabled = true; });
        const confirmBtn = quizContent.querySelector('#confirm-answer-btn');
        if (confirmBtn) confirmBtn.disabled = true;

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
            const res = await fetch(`${API_URL}/api/content/submit-quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId, lessonId: lesson.id, isCorrect }) });
            const result = await res.json();
            const nextBtn = showFeedback(isCorrect, feedbackPrefix + " " + result.message);
            
            if (result.status === 'completed') {
                nextBtn.textContent = "Ver Próxima Lição";
                nextBtn.addEventListener('click', () => { updateScores(); loadLessons(lesson.subject_id, ''); });
            } else if (result.status === 'subject_finished') {
                nextBtn.textContent = "Gerar Certificado";
                nextBtn.addEventListener('click', () => handleSubjectFinished(result.subjectId));
            } else {
                nextBtn.textContent = "Voltar ao Vídeo";
                nextBtn.addEventListener('click', () => renderLessonContent(lesson.id));
            }
        }
    }
    
    async function renderQuestion2() {
        console.log("Renderizando Questão 2.");
        // ... (resto do código da Q2 como antes, mas vamos garantir que esteja completo)
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
        const timerDisplay = document.getElementById('timer');
        
        const onTimeUp = () => handleAnswer('q2', correctAnswer, null, 'O tempo acabou!');
        startTimer(lesson.q2_time, timerDisplay, onTimeUp);
        
        [...question.options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; });
        
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
        console.log("Renderizando Questão 1.");
        const correctAnswer = lesson.q1_options[0];
        quizContent.innerHTML = `<h3>Questão 1 (Treino)</h3><p>${lesson.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;
        const optionsContainer = quizContent.querySelector('.options-container');
        const timerDisplay = document.getElementById('timer');
        
        const onTimeUp = () => handleAnswer('q1', correctAnswer, null, 'O tempo acabou!');
        startTimer(lesson.q1_time, timerDisplay, onTimeUp);

        [...lesson.q1_options].sort(() => Math.random() - 0.5).forEach(option => { optionsContainer.innerHTML += `<button class="option-btn">${option}</button>`; });
        
        selectedOption = null;
        optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (selectedOption) selectedOption.classList.remove('selected');
                selectedOption = btn;
                btn.classList.add('selected');
                quizContent.querySelector('#confirm-answer-btn').disabled = false;
            });
        });
        const confirmBtn = quizContent.querySelector('#confirm-answer-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => handleAnswer('q1', correctAnswer, selectedOption ? selectedOption.textContent : null));
        }
    }

    renderQuestion1();
}



function showReinforcementToast(title) { /* ... função sem mudanças ... */ }
async function handleSubjectFinished(subjectId) { /* ... função sem mudanças ... */ }


// =================================================================================
// 2. EXECUÇÃO E PONTO DE ENTRADA
// =================================================================================
function setupEventListeners() {
    document.getElementById('show-register')?.addEventListener('click', e => { e.preventDefault(); showView('register-view'); });
    document.getElementById('show-login')?.addEventListener('click', e => { e.preventDefault(); showView('login-view'); });
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.body.addEventListener('click', e => { if (e.target?.classList.contains('start-lesson-btn')) renderLessonContent(e.target.dataset.lessonId); });
}

function initializeApp() {
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');
    setupEventListeners();
    if (token && userId) {
        showView('subjects-view');
        fetchSubjects();
        setupUserAreaAndScores();
    } else {
        showView('login-view');
        document.getElementById('user-area').innerHTML = '<button id="login-button">Entrar</button>';
        document.getElementById('login-button')?.addEventListener('click', () => showView('login-view'));
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

// =================================================================================
// COLE A VERSÃO MINIFICADA DAS FUNÇÕES FALTANTES AQUI
// (COPIE E COLE O BLOCO ABAIXO INTEIRO)
// =================================================================================
function showView(e){document.querySelectorAll(".view").forEach(t=>t.classList.remove("active"));const o=document.getElementById(e);o&&o.classList.add("active")}function scrollToElement(e){e&&e.scrollIntoView({behavior:"smooth",block:"center"})}async function handleLogin(e){e.preventDefault();const t=document.getElementById("login-username").value,o=document.getElementById("login-password").value;try{const s=await fetch(`${API_URL}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:o})}),i=await s.json();if(!s.ok)throw new Error(i.message);localStorage.setItem("token",i.token),localStorage.setItem("username",i.username),localStorage.setItem("userId",i.userId),initializeApp()}catch(c){alert(`Erro no login: ${c.message}`)}}async function handleRegister(e){e.preventDefault();const t=document.getElementById("register-username").value,o=document.getElementById("register-password").value;try{const s=await fetch(`${API_URL}/api/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:o})});if(!s.ok){const i=await s.json();throw new Error(i.message)}alert("Registro bem-sucedido! Faça o login."),showView("login-view")}catch(c){alert(`Erro no registro: ${c.message}`)}}function setupUserAreaAndScores(){const e=document.getElementById("user-area"),t=document.getElementById("score-bar-container"),o=document.getElementById("my-certs-btn-container");e.innerHTML=`<span>Olá, ${localStorage.getItem("username")}!</span><button id="logout-button">Sair</button>`,document.getElementById("logout-button").addEventListener("click",()=>{localStorage.clear(),window.location.reload()}),t&&(t.style.display="flex"),o&&(o.style.display="flex"),document.getElementById("score-toggle-btn")?.addEventListener("click",()=>{const e=document.getElementById("score-panel");e.classList.toggle("visible"),e.classList.contains("visible")&&updateScores()}),document.getElementById("my-certs-btn")?.addEventListener("click",loadCertificates)}async function updateScores(){try{const e=await fetch(`${API_URL}/api/content/scores/user/${userId}`,{headers:{Authorization:`Bearer ${token}`}}),t=await e.json(),o=document.getElementById("score-list");o.innerHTML="",t.forEach(s=>{const i=s.total_lessons>0?(s.user_score/s.total_lessons*100).toFixed(0):0;o.innerHTML+=`<li><span class="score-name" style="color:${s.color_hex};">${s.name}</span><span class="score-value">${s.user_score}/${s.total_lessons} (${i}%)</span></li>`})}catch(s){console.error("Erro ao atualizar scores:",s)}}async function loadCertificates(){showView("certificates-view");const e=document.getElementById("certificates-list");e.innerHTML="Carregando...";try{const t=await fetch(`${API_URL}/api/content/certificates/user/${userId}`,{headers:{Authorization:`Bearer ${token}`}}),o=await t.json();e.innerHTML="",0===o.length?e.innerHTML="<p>Você ainda não possui certificados.</p>":o.forEach(s=>{const i=document.createElement("div");i.className="subject-card",i.innerHTML=`<h3>Certificado: ${s.subject_name}</h3>`,i.onclick=()=>showCertificate(s),e.appendChild(i)})}catch(s){e.innerHTML="Erro ao carregar certificados."}}function showCertificate(e){const t=document.getElementById("certificate-modal"),o=document.getElementById("certificate-content");o.innerHTML=`<button id="print-cert-btn" onclick="window.print()">🖨️</button><button id="close-modal-btn">X</button><div id="certificate-text"><p style="font-size: 1.5rem; margin-bottom: 30px;">Certificado de Conclusão</p><p>Certificamos que</p><p style="font-size: 2rem; font-family: 'Brush Script MT', cursive; margin: 20px 0;">${e.full_name}</p><p>concluiu a matéria <strong style="color: #333;">${e.subject_name}</strong> no Projeto Sapiens, pelo método Augenblicklich-Lernen.</p><p>Total de lições concluídas: ${e.total_lessons}</p><p style="font-size: 4rem; margin-top: 20px;">🏅</p></div>`,t.style.display="flex",o.querySelector("#close-modal-btn").onclick=()=>t.style.display="none"}async function loadLessons(e,t){showView("lesson-view"),lessonView.innerHTML="<h2>Carregando lições...</h2>";try{const o=await fetch(`${API_URL}/api/content/lessons/${e}`);if(!o.ok)throw new Error("Falha na resposta da rede ao buscar lições.");const s=await o.json();let i=t?`<h2>${t}</h2>`:"",c=`<button class="back-btn" onclick="showView('subjects-view')">← Voltar para Matérias</button>`;if(0===s.length)return void(lessonView.innerHTML=`${c}${i}<h2>Nenhuma lição disponível.</h2>`);lessonView.innerHTML=`${c}${i}<ul class="lesson-list"></ul>`;const a=lessonView.querySelector(".lesson-list"),r=0;s.forEach(l=>{const n=l.lesson_order>r+1,d=document.createElement("li");d.className=`lesson-item ${n?"locked":""}`,d.innerHTML=`<span>Lição ${l.lesson_order}: ${l.title}</span><button class="start-lesson-btn" data-lesson-id="${l.id}" ${n?"disabled":""}>Iniciar</button>`,a.appendChild(d)})}catch(n){console.error("Erro detalhado em loadLessons:",n),lessonView.innerHTML=`<h2>Erro ao carregar.</h2><p>${n.message}</p>`}}async function renderLessonContent(e){showView("lesson-view"),lessonView.innerHTML="<h2>Carregando lição...</h2>";try{const t=await fetch(`${API_URL}/api/content/lesson-detail/${e}`),o=await t.json();lessonView.innerHTML=`<button class="back-btn" onclick="loadLessons(${o.subject_id}, '')">← Voltar</button><div id="lesson-main-content"><h2>${o.title}</h2><div id="video-placeholder"></div><div id="post-video-content" style="display:none;"><hr><h3>Recursos</h3><img src="${o.image_url}" alt="Imagem da lição" style="max-width: 100%; border-radius: 8px;"><br/><audio controls src="${o.audio_url}"></audio><br/><button id="show-text-btn">Ver Explicação</button></div><div id="text-content" style="display:none;"><hr><h3>Explicação</h3><div>${o.lesson_text}</div><button id="start-quiz-btn">Iniciar Questões</button></div></div><div id="quiz-content-wrapper" style="display:none;"></div>`,createYouTubePlayer(o)}catch(s){lessonView.innerHTML=`<h2>Erro.</h2><p>${s.message}</p>`}}function createYouTubePlayer(e){let t;const o=new URL(e.video_url).searchParams.get("v");ytPlayer=new YT.Player("video-placeholder",{height:"480",width:"100%",videoId:o,events:{onStateChange:o=>{if(o.data===YT.PlayerState.PLAYING){const s=ytPlayer.getDuration();t=setInterval(()=>{s>0&&ytPlayer.getCurrentTime()/s>=.8&&(showPostVideoContent(),clearInterval(t))},1e3)}else clearInterval(t)}}}),document.getElementById("show-text-btn").addEventListener("click",()=>{const e=document.getElementById("text-content");e.style.display="block",scrollToElement(e)}),document.getElementById("start-quiz-btn").addEventListener("click",()=>{document.getElementById("lesson-main-content").style.display="none",renderQuiz(e)})}function showPostVideoContent(){const e=document.getElementById("post-video-content");"none"===e.style.display&&(e.style.display="block",scrollToElement(e))}async function renderQuiz(e){fetch(`${API_URL}/api/content/unlock-reinforcement`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,triggerLessonId:e.id})}).then(t=>t.json()).then(o=>{o.unlocked&&showReinforcementToast(o.title)});const t=document.getElementById("quiz-content-wrapper");t.style.display="block",t.innerHTML='<div id="quiz-content"></div>';const o=document.getElementById("quiz-content");scrollToElement(t);let s,i=null;function c(e,t,o){let c=e;t.textContent=`Tempo: ${c}s`,s=setInterval(()=>{c--,t.textContent=`Tempo: ${c}s`,c<=0&&(clearInterval(s),o())},1e3)}function a(e,t){const o=document.createElement("div");return o.id="quiz-feedback",o.className=e?"correct":"incorrect",o.innerHTML=`<p>${t}</p><button id="next-question-btn"></button>`,o.querySelector("#confirm-answer-btn")?.insertAdjacentElement("afterend",o),o.querySelector("#next-question-btn")}async function r(t,s,r,l=""){clearInterval(c),o.querySelectorAll(".option-btn").forEach(n=>{n.disabled=!0}),o.querySelector("#confirm-answer-btn").disabled=!0;const d=r===s;if(o.querySelectorAll(".btn").forEach(p=>{p.textContent===s&&p.classList.add("correct"),p===i&&!d&&p.classList.add("incorrect")}),"q1"===t){const u=l+(d?" Correto! Este foi um treino.":" Incorreto. A resposta certa está em verde."),m=a(d,u);m.textContent="Iniciar Questão 2",m.addEventListener("click",n)}else if("q2"===t){const f=await fetch(`${API_URL}/api/content/submit-quiz`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,lessonId:e.id,questionType:"q2",isCorrect:d})}),g=await f.json(),h=a(d,l+" "+g.message);"completed"===g.status?(h.textContent="Ver Próxima Lição",h.addEventListener("click",()=>{updateScores(),loadLessons(e.subject_id,"")})):"subject_finished"===g.status?(h.textContent="Gerar Certificado",h.addEventListener("click",()=>handleSubjectFinished(g.subjectId))):(h.textContent="Voltar ao Vídeo",h.addEventListener("click",()=>renderLessonContent(e.id)))}}async function n(){const t=await fetch(`${API_URL}/api/content/start-lesson/${e.id}/user/${userId}`),s=await t.json();if(s.blocked_until&&new Date<new Date(s.blocked_until))return alert(`Lição bloqueada. Tente novamente em ${new Date(s.blocked_until).toLocaleTimeString()}`),loadLessons(e.subject_id,"");const l=s.q2_variants_seen||[],d=[0,1,2].filter(p=>!l.includes(p));if(0===d.length)return alert("Você já tentou todas as variantes. Avançando com penalidade."),loadLessons(e.subject_id,"");const n=d[Math.floor(Math.random()*d.length)],p=e.q2_variants[n],u=p.options[0];o.innerHTML=`<h3>Questão 2 (Avaliativa)</h3><p>${p.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;const m=o.querySelector(".options-container"),f=()=>r("q2",u,null,"O tempo acabou!");c(e.q2_time,document.getElementById("timer"),f),[...p.options].sort(()=>.5-Math.random()).forEach(g=>{m.innerHTML+=`<button class="option-btn">${g}</button>`}),i=null,m.querySelectorAll(".option-btn").forEach(h=>{h.addEventListener("click",()=>{i&&i.classList.remove("selected"),i=h,h.classList.add("selected"),o.querySelector("#confirm-answer-btn").disabled=!1})}),o.querySelector("#confirm-answer-btn").addEventListener("click",()=>r("q2",u,i?i.textContent:null))}function l(){const t=e.q1_options[0];o.innerHTML=`<h3>Questão 1 (Treino)</h3><p>${e.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;const s=o.querySelector(".options-container"),l=()=>r("q1",t,null,"O tempo acabou!");c(e.q1_time,document.getElementById("timer"),l),[...e.q1_options].sort(()=>.5-Math.random()).forEach(a=>{s.innerHTML+=`<button class="option-btn">${a}</button>`}),i=null,s.querySelectorAll(".option-btn").forEach(n=>{n.addEventListener("click",()=>{i&&i.classList.remove("selected"),i=n,n.classList.add("selected"),o.querySelector("#confirm-answer-btn").disabled=!1})}),o.querySelector("#confirm-answer-btn").addEventListener("click",()=>r("q1",t,i?i.textContent:null))}l()}function showReinforcementToast(e){let t=document.getElementById("reinforcement-toast");t||(t=document.createElement("div"),t.id="reinforcement-toast",document.body.appendChild(t)),t.textContent=`Nova lição de reforço desbloqueada: ${e}!`,t.classList.add("show"),setTimeout(()=>{t.classList.remove("show")},5e3)}async function handleSubjectFinished(e){const t=prompt("Parabéns! Você concluiu todas as lições desta matéria!\n\nPara gerar seu certificado, por favor, insira seu nome completo:","");t&&t.trim()&&t.length<=40?await fetch(`${API_URL}/api/content/generate-certificate`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,subjectId:e,fullName:t.trim()})}).then(()=>{alert("Seu certificado foi gerado com sucesso! Você pode acessá-lo na seção 'Meus Certificados'."),loadLessons(e,"")}).catch(()=>{alert("Houve um erro ao gerar seu certificado.")}):t&&alert("Nome inválido. O nome deve ter no máximo 40 caracteres e não pode ser vazio.")}