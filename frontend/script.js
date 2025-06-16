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

function loadLessons(subjectId) {
    // Aqui viria a lógica para carregar as lições da matéria clicada
    alert(`Carregando lições da matéria com ID: ${subjectId}`);
    // Você faria um fetch para /api/content/lessons/:subjectId
    // e então construiria a visualização da lição
    showView('lesson-view');
    lessonView.innerHTML = `<h2>Lições aparecerão aqui</h2><p>Funcionalidade a ser implementada.</p>`;
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