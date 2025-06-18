// =================================================================================
// ARQUIVO admin.js (VERSÃO FINAL COMPLETA E ESTÁVEL)
// =================================================================================

const API_URL = 'https://sapiens-backend-ogz2.onrender.com';

function setupEventListeners() {
    document.getElementById('add-subject-form')?.addEventListener('submit', handleAddSubject);
    document.getElementById('add-lesson-form')?.addEventListener('submit', handleAddLesson);
    document.getElementById('add-reinforcement-form')?.addEventListener('submit', handleAddReinforcement);
    document.body.addEventListener('click', e => { if (e.target?.classList.contains('delete-btn')) deleteItem(e.target.dataset.type, e.target.dataset.id); });
}

function initializeAdminPanel() {
    setupEventListeners();
    populateSubjects();
    populateAllLessonsSelect();
    loadManageableSubjects();
    loadManageableLessons();
    loadManageableUsers();
    renderRfQuestionFields(5);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('password-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const input = document.getElementById('admin-password');
            if (input.value === 'augensapien') {
                document.getElementById('password-overlay').style.display = 'none';
                document.getElementById('admin-content').style.display = 'block';
                initializeAdminPanel();
            } else {
                alert('Senha incorreta!');
            }
        });
    }
});

async function handleAddSubject(e) { e.preventDefault(); const name = document.getElementById('subject-name').value; const color_hex = document.getElementById('subject-color').value; const is_extra = document.getElementById('subject-is-extra').checked; try { const res = await fetch(`${API_URL}/api/admin/subject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, color_hex, is_extra }) }); const data = await res.json(); if (!res.ok) throw new Error(data.message); alert(`Matéria "${data.name}" criada.`); document.getElementById('add-subject-form').reset(); initializeAdminPanel(); } catch (error) { alert(`Erro: ${error.message}`); } }
async function handleAddLesson(e) { e.preventDefault(); try { const lessonData = { subject_id: document.getElementById('select-subject').value, title: document.getElementById('lesson-title').value, lesson_order: document.getElementById('lesson-order').value, video_url: document.getElementById('video-url').value, image_url: document.getElementById('image-url').value, audio_url: document.getElementById('audio-url').value, lesson_text: document.getElementById('lesson-text').value, q1_time: document.getElementById('q1-time').value, q1_text: document.getElementById('q1-text').value, q1_options: Array.from(document.querySelectorAll('.q1-option')).map(i => i.value), q2_time: document.getElementById('q2-time').value, q2_variants: [{ text: document.querySelectorAll('.q2-text')[0].value, options: Array.from(document.querySelectorAll('.q2-option-a')).map(i => i.value) }, { text: document.querySelectorAll('.q2-text')[1].value, options: Array.from(document.querySelectorAll('.q2-option-b')).map(i => i.value) }, { text: document.querySelectorAll('.q2-text')[2].value, options: Array.from(document.querySelectorAll('.q2-option-c')).map(i => i.value) }] }; const res = await fetch(`${API_URL}/api/admin/lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lessonData) }); const data = await res.json(); if (!res.ok) throw new Error(data.message); alert(`Lição "${data.title}" adicionada.`); document.getElementById('add-lesson-form').reset(); initializeAdminPanel(); } catch (error) { alert(`Erro: ${error.message}`); } }
async function handleAddReinforcement(e) { e.preventDefault(); try { const questions = []; document.querySelectorAll('.rf-question-block').forEach(block => { questions.push({ text: block.querySelector('.rf-q-text').value, options: Array.from(block.querySelectorAll('.rf-q-option')).map(i => i.value), time: block.querySelector('.rf-q-time').value, }); }); const rfData = { title: document.getElementById('rf-title').value, trigger_lesson_id: document.getElementById('select-trigger-lesson').value, content: { video_url: document.getElementById('rf-video-url').value, image_url: document.getElementById('rf-image-url').value, audio_url: document.getElementById('rf-audio-url').value, text: document.getElementById('rf-text').value, questions: questions } }; const res = await fetch(`${API_URL}/api/admin/reinforcement-lesson`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rfData) }); const data = await res.json(); if (!res.ok) throw new Error(data.message); alert('Lição de reforço criada.'); document.getElementById('add-reinforcement-form').reset(); } catch (error) { alert(`Erro: ${error.message}`); } }

