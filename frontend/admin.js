// --- INÍCIO DA LÓGICA DE SENHA ---
document.addEventListener('DOMContentLoaded', () => {
    const passwordForm = document.getElementById('password-form');
    const passwordOverlay = document.getElementById('password-overlay');
    const adminContent = document.getElementById('admin-content');

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('admin-password');
        
        // A senha secreta
        if (passwordInput.value === 'augensapien') {
            passwordOverlay.style.display = 'none'; // Esconde a tela de senha
            adminContent.style.display = 'block';   // Mostra o conteúdo do admin
        } else {
            alert('Senha incorreta!');
            passwordInput.value = '';
        }
    });
});
// --- FIM DA LÓGICA DE SENHA ---


// O resto do seu código admin.js continua aqui
const API_URL = 'https://sapiens-backend-ogz2.onrender.com'; // VERIFIQUE SE ESTA URL ESTÁ CORRETA!

// Elementos do formulário
const addSubjectForm = document.getElementById('add-subject-form');
const addLessonForm = document.getElementById('add-lesson-form');
const selectSubject = document.getElementById('select-subject');

// ... (todo o resto do seu código de admin.js, sem alterações)
// --- Lógica para Matérias ---
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

        // Verificação de resposta vazia
        const responseText = await response.text();
        if (!response.ok) {
             try { const errorData = JSON.parse(responseText); throw new Error(errorData.message); }
             catch(e) { throw new Error(responseText || 'Erro desconhecido do servidor.'); }
        }
        
        const data = JSON.parse(responseText);
        alert(`Matéria "${data.name}" criada com sucesso!`);
        addSubjectForm.reset();
        populateSubjects(); // Atualiza a lista de matérias no outro formulário

    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

// --- Lógica para Lições ---
addLessonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Coletar dados da Questão 1
    const q1_options = Array.from(document.querySelectorAll('.q1-option')).map(input => input.value);
    // Coletar dados da Questão 2
    const q2_texts = Array.from(document.querySelectorAll('.q2-text')).map(textarea => textarea.value);
    const q2_options_a = Array.from(document.querySelectorAll('.q2-option-a')).map(input => input.value);
    const q2_options_b = Array.from(document.querySelectorAll('.q2-option-b')).map(input => input.value);
    const q2_options_c = Array.from(document.querySelectorAll('.q2-option-c')).map(input => input.value);
    const q2_variants = [
        { text: q2_texts[0], options: q2_options_a },
        { text: q2_texts[1], options: q2_options_b },
        { text: q2_texts[2], options: q2_options_c },
    ];
    // Montar o objeto completo da lição
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
        q1_options: q1_options,
        q2_time: document.getElementById('q2-time').value,
        q2_variants: q2_variants
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

    } catch (error) {
        alert(`Erro ao adicionar lição: ${error.message}`);
    }
});

// Função para buscar as matérias e popular o <select>
async function populateSubjects() {
    try {
        const response = await fetch(`${API_URL}/api/content/subjects`);
        const subjects = await response.json();
        
        selectSubject.innerHTML = '<option value="" disabled selected>Carregando...</option>';
        if (subjects.length === 0) {
             selectSubject.innerHTML = '<option value="">Nenhuma matéria cadastrada ainda</option>';
             return;
        }

        selectSubject.innerHTML = ''; // Limpa o select
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

// Inicia a página populando as matérias
populateSubjects();