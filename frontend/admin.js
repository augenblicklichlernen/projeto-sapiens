// =================================================================================
// ARQUIVO admin.js COMPLETO (Versão 3)
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

            if (passwordInput.value === 'augensapien') {
                passwordOverlay.style.display = 'none';
                adminContent.style.display = 'block';
                // Após o login, carrega os dados dinâmicos
                populateSubjects();
                loadManageableSubjects();
                loadManageableLessons();
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
            
            // ATUALIZA TODAS AS LISTAS RELEVANTES
            populateSubjects();
            loadManageableSubjects();

        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });
}

// --- Lógica para ADICIONAR Lições ---
if (addLessonForm) {
    addLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
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
                { text: document.querySelectorAll('.q2-text')[0].value, options: Array.from(document.querySelectorAll('.q2-option-a')).map(input => input.value) },
                { text: document.querySelectorAll('.q2-text')[1].value, options: Array.from(document.querySelectorAll('.q2-option-b')).map(input => input.value) },
                { text: document.querySelectorAll('.q2-text')[2].value, options: Array.from(document.querySelectorAll('.q2-option-c')).map(input => input.value) },
            ]
        };

        try {
            const response = await fetch(`${API_URL}/api/admin/lesson`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lessonData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            alert(`Lição "${data.title}" adicionada com sucesso!`);
            addLessonForm.reset();

            // ATUALIZA A LISTA DE LIÇÕES GERENCIÁVEIS
            loadManageableLessons();

        } catch (error) {
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
        
        selectSubject.innerHTML = ''; // Limpa o select
        if (subjects.length === 0) {
             selectSubject.innerHTML = '<option value="">Cadastre uma matéria primeiro</option>';
             return;
        }
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            selectSubject.appendChild(option);
        });
    } catch (error) {
        selectSubject.innerHTML = '<option value="">Erro ao carregar matérias</option>';
    }
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
            const item = document.createElement('div');
            item.className = 'manage-item';
            item.innerHTML = `<span>${subject.name}</span> <button class="delete-btn" data-id="${subject.id}" data-type="subject">Excluir</button>`;
            manageSubjectsList.appendChild(item);
        });
    } catch (error) {
        manageSubjectsList.innerHTML = '<p>Erro ao carregar matérias.</p>';
    }
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
                 const item = document.createElement('div');
                item.className = 'manage-item';
                item.innerHTML = `<span><strong>${subject.name}:</strong> ${lesson.title}</span> <button class="delete-btn" data-id="${lesson.id}" data-type="lesson">Excluir</button>`;
                manageLessonsList.appendChild(item);
            });
        }
        if (!hasLessons) {
             manageLessonsList.innerHTML = '<p>Nenhuma lição para gerenciar.</p>';
        }
    } catch (error) {
        manageLessonsList.innerHTML = '<p>Erro ao carregar lições.</p>';
    }
}

// Função genérica para DELETAR um item (matéria ou lição)
async function deleteItem(type, id) {
    const confirmation = confirm(`Você tem CERTEZA que quer excluir este(a) ${type}? A ação não pode ser desfeita.`);
    if (!confirmation) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/${type}/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        alert(data.message);
        loadManageableSubjects();
        loadManageableLessons();
        populateSubjects();
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


// Estilos para a nova área de gerenciamento
const style = document.createElement('style');
style.innerHTML = `
    .manage-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; }
    .delete-btn { background-color: #e53e3e; color: white; padding: 5px 10px; font-size: 0.8rem; }
`;
document.head.appendChild(style);