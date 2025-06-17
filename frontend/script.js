// =================================================================================
// ARQUIVO script.js COMPLETO (FINALÍSSIMO com Reforço e Certificados)
// =================================================================================

const API_URL = 'https://sapiens-backend-ogz2.onrender.com';

// --- ELEMENTOS GLOBAIS ---
let token = localStorage.getItem('token');
let userId = localStorage.getItem('userId');

// --- PONTO DE ENTRADA PRINCIPAL ---
document.addEventListener('DOMContentLoaded', initializeApp);

// --- INICIALIZAÇÃO E AUTENTICAÇÃO ---
function initializeApp() {
    setupAuthListeners();
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
function setupAuthListeners() {
    document.getElementById('show-register')?.addEventListener('click', e => { e.preventDefault(); showView('register-view'); });
    document.getElementById('show-login')?.addEventListener('click', e => { e.preventDefault(); showView('login-view'); });
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
}
async function handleLogin(e) { /* ...código sem mudanças... */ }
async function handleRegister(e) { /* ...código sem mudanças... */ }

// --- ÁREA DO USUÁRIO, SCORES E CERTIFICADOS ---
function setupUserAreaAndScores() {
    document.getElementById('user-area').innerHTML = `<span>Olá, ${localStorage.getItem('username')}!</span><button id="logout-button">Sair</button>`;
    document.getElementById('logout-button').addEventListener('click', () => { localStorage.clear(); window.location.reload(); });
    const scoreContainer = document.getElementById('score-bar-container');
    if (scoreContainer) scoreContainer.style.display = 'flex';
    document.getElementById('score-toggle-btn')?.addEventListener('click', () => {
        const scorePanel = document.getElementById('score-panel');
        scorePanel.classList.toggle('visible');
        if (scorePanel.classList.contains('visible')) updateScores();
    });
    // NOVO BOTÃO DE CERTIFICADOS
    const certButton = document.createElement('button');
    certButton.id = 'my-certs-btn';
    certButton.textContent = 'Meus Certificados';
    certButton.onclick = loadCertificates;
    scoreContainer.insertAdjacentElement('afterend', certButton);
}
async function updateScores() { /* ...código sem mudanças... */ }

async function loadCertificates() {
    showView('certificates-view');
    const list = document.getElementById('certificates-list');
    list.innerHTML = 'Carregando...';
    try {
        const res = await fetch(`${API_URL}/api/content/certificates/user/${userId}`, { headers: { 'Authorization': `Bearer ${token}` }});
        const certs = await res.json();
        list.innerHTML = '';
        if (certs.length === 0) { list.innerHTML = '<p>Você ainda não possui certificados.</p>'; return; }
        certs.forEach(cert => {
            const certItem = document.createElement('div');
            certItem.className = 'subject-card'; // Reutilizando estilo
            certItem.innerHTML = `<h3>Certificado: ${cert.subject_name}</h3>`;
            certItem.onclick = () => showCertificate(cert);
            list.appendChild(certItem);
        });
    } catch (e) { list.innerHTML = 'Erro ao carregar certificados.'; }
}
function showCertificate(cert) {
    const modal = document.getElementById('certificate-modal');
    const content = document.getElementById('certificate-content');
    content.innerHTML = `
        <button id="print-cert-btn" onclick="window.print()">🖨️</button>
        <button id="close-modal-btn">X</button>
        <div id="certificate-text">
            <p style="font-size: 1.5rem; margin-bottom: 30px;">Certificado de Conclusão</p>
            <p>Certificamos que</p>
            <p style="font-size: 2rem; font-family: 'Brush Script MT', cursive; margin: 20px 0;">${cert.full_name}</p>
            <p>concluiu a matéria <strong style="color: #333;">${cert.subject_name}</strong> no Projeto Sapiens,
            pelo método Augenblicklich-Lernen.</p>
            <p>Total de lições concluídas: ${cert.total_lessons}</p>
            <p style="font-size: 4rem; margin-top: 20px;">🏅</p>
        </div>`;
    modal.style.display = 'flex';
    content.querySelector('#close-modal-btn').onclick = () => modal.style.display = 'none';
}

// --- NAVEGAÇÃO DE MATÉRIAS E LIÇÕES ---
async function fetchSubjects() { /* ...código sem mudanças... */ }
async function loadLessons(subjectId, subjectName) { /* ...código sem mudanças... */ }

// --- LÓGICA DA LIÇÃO E QUIZ ---
document.body.addEventListener('click', e => { if (e.target?.classList.contains('start-lesson-btn')) renderLessonContent(e.target.dataset.lessonId); });
async function renderLessonContent(lessonId) { /* ...código sem mudanças... */ }
function createYouTubePlayer(lesson) { /* ...código sem mudanças... */ }
function showPostVideoContent() { /* ...código sem mudanças... */ }
async function renderQuiz(lesson) {
    // DESBLOQUEIA LIÇÃO DE REFORÇO
    fetch(`${API_URL}/api/content/unlock-reinforcement`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId, triggerLessonId: lesson.id }) })
        .then(res => res.json())
        .then(data => {
            if (data.unlocked) showReinforcementToast(data.title);
        });
    /* ...resto do código de renderQuiz como antes... */
}
function showReinforcementToast(title) {
    let toast = document.getElementById('reinforcement-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'reinforcement-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = `Nova lição de reforço desbloqueada: ${title}!`;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 5000);
}
//... LÓGICA DE CONCLUSÃO DE MATÉRIA
async function handleSubjectFinished(subjectId) {
    const fullName = prompt("Parabéns! Você concluiu todas as lições desta matéria!\n\nPara gerar seu certificado, por favor, insira seu nome completo:", "");
    if (fullName && fullName.trim() !== "" && fullName.length <= 40) {
        try {
            await fetch(`${API_URL}/api/content/generate-certificate`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId, subjectId, fullName: fullName.trim() }) });
            alert('Seu certificado foi gerado com sucesso! Você pode acessá-lo na seção "Meus Certificados".');
            loadLessons(subjectId, ''); // Volta para a lista de lições
        } catch (error) { alert("Houve um erro ao gerar seu certificado."); }
    } else if (fullName) {
        alert("Nome inválido. O nome deve ter no máximo 40 caracteres e não pode ser vazio.");
    }
}
// Funções que estavam como placeholder antes
async function handleLogin(e){e.preventDefault();const t=document.getElementById("login-username").value,s=document.getElementById("login-password").value;try{const a=await fetch(`${API_URL}/api/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:s})}),n=await a.json();if(!a.ok)throw new Error(n.message);localStorage.setItem("token",n.token),localStorage.setItem("username",n.username),localStorage.setItem("userId",n.userId),initializeApp()}catch(o){alert(`Erro no login: ${o.message}`)}}
async function handleRegister(e){e.preventDefault();const t=document.getElementById("register-username").value,s=document.getElementById("register-password").value;try{const a=await fetch(`${API_URL}/api/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:s})});if(!a.ok){const n=await a.json();throw new Error(n.message)}alert("Registro bem-sucedido! Faça o login."),showView("login-view")}catch(o){alert(`Erro no registro: ${o.message}`)}}
async function updateScores(){try{const e=await fetch(`${API_URL}/api/content/scores/user/${userId}`,{headers:{Authorization:`Bearer ${token}`}}),t=await e.json(),s=document.getElementById("score-list");s.innerHTML="",t.forEach(a=>{const n=a.total_lessons>0?(a.user_score/a.total_lessons*100).toFixed(0):0;s.innerHTML+=`<li><span class="score-name" style="color:${a.color_hex};">${a.name}</span><span class="score-value">${a.user_score}/${a.total_lessons} (${n}%)</span></li>`})}catch(a){console.error("Erro ao atualizar scores:",a)}}
async function fetchSubjects(){if(!subjectsGrid)return;try{const e=await fetch(`${API_URL}/api/content/subjects`,{headers:{Authorization:`Bearer ${token}`}});if(!e.ok)throw new Error("Falha na resposta da rede ao buscar matérias.");const t=await e.json();for(;subjectsGrid.firstChild;)subjectsGrid.removeChild(subjectsGrid.firstChild);if(0===t.length)return void(subjectsGrid.innerHTML="<p>Nenhuma matéria cadastrada ainda.</p>");t.forEach(s=>{const a=document.createElement("div");a.className="subject-card",a.style.setProperty("--subject-color",s.color_hex);const n=document.createElement("h3");n.textContent=s.name,a.appendChild(n),a.addEventListener("click",()=>loadLessons(s.id,s.name)),subjectsGrid.appendChild(a)})}catch(s){console.error("Erro detalhado em fetchSubjects:",s),subjectsGrid.innerHTML="<p>Ocorreu um erro ao carregar as matérias. Tente recarregar a página.</p>"}}
async function loadLessons(e,t){showView("lesson-view"),lessonView.innerHTML="<h2>Carregando lições...</h2>";try{const s=await fetch(`${API_URL}/api/content/lessons/${e}`);if(!s.ok)throw new Error("Falha na resposta da rede ao buscar lições.");const a=await s.json();let n=t?`<h2>${t}</h2>`:"",o=`<button class="back-btn" onclick="showView('subjects-view')">← Voltar para Matérias</button>`;if(0===a.length)return void(lessonView.innerHTML=`${o}${n}<h2>Nenhuma lição disponível.</h2>`);lessonView.innerHTML=`${o}${n}<ul class="lesson-list"></ul>`;const i=lessonView.querySelector(".lesson-list"),r=0;a.forEach(l=>{const c=l.lesson_order>r+1,d=document.createElement("li");d.className=`lesson-item ${c?"locked":""}`,d.innerHTML=`<span>Lição ${l.lesson_order}: ${l.title}</span><button class="start-lesson-btn" data-lesson-id="${l.id}" ${c?"disabled":""}>Iniciar</button>`,i.appendChild(d)})}catch(c){console.error("Erro detalhado em loadLessons:",c),lessonView.innerHTML=`<h2>Erro ao carregar.</h2><p>${c.message}</p>`}}
async function renderLessonContent(e){showView("lesson-view"),lessonView.innerHTML="<h2>Carregando lição...</h2>";try{const t=await fetch(`${API_URL}/api/content/lesson-detail/${e}`),s=await t.json();lessonView.innerHTML=`\n            <button class="back-btn" onclick="loadLessons(${s.subject_id}, '')">← Voltar</button>\n            <div id="lesson-main-content"><h2>${s.title}</h2><div id="video-placeholder"></div>\n            <div id="post-video-content" style="display:none;"><hr><h3>Recursos</h3><img src="${s.image_url}" alt="Imagem da lição" style="max-width: 100%; border-radius: 8px;"><br/><audio controls src="${s.audio_url}"></audio><br/><button id="show-text-btn">Ver Explicação</button></div>\n            <div id="text-content" style="display:none;"><hr><h3>Explicação</h3><div>${s.lesson_text}</div><button id="start-quiz-btn">Iniciar Questões</button></div></div>\n            <div id="quiz-content-wrapper" style="display:none;"></div>`,createYouTubePlayer(s)}catch(a){lessonView.innerHTML=`<h2>Erro.</h2><p>${a.message}</p>`}}
function createYouTubePlayer(e){let t;const s=new URL(e.video_url).searchParams.get("v");ytPlayer=new YT.Player("video-placeholder",{height:"480",width:"100%",videoId:s,events:{onStateChange:s=>{if(s.data===YT.PlayerState.PLAYING){const a=ytPlayer.getDuration();t=setInterval(()=>{a>0&&ytPlayer.getCurrentTime()/a>=.8&&(showPostVideoContent(),clearInterval(t))},1e3)}else clearInterval(t)}}}),document.getElementById("show-text-btn").addEventListener("click",()=>{const e=document.getElementById("text-content");e.style.display="block",scrollToElement(e)}),document.getElementById("start-quiz-btn").addEventListener("click",()=>{document.getElementById("lesson-main-content").style.display="none",renderQuiz(e)})}
function showPostVideoContent(){const e=document.getElementById("post-video-content");"none"===e.style.display&&(e.style.display="block",scrollToElement(e))}
async function renderQuiz(e){fetch(`${API_URL}/api/content/unlock-reinforcement`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,triggerLessonId:e.id})}).then(t=>t.json()).then(s=>{s.unlocked&&showReinforcementToast(s.title)});const t=document.getElementById("quiz-content-wrapper");t.style.display="block",t.innerHTML='<div id="quiz-content"></div>';const s=document.getElementById("quiz-content");scrollToElement(t);let a,n=null;function o(e,t,i){let r=e;t.textContent=`Tempo: ${r}s`,a=setInterval(()=>{r--,t.textContent=`Tempo: ${r}s`,r<=0&&(clearInterval(a),i())},1e3)}function i(e,t){const a=document.createElement("div");return a.id="quiz-feedback",a.className=e?"correct":"incorrect",a.innerHTML=`<p>${t}</p><button id="next-question-btn"></button>`,s.querySelector("#confirm-answer-btn")?.insertAdjacentElement("afterend",a),a.querySelector("#next-question-btn")}async function r(t,a,r,l=""){clearInterval(o),s.querySelectorAll(".option-btn").forEach(c=>{c.disabled=!0}),s.querySelector("#confirm-answer-btn").disabled=!0;const c=r===a;if(s.querySelectorAll(".option-btn").forEach(d=>{d.textContent===a&&d.classList.add("correct"),d===n&&!c&&d.classList.add("incorrect")}),"q1"===t){const p=l+(c?" Correto! Este foi um treino.":" Incorreto. A resposta certa está em verde."),u=i(c,p);u.textContent="Iniciar Questão 2",u.addEventListener("click",d)}else if("q2"===t){const m=await fetch(`${API_URL}/api/content/submit-quiz`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({userId,lessonId:e.id,questionType:"q2",isCorrect:c})}),f=await m.json(),g=i(c,l+" "+f.message);"completed"===f.status?(g.textContent="Ver Próxima Lição",g.addEventListener("click",()=>{updateScores(),loadLessons(e.subject_id,"")})):"subject_finished"===f.status?(g.textContent="Gerar Certificado",g.addEventListener("click",()=>handleSubjectFinished(f.subjectId))):(g.textContent="Voltar ao Vídeo",g.addEventListener("click",()=>renderLessonContent(e.id)))}}async function d(){const t=await fetch(`${API_URL}/api/content/start-lesson/${e.id}/user/${userId}`),a=await t.json();if(a.blocked_until&&new Date<new Date(a.blocked_until))return alert(`Lição bloqueada. Tente novamente em ${new Date(a.blocked_until).toLocaleTimeString()}`),loadLessons(e.subject_id,"");const l=a.q2_variants_seen||[],c=[0,1,2].filter(p=>!l.includes(p));if(0===c.length)return alert("Você já tentou todas as variantes. Avançando com penalidade."),loadLessons(e.subject_id,"");const d=c[Math.floor(Math.random()*c.length)],p=e.q2_variants[d],u=p.options[0];s.innerHTML=`<h3>Questão 2 (Avaliativa)</h3><p>${p.text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;const m=s.querySelector(".options-container"),f=()=>r("q2",u,null,"O tempo acabou!");o(e.q2_time,document.getElementById("timer"),f),[...p.options].sort(()=>.5-Math.random()).forEach(g=>{m.innerHTML+=`<button class="option-btn">${g}</button>`}),n=null,m.querySelectorAll(".option-btn").forEach(h=>{h.addEventListener("click",()=>{n&&n.classList.remove("selected"),n=h,h.classList.add("selected"),s.querySelector("#confirm-answer-btn").disabled=!1})}),s.querySelector("#confirm-answer-btn").addEventListener("click",()=>r("q2",u,n?n.textContent:null))}function l(){const t=e.q1_options[0];s.innerHTML=`<h3>Questão 1 (Treino)</h3><p>${e.q1_text}</p><div id="timer"></div><div class="options-container"></div><button id="confirm-answer-btn" disabled>Confirmar</button>`;const a=s.querySelector(".options-container"),l=()=>r("q1",t,null,"O tempo acabou!");o(e.q1_time,document.getElementById("timer"),l),[...e.q1_options].sort(()=>.5-Math.random()).forEach(c=>{a.innerHTML+=`<button class="option-btn">${c}</button>`}),n=null,a.querySelectorAll(".option-btn").forEach(d=>{d.addEventListener("click",()=>{n&&n.classList.remove("selected"),n=d,d.classList.add("selected"),s.querySelector("#confirm-answer-btn").disabled=!1})}),s.querySelector("#confirm-answer-btn").addEventListener("click",()=>r("q1",t,n?n.textContent:null))}l()}