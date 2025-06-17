// =================================================================================
// ARQUIVO admin.js COMPLETO (Versão 5 - Final com Gerenciamento de Usuários)
// =================================================================================

// --- INÍCIO DA LÓGICA DE SENHA ---
document.addEventListener('DOMContentLoaded', () => {
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const passwordInput = document.getElementById('admin-password');
            const passwordOverlay = document.getElementById('password-overlay');
            const adminContent = document.getElementById('admin-content');

            // A senha secreta
            if (passwordInput.value === 'augensapien') {
                passwordOverlay.style.display = 'none';
                adminContent.style.display = 'block';
                // Após o login, carrega todos os dados dinâmicos do painel
                initializeAdminPanel();
            } else {
                alert('Senha incorreta!');
                passwordInput.value = '';
            }
        });
    }
});
// --- FIM DA LÓGICA DE SENHA ---


// URL da sua API Backend. VERIFIQUE SE ESTÁ CORRETA!
const API_URL = 'https://sapiens-backend-ogz2.onrender.com';

// --- ELEMENTOS GLOBAIS DA PÁGINA ---
const addSubjectForm = document.getElementById('add-subject-form');
const addLessonForm = document.getElementById('add-lesson-form');
const selectSubject = document.getElementById('select-subject');
const manageSubjectsList = document.getElementById('manage-subjects-list');
const manageLessonsList = document.getElementById('manage-lessons-list');
const manageUsersList = document.getElementById('manage-users-list');


// =================================================================================
// FUNÇÕES DE ADIÇÃO DE CONTEÚDO
// =================================================================================

// --- Lógica para ADICIONAR Matérias ---
if (addSubjectForm) {
    addSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value;
        const color_hex = document.getElementById('subject-color').value;

        try {
            const response = await fetch(`${API_URL}/api/admin/subject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color_hex })
            });
            const responseText = await response.text();
            if (!response.ok) {
                 try { const errorData = JSON.parse(responseText); throw new Error(errorData.message); }
                 catch(e) { throw new Error(responseText || 'Erro desconhecido do servidor.'); }
            }
            const data = JSON.parse(responseText);
            alert(`Matéria "${data.name}" criada com sucesso!`);
            addSubjectForm.reset();
            populateSubjects();
            loadManageableSubjects();
        } catch (error) {
            alert(`Erro ao adicionar matéria: ${error.message}`);
        }
    });
}

// --- Lógica para ADICIONAR Lições ---
if (addLessonForm) {
    addLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const lessonData = {
                subject_id: document.getElementById('select-subject').value,
                title: document.getElementById('lesson-title').value,
                lesson_order: document.getElementById('lesson-order').value,
                video_url: document.getElementById('video-url').value,
                image_url: document.getElementById('image-url').value,
                audio_url: document.getElementById('audio-url').value,
                lesson_text: document.getElementById('lesson-text').value,
                q1_time: document.getElementById('q1-time').value,
                q1_text: document.getElementById('q1-text').value,
                q1_options: Array.from(document.querySelectorAll('.q1-option')).map(input => input.value),
                q2_time: document.getElementById('q2-time').value,
                q2_variants: [
                    { text: document.querySelectorAll('.q2-text')[0].value, options: Array.from(document.querySelectorAll('.q2-option-a')).map(i => i.value) },
                    { text: document.querySelectorAll('.q2-text')[1].value, options: Array.from(document.querySelectorAll('.q2-option-b')).map(i => i.value) },
                    { text: document.querySelectorAll('.q2-text')[2].value, options: Array.from(document.querySelectorAll('.q2-option-c')).map(i => i.value) }
                ]
            };
            const response = await fetch(`${API_URL}/api/admin/lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lessonData) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'O servidor retornou um erro.');
            alert(`Lição "${data.title}" adicionada com sucesso!`);
            addLessonForm.reset();
            loadManageableLessons();
        } catch (error) {
            console.error('Erro detalhado ao adicionar lição:', error);
            alert(`Erro ao adicionar lição: ${error.message}`);
        }
    });
}


// =================================================================================
// FUNÇÕES DE CARREGAMENTO E GERENCIAMENTO (EXCLUSÃO)
// =================================================================================

