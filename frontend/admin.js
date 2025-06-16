const API_URL = 'https://sapiens-frontend-3g1w.onrender.com';

const addSubjectForm = document.getElementById('add-subject-form');

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
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        alert(`Matéria "${data.name}" criada com sucesso!`);
        addSubjectForm.reset();

    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

// Lógica para popular o seletor de matérias no form de lições
async function populateSubjects() {
    // ...
}

populateSubjects();