async function populateSubjects() { const select = document.getElementById('select-subject'); if(!select) return; try { const res = await fetch(`${API_URL}/api/content/subjects`); const data = await res.json(); if (!res.ok) throw new Error("Erro API"); const allSubjects = [...data.main, ...data.extra]; select.innerHTML=''; if(allSubjects.length === 0) { select.innerHTML = '<option value="">Cadastre matéria</option>'; return; } allSubjects.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.name}</option>`}); } catch(e) { select.innerHTML = '<option>Erro</option>'; } }
async function loadManageableSubjects() { const list = document.getElementById('manage-subjects-list'); if(!list) return; try { const res = await fetch(`${API_URL}/api/content/subjects`); const data = await res.json(); if (!res.ok) throw new Error("Erro API"); const allSubjects = [...data.main, ...data.extra].sort((a,b) => a.name.localeCompare(b.name)); list.innerHTML=''; if(allSubjects.length === 0) { list.innerHTML = '<p>Nenhuma matéria.</p>'; return; } allSubjects.forEach(s => { list.innerHTML += `<div class="manage-item"><span>${s.name} ${s.is_extra?'(Extra)':''}</span><button class="delete-btn" data-id="${s.id}" data-type="subject">Excluir</button></div>`}); } catch(e) { list.innerHTML = 'Erro ao carregar'; } }
async function loadManageableLessons() { const list = document.getElementById('manage-lessons-list'); if(!list) return; try { const res = await fetch(`${API_URL}/api/content/subjects`); const data = await res.json(); if (!res.ok) throw new Error("Erro API"); const allSubjects = [...data.main, ...data.extra]; list.innerHTML=''; let hasLessons = false; for(const subject of allSubjects) { const lessonsRes = await fetch(`${API_URL}/api/content/lessons/${subject.id}`); const lessons = await lessonsRes.json(); if(lessons.length > 0) hasLessons = true; lessons.forEach(l => { list.innerHTML += `<div class="manage-item"><span><strong>${subject.name}:</strong> ${l.title}</span><button class="delete-btn" data-id="${l.id}" data-type="lesson">Excluir</button></div>`}); } if (!hasLessons) list.innerHTML = '<p>Nenhuma lição.</p>'; } catch(e) { list.innerHTML = 'Erro ao carregar'; } }
async function loadManageableUsers() { const list = document.getElementById('manage-users-list'); if(!list) return; try { const res = await fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); const users = await res.json(); if (!res.ok) throw new Error("Erro API"); list.innerHTML = ''; if(users.length === 0) { list.innerHTML = '<p>Nenhum usuário.</p>'; return; } users.forEach(u => { list.innerHTML += `<div class="manage-item"><span>${u.username}</span><button class="delete-btn" data-id="${u.id}" data-type="user">Excluir</button></div>`}); } catch(e) { list.innerHTML = 'Erro ao carregar'; } }
async function deleteItem(type, id) { if (!confirm(`TEM CERTEZA?`)) return; try { const res = await fetch(`${API_URL}/api/admin/${type}/${id}`, { method: 'DELETE' }); const data = await res.json(); if (!res.ok) throw new Error(data.message); alert(data.message); initializeAdminPanel(); } catch (error) { alert(`Erro: ${error.message}`); } }
async function populateAllLessonsSelect() { const select = document.getElementById('select-trigger-lesson'); if(!select) return; try { const res = await fetch(`${API_URL}/api/content/subjects`); const data = await res.json(); if (!res.ok) throw new Error('Falha ao buscar matérias'); const allSubjects = [...data.main, ...data.extra]; select.innerHTML = ''; for (const subject of allSubjects) { const optgroup = document.createElement('optgroup'); optgroup.label = subject.name; const lessonsRes = await fetch(`${API_URL}/api/content/lessons/${subject.id}`); const lessons = await lessonsRes.json(); lessons.forEach(l => { optgroup.innerHTML += `<option value="${l.id}">${l.title}</option>`; }); select.appendChild(optgroup); } } catch (e) { console.error(e); } }
function renderRfQuestionFields(count) { const container = document.getElementById('rf-questions-container'); if (!container) return; container.innerHTML = '<legend>Questões de Treino</legend>'; for (let i = 1; i <= count; i++) { container.innerHTML += `<div class="rf-question-block" style="border:1px solid #ccc;padding:10px;margin-bottom:10px;"><h4>Questão ${i}</h4><label>Texto</label><textarea class="rf-q-text"></textarea><label>Tempo(s)</label><input type="number" class="rf-q-time" value="60"><label>5 Alternativas (1ª é a correta)</label><input type="text" class="rf-q-option" placeholder="Correta"><input type="text" class="rf-q-option" placeholder="Alt 2"><input type="text" class="rf-q-option" placeholder="Alt 3"><input type="text" class="rf-q-option" placeholder="Alt 4"><input type="text" class="rf-q-option" placeholder="Alt 5"></div>`; } }