// Função para buscar as matérias e popular o <select> no formulário de lições
async function populateSubjects() {
    if (!selectSubject) return;
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`);
        const subjects = await response.json();
        selectSubject.innerHTML = '';
        if (subjects.length === 0) {
             selectSubject.innerHTML = '<option value="">Cadastre uma matéria primeiro</option>';
             return;
        }
        subjects.forEach(subject => {
            selectSubject.innerHTML += `<option value="${subject.id}">${subject.name}</option>`;
        });
    } catch (error) { selectSubject.innerHTML = '<option value="">Erro ao carregar</option>'; }
}

// Função para carregar as matérias na área de gerenciamento
async function loadManageableSubjects() {
    if (!manageSubjectsList) return;
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`);
        const subjects = await response.json();
        manageSubjectsList.innerHTML = '';
        if (subjects.length === 0) {
            manageSubjectsList.innerHTML = '<p>Nenhuma matéria para gerenciar.</p>';
            return;
        }
        subjects.forEach(subject => {
            manageSubjectsList.innerHTML += `<div class="manage-item"><span>${subject.name}</span> <button class="delete-btn" data-id="${subject.id}" data-type="subject">Excluir</button></div>`;
        });
    } catch (error) { manageSubjectsList.innerHTML = '<p>Erro ao carregar matérias.</p>'; }
}

// Função para carregar TODAS as lições na área de gerenciamento
async function loadManageableLessons() {
    if (!manageLessonsList) return;
    try {
        const subjectsResponse = await fetch(`${API_URL}/api/content/subjects`);
        const subjects = await subjectsResponse.json();
        manageLessonsList.innerHTML = '';
        if (subjects.length === 0) {
            manageLessonsList.innerHTML = '<p>Nenhuma lição para gerenciar.</p>';
            return;
        }
        let hasLessons = false;
        for (const subject of subjects) {
            const lessonsResponse = await fetch(`${API_URL}/api/content/lessons/${subject.id}`);
            const lessons = await lessonsResponse.json();
            if(lessons.length > 0) hasLessons = true;
            lessons.forEach(lesson => {
                 manageLessonsList.innerHTML += `<div class="manage-item"><span><strong>${subject.name}:</strong> ${lesson.title}</span> <button class="delete-btn" data-id="${lesson.id}" data-type="lesson">Excluir</button></div>`;
            });
        }
        if (!hasLessons) {
             manageLessonsList.innerHTML = '<p>Nenhuma lição para gerenciar.</p>';
        }
    } catch (error) { manageLessonsList.innerHTML = '<p>Erro ao carregar lições.</p>'; }
}

// Função para carregar os usuários na área de gerenciamento
async function loadManageableUsers() {
    if (!manageUsersList) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/users`);
        const users = await response.json();
        manageUsersList.innerHTML = '';
        if (users.length === 0) {
            manageUsersList.innerHTML = '<p>Nenhum usuário para gerenciar.</p>';
            return;
        }
        users.forEach(user => {
            manageUsersList.innerHTML += `<div class="manage-item"><span>${user.username}</span> <button class="delete-btn" data-id="${user.id}" data-type="user">Excluir</button></div>`;
        });
    } catch (error) { manageUsersList.innerHTML = '<p>Erro ao carregar usuários.</p>'; }
}


// Função genérica para DELETAR um item (matéria, lição ou usuário)
async function deleteItem(type, id) {
    const confirmation = confirm(`Você tem CERTEZA que quer excluir este(a) ${type}? A ação não pode ser desfeita.`);
    if (!confirmation) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/${type}/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        alert(data.message);
        initializeAdminPanel(); // Recarrega todas as listas
    } catch (error) {
        alert(`Erro ao excluir: ${error.message}`);
    }
}

// "Ouvinte" de eventos para os cliques nos botões de exclusão
document.body.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        deleteItem(type, id);
    }
});


// Estilos para a nova área de gerenciamento (adicionados via JS para simplicidade)
const style = document.createElement('style');
style.innerHTML = `
    .manage-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; }
    .delete-btn { background-color: #e53e3e; color: white; padding: 5px 10px; font-size: 0.8rem; }
`;
document.head.appendChild(style);

// =================================================================================
// FUNÇÃO DE INICIALIZAÇÃO DO PAINEL
// =================================================================================
// Esta função é chamada uma vez, após a senha ser inserida corretamente.
function initializeAdminPanel() {
    populateSubjects();
    loadManageableSubjects();
    loadManageableLessons();
    loadManageableUsers(); // A nova função é chamada aqui.
}