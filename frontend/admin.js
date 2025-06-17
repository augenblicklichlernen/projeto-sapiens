// =================================================================================
// ARQUIVO admin.js COMPLETO (Versão FINAL com Reforço)
// =================================================================================

// --- LÓGICA DE SENHA ---
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
                initializeAdminPanel();
            } else {
                alert('Senha incorreta!');
            }
        });
    }
});

// --- CONFIGURAÇÃO E ELEMENTOS GLOBAIS ---
const API_URL = 'https://sapiens-backend-ogz2.onrender.com';
const addSubjectForm = document.getElementById('add-subject-form');
const addLessonForm = document.getElementById('add-lesson-form');
const addRfForm = document.getElementById('add-reinforcement-form');
const selectSubject = document.getElementById('select-subject');
const selectTriggerLesson = document.getElementById('select-trigger-lesson');
const manageSubjectsList = document.getElementById('manage-subjects-list');
const manageLessonsList = document.getElementById('manage-lessons-list');
const manageUsersList = document.getElementById('manage-users-list');

// --- FUNÇÃO DE INICIALIZAÇÃO DO PAINEL ---
function initializeAdminPanel() {
    populateSubjects();
    populateAllLessonsSelect();
    loadManageableSubjects();
    loadManageableLessons();
    loadManageableUsers();
    renderRfQuestionFields(5);
}

// --- ADIÇÃO DE CONTEÚDO ---
addSubjectForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('subject-name').value;
    const color_hex = document.getElementById('subject-color').value;
    try {
        const res = await fetch(`${API_URL}/api/admin/subject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color_hex }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert(`Matéria "${data.name}" criada com sucesso!`);
        addSubjectForm.reset();
        initializeAdminPanel();
    } catch (error) { alert(`Erro: ${error.message}`); }
});

addLessonForm?.addEventListener('submit', async (e) => {
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
            q1_options: Array.from(document.querySelectorAll('.q1-option')).map(i => i.value),
            q2_time: document.getElementById('q2-time').value,
            q2_variants: [
                { text: document.querySelectorAll('.q2-text')[0].value, options: Array.from(document.querySelectorAll('.q2-option-a')).map(i => i.value) },
                { text: document.querySelectorAll('.q2-text')[1].value, options: Array.from(document.querySelectorAll('.q2-option-b')).map(i => i.value) },
                { text: document.querySelectorAll('.q2-text')[2].value, options: Array.from(document.querySelectorAll('.q2-option-c')).map(i => i.value) }
            ]
        };
        const res = await fetch(`${API_URL}/api/admin/lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lessonData) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert(`Lição "${data.title}" adicionada com sucesso!`);
        addLessonForm.reset();
        initializeAdminPanel();
    } catch (error) { alert(`Erro ao adicionar lição: ${error.message}`); }
});

addRfForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const questions = [];
        document.querySelectorAll('.rf-question-block').forEach(block => {
            questions.push({
                text: block.querySelector('.rf-q-text').value,
                options: Array.from(block.querySelectorAll('.rf-q-option')).map(i => i.value),
                time: block.querySelector('.rf-q-time').value,
            });
        });
        const rfData = {
            title: document.getElementById('rf-title').value,
            trigger_lesson_id: document.getElementById('select-trigger-lesson').value,
            content: {
                video_url: document.getElementById('rf-video-url').value,
                image_url: document.getElementById('rf-image-url').value,
                audio_url: document.getElementById('rf-audio-url').value,
                text: document.getElementById('rf-text').value,
                questions: questions
            }
        };
        const res = await fetch(`${API_URL}/api/admin/reinforcement-lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rfData) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert('Lição de reforço criada com sucesso!');
        addRfForm.reset();
    } catch (error) { alert(`Erro: ${error.message}`); }
});


// --- CARREGAMENTO DE DADOS E GERENCIAMENTO (EXCLUSÃO) ---
async function populateSubjects() { /* ...código de populateSubjects como antes... */ }
async function loadManageableSubjects() { /* ...código de loadManageableSubjects como antes... */ }
async function loadManageableLessons() { /* ...código de loadManageableLessons como antes... */ }
async function loadManageableUsers() { /* ...código de loadManageableUsers como antes... */ }
async function deleteItem(type, id) { /* ...código de deleteItem como antes... */ }
document.body.addEventListener('click', e => { if (e.target?.classList.contains('delete-btn')) deleteItem(e.target.dataset.type, e.target.dataset.id); });

// --- FUNÇÕES ESPECÍFICAS DO PAINEL DE REFORÇO ---
async function populateAllLessonsSelect() {
    if (!selectTriggerLesson) return;
    try {
        const subjectsRes = await fetch(`${API_URL}/api/content/subjects`);
        const subjects = await subjectsRes.json();
//correção adicionada
        if (!Array.isArray(subjects)) {
            console.error("A resposta de /subjects não é um array:", subjects);
            return;
        }

//fim da correção
        selectTriggerLesson.innerHTML = '';
        for (const subject of subjects) {
            const lessonsRes = await fetch(`${API_URL}/api/content/lessons/${subject.id}`);
            const lessons = await lessonsRes.json();
            if (lessons.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = subject.name;
                lessons.forEach(lesson => {
                    optgroup.innerHTML += `<option value="${lesson.id}">${lesson.title}</option>`;
                });
                selectTriggerLesson.appendChild(optgroup);
            }
        }
    } catch (error) { console.error(error); }
}

function renderRfQuestionFields(count) {
    const container = document.getElementById('rf-questions-container');
    if (!container) return;
    container.innerHTML = '<legend>Questões de Treino</legend>';
    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="rf-question-block" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
                <h4>Questão ${i}</h4>
                <label>Texto da Questão</label><textarea class="rf-q-text"></textarea>
                <label>Tempo (s)</label><input type="number" class="rf-q-time" value="60">
                <label>5 Alternativas (a 1ª é a correta)</label>
                <input type="text" class="rf-q-option" placeholder="Alternativa Correta">
                <input type="text" class="rf-q-option" placeholder="Alternativa 2">
                <input type="text" class="rf-q-option" placeholder="Alternativa 3">
                <input type="text" class="rf-q-option" placeholder="Alternativa 4">
                <input type="text" class="rf-q-option" placeholder="Alternativa 5">
            </div>`;
    }
}
// As funções que estavam como placeholder antes
async function populateSubjects() { if (!selectSubject) return; try { const res=await fetch(`${API_URL}/api/content/subjects`); const subjects=await res.json(); selectSubject.innerHTML=''; if(subjects.length===0){selectSubject.innerHTML='<option value="">Cadastre uma matéria primeiro</option>';return} subjects.forEach(subject=>{selectSubject.innerHTML+=`<option value="${subject.id}">${subject.name}</option>`})}catch(e){selectSubject.innerHTML='<option value="">Erro ao carregar</option>'}}
async function loadManageableSubjects() { if (!manageSubjectsList) return; try { const res=await fetch(`${API_URL}/api/content/subjects`); const subjects=await res.json(); manageSubjectsList.innerHTML=''; if(subjects.length===0){manageSubjectsList.innerHTML='<p>Nenhuma matéria para gerenciar.</p>';return} subjects.forEach(subject=>{manageSubjectsList.innerHTML+=`<div class="manage-item"><span>${subject.name}</span> <button class="delete-btn" data-id="${subject.id}" data-type="subject">Excluir</button></div>`})}catch(e){manageSubjectsList.innerHTML='<p>Erro ao carregar matérias.</p>'}}
async function loadManageableLessons() { if(!manageLessonsList)return;try{const subjectsRes=await fetch(`${API_URL}/api/content/subjects`);const subjects=await subjectsRes.json();manageLessonsList.innerHTML='';if(subjects.length===0){manageLessonsList.innerHTML='<p>Nenhuma lição para gerenciar.</p>';return}let hasLessons=!1;for(const subject of subjects){const lessonsRes=await fetch(`${API_URL}/api/content/lessons/${subject.id}`);const lessons=await lessonsRes.json();if(lessons.length>0)hasLessons=!0;lessons.forEach(lesson=>{manageLessonsList.innerHTML+=`<div class="manage-item"><span><strong>${subject.name}:</strong> ${lesson.title}</span> <button class="delete-btn" data-id="${lesson.id}" data-type="lesson">Excluir</button></div>`})}if(!hasLessons){manageLessonsList.innerHTML='<p>Nenhuma lição para gerenciar.</p>'}}catch(e){manageLessonsList.innerHTML='<p>Erro ao carregar lições.</p>'}}
async function loadManageableUsers() { if (!manageUsersList) return; try { const res=await fetch(`${API_URL}/api/admin/users`); const users=await res.json(); manageUsersList.innerHTML=''; if(users.length===0){manageUsersList.innerHTML='<p>Nenhum usuário para gerenciar.</p>';return} users.forEach(user=>{manageUsersList.innerHTML+=`<div class="manage-item"><span>${user.username}</span> <button class="delete-btn" data-id="${user.id}" data-type="user">Excluir</button></div>`})}catch(e){manageUsersList.innerHTML='<p>Erro ao carregar usuários.</p>'}}
async function deleteItem(type,id){const c=confirm(`Você tem CERTEZA que quer excluir este(a) ${type}? A ação não pode ser desfeita.`);if(!c)return;try{const res=await fetch(`${API_URL}/api/admin/${type}/${id}`,{method:'DELETE'});const data=await res.json();if(!res.ok)throw new Error(data.message);alert(data.message);initializeAdminPanel()}catch(e){alert(`Erro ao excluir: ${e.message}`)}}