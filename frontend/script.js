// =================================================================================
// ARQUIVO script.js (VERSÃO FINAL COM EVENT LISTENERS CORRIGIDOS)
// =================================================================================

// --- 1. CONFIGURAÇÃO E ESTADO GLOBAL ---
const API_URL = 'https://sapiens-backend-ogz2.onrender.com';
let token;
let userId;
let ytPlayer;
let lessonView;
let subjectsGrid;

// --- PONTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', initializeApp);

// =================================================================================
// 2. DEFINIÇÃO DE TODAS AS FUNÇÕES
// =================================================================================

function showView(viewId) { /* ...código da função... */ }
function scrollToElement(element) { /* ...código da função... */ }
async function handleLogin(e) { /* ...código da função... */ }
async function handleRegister(e) { /* ...código da função... */ }
function setupUserAreaAndScores() { /* ...código da função... */ }
async function updateScores() { /* ...código da função... */ }
async function fetchSubjects() { /* ...código da função... */ }
async function loadLessons(subjectId, subjectName) { /* ...código da função... */ }
async function fetchReinforcementLessons() { /* ...código da função... */ }
async function renderLessonContent(lessonId) { /* ...código da função... */ }
function createYouTubePlayer(lesson) { /* ...código da função... */ }
function showPostVideoContent() { /* ...código da função... */ }
async function renderQuiz(lesson) { /* ...código da função... */ }
async function renderReinforcementLesson(lessonId) { /* ...código da função... */ }
function showReinforcementToast(title) { /* ...código da função... */ }
async function handleSubjectFinished(subjectId) { /* ...código da função... */ }

