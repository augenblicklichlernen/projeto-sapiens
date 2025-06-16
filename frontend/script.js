// A URL do seu cérebro (backend) quando estiver no ar no Render
// Por enquanto, usamos a URL local para desenvolvimento
const API_URL = 'https://sapiens-backend-ogz2.onrender.com';

// Elementos da página
const appContent = document.getElementById('app-content');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const subjectsView = document.getElementById('subjects-view');
const lessonView = document.getElementById('lesson-view');
const subjectsGrid = document.getElementById('subjects-grid');

// Formulários
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Links de navegação entre login/registro
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Estado do aplicativo
let token = localStorage.getItem('token');

// --- FUNÇÕES DE NAVEGAÇÃO ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// --- LÓGICA DE AUTENTICAÇÃO ---
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView('register-view');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView('login-view');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const responseText = await response.text(); // Primeiro, pegamos a resposta como texto
    if (!response.ok) {
        // Se deu erro, tentamos extrair a mensagem de erro do texto
        try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || 'Usuário ou senha inválidos.');
        } catch (e) {
            throw new Error('Erro de comunicação com o servidor.');
        }
    }

    const data = JSON.parse(responseText); // Se deu tudo certo, convertemos o texto para JSON

    token = data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('username', data.username);
    
    initializeApp();

} catch (error) {
    alert(`Erro no login: ${error.message}`);
}
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
        // Tenta ler a mensagem de erro do servidor, se houver
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
        throw new Error(errorData.message);
    }

    // Se a resposta for OK, mas não necessariamente tiver conteúdo
    alert('Registro bem-sucedido! Faça o login.');
    showView('login-view');
    registerForm.reset();

} catch (error) {
     alert(`Erro no registro: ${error.message}`);
}
});


// --- LÓGICA PRINCIPAL DO APP ---
async function fetchSubjects() {
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const subjects = await response.json();
        
        subjectsGrid.innerHTML = ''; // Limpa a grade
        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            // A mágica da cor dinâmica acontece aqui!
            card.style.setProperty('--subject-color', subject.color_hex);
            card.innerHTML = `<h3>${subject.name}</h3>`;
            card.addEventListener('click', () => loadLessons(subject.id));
            subjectsGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Erro ao buscar matérias:', error);
    }
}

// =====================================================================
// COLE ESTE BLOCO NO LUGAR DA ANTIGA FUNÇÃO loadLessons
// =====================================================================

async function loadLessons(subjectId) {
    showView('lesson-view');
    lessonView.innerHTML = '<h2>Carregando lições...</h2>';

    try {
        const response = await fetch(`${API_URL}/api/content/lessons/${subjectId}`);
        if (!response.ok) throw new Error('Não foi possível carregar as lições.');
        
        const lessons = await response.json();

        if (lessons.length === 0) {
            lessonView.innerHTML = `
                <button class="back-btn" onclick="showView('subjects-view')">← Voltar para Matérias</button>
                <h2>Nenhuma lição disponível.</h2>
                <p>O conteúdo para esta matéria será adicionado em breve.</p>
            `;
            return;
        }

        // --- LÓGICA DE BLOQUEIO DE LIÇÕES ---
        // Aqui você buscaria o progresso do aluno no backend.
        // Por enquanto, vamos simplificar e desbloquear apenas a primeira lição.
        const lastCompletedLessonOrder = 0; // No futuro, isso viria do progresso do usuário.

        let lessonListHtml = `
            <button class="back-btn" onclick="showView('subjects-view')">← Voltar para Matérias</button>
            <h2>Lições</h2>
            <ul class="lesson-list">
        `;

        lessons.forEach(lesson => {
            const isLocked = lesson.lesson_order > lastCompletedLessonOrder + 1;
            
            lessonListHtml += `
                <li class="lesson-item ${isLocked ? 'locked' : ''}">
                    <span>Lição ${lesson.lesson_order}: ${lesson.title}</span>
                    <button class="start-lesson-btn" data-lesson-id="${lesson.id}" ${isLocked ? 'disabled' : ''}>
                        Iniciar
                    </button>
                </li>
            `;
        });
        
        lessonListHtml += '</ul>';
        lessonView.innerHTML = lessonListHtml;

    } catch (error) {
        lessonView.innerHTML = `<h2>Erro ao carregar.</h2><p>${error.message}</p>`;
    }
}

// =====================================================================
// COLE ESTE BLOCO NO LUGAR DAS ANTIGAS FUNÇÕES renderLessonContent E addEventListener
// =====================================================================

