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

// Esta função será chamada quando o aluno clicar em "Iniciar"
function renderLessonContent(lessonId) {
    // Esta é a próxima grande funcionalidade a ser construída.
    // Aqui você buscaria os detalhes da lição (vídeo, texto, questões)
    // e montaria a interface de aprendizado completa que você descreveu.
    showView('lesson-view');
    lessonView.innerHTML = `
        <button class="back-btn" onclick="history.back()">← Voltar para a lista</button>
        <h2>Conteúdo da Lição (ID: ${lessonId})</h2>
        <p>A interface com vídeo, texto, áudio e questões será construída aqui.</p>
        <p><strong>Próximo passo:</strong> Fazer um fetch para <code>/api/content/lesson-detail/${lessonId}</code> (rota a ser criada no backend) e usar os dados para montar a página dinamicamente.</p>
    `;
}

// "Ouvinte" de eventos para os botões "Iniciar"
document.body.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('start-lesson-btn')) {
        const lessonId = e.target.dataset.lessonId;
        renderLessonContent(lessonId);
    }
});


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