async function loadCertificates() {
    showView('certificates-view');
    const list = document.getElementById('certificates-list');
    list.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`${API_URL}/api/content/certificates/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const certs = await res.json();
        list.innerHTML = '';
        if (certs.length === 0) {
            list.innerHTML = '<p>Você ainda não possui certificados.</p>';
            return;
        }
        certs.forEach(cert => {
            const item = document.createElement('div');
            // CORREÇÃO APLICADA AQUI:
            item.className = 'subject-card certificate-card'; // Adiciona classe específica
            item.innerHTML = `<h3>Certificado: ${cert.subject_name}</h3>`;
            // Armazena os dados diretamente no elemento para o ouvinte delegado pegar
            item.dataset.certData = JSON.stringify(cert);
            list.appendChild(item);
        });
    } catch (e) {
        list.innerHTML = 'Erro ao carregar.';
    }
}

function showCertificate(cert) {
    const modal = document.getElementById('certificate-modal');
    // ...código da função...
}


// =================================================================================
// 3. INICIALIZAÇÃO E CONFIGURAÇÃO DOS EVENTOS
// =================================================================================

function setupEventListeners() {
    // Este ouvinte de cliques cuida de TUDO que é clicável no body
    document.body.addEventListener('click', (e) => {
        const target = e.target;
        
        // Links de navegação de login/registro
        if (target.id === 'show-register') { e.preventDefault(); showView('register-view'); }
        if (target.id === 'show-login') { e.preventDefault(); showView('login-view'); }
        if (target.id === 'login-button') { showView('login-view'); }

        // Botão para iniciar uma lição
        if (target.classList.contains('start-lesson-btn')) {
            renderLessonContent(target.dataset.lessonId);
        }

        // LÓGICA DO CERTIFICADO CORRIGIDA
        const certCard = target.closest('.certificate-card');
        if (certCard && certCard.dataset.certData) {
            const certData = JSON.parse(certCard.dataset.certData);
            showCertificate(certData);
        }
    });

    // Este ouvinte cuida do envio de formulários
    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'login-form') { handleLogin(e); }
        if (e.target.id === 'register-form') { handleRegister(e); }
    });
}

function initializeApp() {
    lessonView = document.getElementById('lesson-view');
    subjectsGrid = document.getElementById('subjects-grid');
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');

    setupEventListeners(); // Chama a função que configura os ouvintes

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
// COLE AS DEFINIÇÕES COMPLETAS DAS FUNÇÕES QUE ESTAVAM FALTANDO AQUI
function showView(e){document.querySelectorAll(".view").forEach(t=>t.classList.remove("active"));const o=document.getElementById(e);o&&o.classList.add("active")}function scrollToElement(e){e&&e.scrollIntoView({behavior:"smooth",block:"center"})}async function handleLogin(e){e.preventDefault();const t=document.getElementById("login-username").value,o=document.getElementById("login-password").value;try{const s=await fetch(`${API_URL}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:o})});const i=await s.json();if(!s.ok)throw new Error(i.message);localStorage.setItem("token",i.token),localStorage.setItem("username",i.username),localStorage.setItem("userId",i.userId),initializeApp()}catch(c){alert(`Erro no login: ${c.message}`)}}async function handleRegister(e){e.preventDefault();const t=document.getElementById("register-username").value,o=document.getElementById("register-password").value;try{const s=await fetch(`${API_URL}/api/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:o})});if(!s.ok){const i=await s.json();throw new Error(i.message)}alert("Registro bem-sucedido! Faça o login."),showView("login-view")}catch(c){alert(`Erro no registro: ${c.message}`)}}function setupUserAreaAndScores(){const e=document.getElementById("user-area"),t=document.getElementById("score-bar-container"),o=document.querySelector(".header-right-group");e.innerHTML=`<span>Olá, ${localStorage.getItem("username")}!</span><button id="logout-button">Sair</button>`,document.getElementById("logout-button").addEventListener("click",()=>{localStorage.clear(),window.location.reload()}),t&&(t.style.display="flex"),document.getElementById("score-toggle-btn")?.addEventListener("click",()=>{const e=document.getElementById("score-panel");e.classList.toggle("visible"),e.classList.contains("visible")&&updateScores()}),o&&!document.getElementById("my-certs-btn")&&(e=document.createElement("button"),e.id="my-certs-btn",e.textContent="Meus Certificados",e.onclick=loadCertificates,t.insertAdjacentElement("afterend",e))}async function updateScores(){const e=document.getElementById("score-list");try{const t=await fetch(`${API_URL}/api/content/scores/user/${userId}`,{headers:{Authorization:`Bearer ${token}`}});if(!t.ok)throw new Error("Falha ao buscar scores");const o=await t.json();e.innerHTML="",o&&o.length>0&&o.forEach(s=>{const i=s.total_lessons>0?(s.user_score/s.total_lessons*100).toFixed(0):0;e.innerHTML+=`<li><span class="score-name" style="color:${s.color_hex};">${s.name}</span><span class="score-value">${s.user_score}/${s.total_lessons} (${i}%)</span></li>`})}catch(s){console.error("Erro ao atualizar scores:",s),e.innerHTML="<li>Erro ao carregar.</li>"}}async function fetchSubjects(){if(!subjectsGrid)return;try{const e=await fetch(`${API_URL}/api/content/subjects`,{headers:{Authorization:`Bearer ${token}`}});if(!e.ok)throw new Error("Falha ao buscar matérias.");const t=await e.json();subjectsGrid.innerHTML="",t.main&&t.main.length>0&&t.main.forEach(o=>{const s=document.createElement("div");s.className="subject-card",s.style.setProperty("--subject-color",o.color_hex),s.innerHTML=`<h3>${o.name}</h3>`,s.addEventListener("click",()=>loadLessons(o.id,o.name)),subjectsGrid.appendChild(s)});let o=document.getElementById("extra-subjects-container");o||(o=document.createElement("div"),o.id="extra-subjects-container",subjectsGrid.insertAdjacentElement("afterend",o)),o.innerHTML="",t.extra&&t.extra.length>0&&(o.innerHTML="<hr><h2>Matérias Extras</h2>",t.extra.forEach(i=>{const c=document.createElement("div");c.className="subject-card extra",c.style.setProperty("--subject-color",i.color_hex),c.innerHTML=`<h3>${i.name}</h3>`,c.addEventListener("click",()=>loadLessons(i.id,i.name)),o.appendChild(c)}))}catch(s){console.error("Erro em fetchSubjects:",s),subjectsGrid&&(subjectsGrid.innerHTML="<p>Erro ao carregar matérias.</p>")}}async function loadLessons(e,t){if(!lessonView)return;showView("lesson-view"),lessonView.innerHTML="<h2>Carregando...</h2>";try{const o=await fetch(`${API_URL}/api/content/lessons/${e}`);if(!o.ok)throw new Error("Falha ao buscar lições.");const s=await o.json();let i=t?`<h2>${t}</h2>`:"",c=`<button class="back-btn" onclick="showView('subjects-view')">← Voltar</button>`;if(0===s.length)return void(lessonView.innerHTML=`${c}${i}<h2>Nenhuma lição disponível.</h2>`);lessonView.innerHTML=`${c}${i}<ul class="lesson-list"></ul>`;const a=lessonView.querySelector(".lesson-list");s.forEach(r=>{const l=document.createElement("li");l.className="lesson-item",l.innerHTML=`<span>Lição ${r.lesson_order}: ${r.title}</span><button class="start-lesson-btn" data-lesson-id="${r.id}">Iniciar</button>`,a.appendChild(l)})}catch(r){console.error("Erro em loadLessons:",r),lessonView.innerHTML=`<h2>Erro.</h2><p>${r.message}</p>`}}async function fetchReinforcementLessons(){const e=document.getElementById("reinforcement-section"),t=document.getElementById("reinforcement-list");if(!e||!t)return;try{const o=await fetch(`${API_URL}/api/content/reinforcement/user/${userId}`,{headers:{Authorization:`Bearer ${token}`}}),s=await o.json();s.length>0?(e.style.display="block",t.innerHTML="",s.forEach(i=>{const c=document.createElement("div");c.className="subject-card",c.style.borderColor="#4299e1",c.innerHTML=`<h3>${i.title}</h3>`,c.onclick=()=>renderReinforcementLesson(i.id),t.appendChild(c)})):e.style.display="none"}catch(i){console.error("Erro ao buscar lições de reforço:",i)}}async function renderLessonContent(e){if(!lessonView)return;showView("lesson-view"),lessonView.innerHTML=`<h2>Carregando...</h2>`;try{const t=await fetch(`${API_URL}/api/content/lesson-detail/${e}`),o=await t.json();lessonView.innerHTML=`<button class="back-btn" onclick="loadLessons(${o.subject_id}, '')">← Voltar</button><div id="lesson-main-content"><h2>${o.title}</h2><div id="video-placeholder"></div><div id="post-video-content" style="display:none;"><hr><h3>Recursos</h3><img src="${o.image_url}" alt="Imagem" style="max-width:100%; border-radius: 8px;"><br/><audio controls src="${o.audio_url}"></audio><br/><button id="show-text-btn">Ver Explicação</button></div><div id="text-content" style="display:none;"><hr><h3>Explicação</h3><div>${o.lesson_text}</div><button id="start-quiz-btn">Iniciar Questões</button></div></div><div id="quiz-content-wrapper" style="display:none;"></div>`,createYouTubePlayer(o)}catch(s){lessonView.innerHTML=`<h2>Erro.</h2><p>${s.message}</p>`}}function createYouTubePlayer(e){let t;try{const o=new URL(e.video_url).searchParams.get("v");ytPlayer=new YT.Player("video-placeholder",{height:"480",width:"100%",videoId:o,events:{onStateChange:o=>{if(o.data===YT.PlayerState.PLAYING){t=setInterval(()=>{const s=ytPlayer.getDuration();s>0&&ytPlayer.getCurrentTime()/s>=.8&&(showPostVideoContent(),clearInterval(t))},1e3)}else clearInterval(t)}}})}catch(s){console.error("URL do vídeo inválida:",e.video_url)}document.getElementById("show-text-btn")?.addEventListener("click",()=>{const e=document.getElementById("text-content");e.style.display="block",scrollToElement(e)}),document.getElementById("start-quiz-btn")?.addEventListener("click",()=>{document.getElementById("lesson-main-content").style.display="none",renderQuiz(e)})}function showPostVideoContent(){const e=document.getElementById("post-video-content");e&&"none"===e.style.display&&(e.style.display="block",scrollToElement(e))}async function renderQuiz(e){fetch(`${API_URL}/api/content/unlock-reinforcement`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,triggerLessonId:e.id})}).then(t=>t.json()).then(o=>{o.unlocked&&showReinforcementToast(o.title)});const t=document.getElementById("quiz-content-wrapper");t.style.display="block",t.innerHTML='<div id="quiz-content"></div>';const o=document.getElementById("quiz-content");scrollToElement(t);let s,i=null;function c(e,t,o){let c=e;t.textContent=`Tempo: ${c}s`,s=setInterval(()=>{c--,t.textContent=`Tempo: ${c}s`,c<=0&&(clearInterval(s),o())},1e3)}function a(e,t){const s=document.createElement("div");return s.id="quiz-feedback",s.className=e?"correct":"incorrect",s.innerHTML=`<p>${t}</p><button id="next-question-btn"></button>`,o.querySelector("#confirm-answer-btn")?.insertAdjacentElement("afterend",s),s.querySelector("#next-question-btn")}async function r(t,s,r,l=""){clearInterval(c),o.querySelectorAll(".option-btn").forEach(n=>{n.disabled=!0}),o.querySelector("#confirm-answer-btn").disabled=!0;const d=r===s;if(o.querySelectorAll(".btn").forEach(p=>{p.textContent===s&&p.classList.add("correct"),p===i&&!d&&p.classList.add("incorrect")}),"q1"===t){const u=l+(d?" Correto! Este foi um treino.":" Incorreto. A resposta certa está em verde."),m=a(d,u);m.textContent="Iniciar Questão 2",m.addEventListener("click",n)}else if("q2"===t){const f=await fetch(`${API_URL}/api/content/submit-quiz`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,lessonId:e.id,isCorrect:d})});const g=await f.json();const h=a(d,l+" "+g.message);"completed"===g.status?(h.textContent="Ver Próxima Lição",h.addEventListener("click",()=>{updateScores(),loadLessons(e.subject_id,"")})):"subject_finished"===g.status?(h.textContent="Gerar Certificado",h.addEventListener("click",()=>handleSubjectFinished(g.subjectId))):(h.textContent="Voltar ao Vídeo",h.addEventListener("click",()=>renderLessonContent(e.id)))}}async function n(){const t=await fetch(`${API_URL}/api/content/start-lesson/${e.id}/user/${userId}`);if(!t.ok)return void alert("Erro de comunicação, tente novamente.");const s=await t.json();if(s.blocked_until&&new Date<new Date(s.blocked_until))return alert(`Lição bloqueada. Tente novamente em ${new Date(s.blocked_until).toLocaleTimeString()}`),loadLessons(e.subject_id,"");const c=s.q2_variants_seen||[],a=[0,1,2].filter(p=>!c.includes(p));if(0===a.length)return alert("Você já tentou todas as variantes. Avançando com penalidade."),loadLessons(e.subject_id,"");const r=a[Math.floor(Math.random()*a.length)],l=e.q2_variants[r],d=l.options[0];o.innerHTML=`<h3>Questão 2 (Avaliativa)</h3><p>${l.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;const p=o.querySelector(".options-container"),u=()=>r("q2",d,null,"O tempo acabou!");c(e.q2_time,document.getElementById("timer"),u),[...l.options].sort(()=>.5-Math.random()).forEach(m=>{p.innerHTML+=`<button class="option-btn">${m}</button>`}),i=null,p.querySelectorAll(".option-btn").forEach(f=>{f.addEventListener("click",()=>{i&&i.classList.remove("selected"),i=f,f.classList.add("selected"),o.querySelector("#confirm-answer-btn").disabled=!1})}),o.querySelector("#confirm-answer-btn").addEventListener("click",()=>r("q2",d,i?i.textContent:null))}function l(){const t=e.q1_options[0];o.innerHTML=`<h3>Questão 1 (Treino)</h3><p>${e.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;const s=o.querySelector(".options-container"),l=()=>r("q1",t,null,"O tempo acabou!");c(e.q1_time,document.getElementById("timer"),l),[...e.q1_options].sort(()=>.5-Math.random()).forEach(a=>{s.innerHTML+=`<button class="option-btn">${a}</button>`}),i=null,s.querySelectorAll(".option-btn").forEach(n=>{n.addEventListener("click",()=>{i&&i.classList.remove("selected"),i=n,n.classList.add("selected"),o.querySelector("#confirm-answer-btn").disabled=!1})}),o.querySelector("#confirm-answer-btn").addEventListener("click",()=>r("q1",t,i?i.textContent:null))}l()}
function showReinforcementToast(e){let t=document.getElementById("reinforcement-toast");t||(t=document.createElement("div"),t.id="reinforcement-toast",document.body.appendChild(t)),t.textContent=`Nova lição de reforço desbloqueada: ${e}!`,t.classList.add("show"),setTimeout(()=>{t.classList.remove("show")},5e3)}
async function handleSubjectFinished(e){const t=prompt("Parabéns! Você concluiu todas as lições desta matéria!\n\nPara gerar seu certificado, por favor, insira seu nome completo:","");t&&t.trim()&&t.length<=40?await fetch(`${API_URL}/api/content/generate-certificate`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,subjectId:e,fullName:t.trim()})}).then(()=>{alert("Seu certificado foi gerado com sucesso! Você pode acessá-lo na seção 'Meus Certificados'."),loadLessons(e,"")}).catch(()=>{alert("Houve um erro ao gerar seu certificado.")}):t&&alert("Nome inválido (máximo 40 caracteres).")}
function showCertificate(e){const t=document.getElementById("certificate-modal"),o=document.getElementById("certificate-content");o.innerHTML=`<button id="print-cert-btn" onclick="window.print()">🖨️</button><button id="close-modal-btn" onclick="document.getElementById('certificate-modal').classList.remove('visible')">X</button><div id="certificate-text"><p style="font-size: 1.5rem; margin-bottom: 30px;">Certificado de Conclusão</p><p>Certificamos que</p><p style="font-size: 2rem; font-family: 'Brush Script MT', cursive; margin: 20px 0;">${e.full_name}</p><p>concluiu a matéria <strong style="color: #333;">${e.subject_name}</strong> no Projeto Sapiens,<br>pelo método Augenblicklich-Lernen.</p><p>Total de lições concluídas: ${e.total_lessons}</p><p style="font-size: 4rem; margin-top: 20px;">🏅</p></div>`,t.classList.add("visible")}