// "Ouvinte" de eventos para os botões "Iniciar" na lista de lições
document.body.addEventListener('click', async e => {
    if (e.target && e.target.classList.contains('start-lesson-btn')) {
        const lessonId = e.target.dataset.lessonId;
        showView('lesson-view');
        lessonView.innerHTML = `<h2>Carregando lição...</h2>`;
        
        try {
            // Passo 1: Buscar os detalhes da lição no backend
            const response = await fetch(`${API_URL}/api/content/lesson-detail/${lessonId}`);
            if (!response.ok) throw new Error('Não foi possível carregar o conteúdo da lição.');
            
            const lesson = await response.json();

            // Passo 2: Construir a interface da lição com os dados recebidos
            lessonView.innerHTML = `
                <button class="back-btn" onclick="loadLessons(${lesson.subject_id})">← Voltar para Lições</button>
                
                <div id="lesson-content-area">
                    <h2>${lesson.title}</h2>
                    
                    <div id="video-container">
                        <iframe width="100%" height="480" src="${lesson.video_url.replace('watch?v=', 'embed/')}" 
                                title="YouTube video player" frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                        </iframe>
                    </div>

                    <div id="post-video-content" style="display:none;">
                        <h3>Recursos Adicionais</h3>
                        <div id="image-container">
                            <img src="${lesson.image_url}" alt="Imagem da lição" style="max-width: 100%;">
                        </div>
                        <div id="audio-container">
                            <audio controls src="${lesson.audio_url}"></audio>
                        </div>
                        <button id="show-text-btn">Ver Explicação Escrita</button>
                    </div>

                    <div id="text-content" style="display:none;">
                        <h3>Explicação Detalhada</h3>
                        <div>${lesson.lesson_text}</div>
                        <button id="start-quiz-btn">Iniciar Questões</button>
                    </div>

                    <div id="quiz-content" style="display:none;">
                        <!-- O quiz será construído aqui -->
                        <p>O quiz aparecerá aqui em breve!</p>
                    </div>
                </div>
            `;
            
            // Passo 3: Adicionar a lógica de interatividade da lição
            addLessonInteractivity(lesson);

        } catch (error) {
            lessonView.innerHTML = `<h2>Erro ao carregar.</h2><p>${error.message}</p>`;
        }
    }
});


function addLessonInteractivity(lesson) {
    const videoFrame = document.querySelector('#video-container iframe');
    const postVideoContent = document.getElementById('post-video-content');
    const showTextBtn = document.getElementById('show-text-btn');
    const textContent = document.getElementById('text-content');
    const startQuizBtn = document.getElementById('start-quiz-btn');

    // Lógica para monitorar o vídeo (simplificada)
    // Uma implementação real requer a API do YouTube/Vimeo para precisão.
    // Esta é uma simulação baseada em tempo.
    setTimeout(() => {
        postVideoContent.style.display = 'block';
    }, 10000); // Mostra após 10 segundos para simular 80% do vídeo

    showTextBtn.addEventListener('click', () => {
        textContent.style.display = 'block';
    });

    startQuizBtn.addEventListener('click', () => {
        // Futura função que irá construir e iniciar o quiz
        renderQuiz(lesson);
    });
}

function renderQuiz(lesson) {
    const quizContent = document.getElementById('quiz-content');
    quizContent.style.display = 'block';
    quizContent.innerHTML = `
        <h3>Questão 1 (Treino)</h3>
        <p>${lesson.q1_text}</p>
        <div id="timer">Tempo: ${lesson.q1_time}s</div>
        <div class="options-container">
            ${lesson.q1_options.map(option => `<button class="option-btn">${option}</button>`).join('')}
        </div>
        <p>Funcionalidade completa do quiz (timer, respostas, etc.) a ser implementada.</p>
    `;
}


function initializeApp() {
    if (token) {
        // Usuário está logado
        fetchSubjects();
        showView('subjects-view');
        // Atualizar o header
        const userArea = document.getElementById('user-area');
        userArea.innerHTML = `
            <span>Olá, ${localStorage.getItem('username')}!</span>
            <button id="logout-button">Sair</button>
        `;
        document.getElementById('logout-button').addEventListener('click', () => {
            token = null;
            localStorage.clear();
            window.location.reload(); // Recarrega a página
        });

    } else {
        // Usuário não está logado
        showView('login-view');
    }
}

// Inicia o aplicativo quando a página carrega
initializeApp();