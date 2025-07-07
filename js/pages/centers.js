// js/pages/centers.js
import { supabase } from '../supabase-client.js';

// --- DOM Elements ---
const form = document.getElementById('center-form');
const formTitle = document.getElementById('form-title');
const centerIdInput = document.getElementById('center-id');
const centerNameInput = document.getElementById('center-name');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const centersList = document.getElementById('centers-list');
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

let centerToDeleteId = null;

// --- Service for Center Operations ---
const centerService = {
    async getAll() {
        const { data, error } = await supabase.from('centers').select('*').eq('is_active', true).order('name');
        if (error) throw error;
        return data;
    },
    async create(name) {
        const { error } = await supabase.from('centers').insert([{ name }]);
        if (error) throw error;
    },
    async update(id, name) {
        const { error } = await supabase.from('centers').update({ name }).eq('id', id);
        if (error) throw error;
    },
    async safeDelete(id) {
        const { error } = await supabase.rpc('delete_center_and_reassign', { center_id_to_delete: id });
        if (error) throw error;
    }
};

// --- UI Functions ---
function renderCenters(centers) {
    if (centers.length === 0) {
        centersList.innerHTML = '<p class="text-center text-gray-500">لا توجد مراكز مضافة حالياً.</p>';
        return;
    }
    centersList.innerHTML = centers.map(center => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
            <span class="font-semibold">${center.name}</span>
            ${center.name !== 'عام' ? `
            <div class="space-x-2 space-x-reverse">
                <button data-id="${center.id}" data-name="${center.name}" class="edit-btn text-blue-500 hover:text-blue-700"><i class="fas fa-edit"></i></button>
                <button data-id="${center.id}" class="delete-btn text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

function resetForm() {
    form.reset();
    centerIdInput.value = '';
    formTitle.textContent = 'إضافة مركز جديد';
    saveBtn.innerHTML = '<i class="fas fa-plus"></i> إضافة';
    cancelBtn.classList.add('hidden');
}

// --- Main Logic ---
async function loadCenters() {
    try {
        const centers = await centerService.getAll();
        renderCenters(centers);
    } catch (error) {
        console.error('Error loading centers:', error);
        centersList.innerHTML = '<p class="text-center text-red-500">فشل في تحميل البيانات.</p>';
    }
}

// --- Event Listeners ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = centerIdInput.value;
    const name = centerNameInput.value.trim();
    if (!name) return;

    saveBtn.disabled = true;
    try {
        if (id) {
            await centerService.update(id, name);
        } else {
            await centerService.create(name);
        }
        resetForm();
        await loadCenters();
    } catch (error) {
        alert('حدث خطأ: ' + (error.message.includes('duplicate key') ? 'هذا الاسم موجود بالفعل.' : error.message));
    } finally {
        saveBtn.disabled = false;
    }
});

centersList.addEventListener('click', (e) => {
    const editButton = e.target.closest('.edit-btn');
    if (editButton) {
        centerIdInput.value = editButton.dataset.id;
        centerNameInput.value = editButton.dataset.name;
        formTitle.textContent = 'تعديل المركز';
        saveBtn.innerHTML = 'حفظ التعديلات';
        cancelBtn.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const deleteButton = e.target.closest('.delete-btn');
    if (deleteButton) {
        centerToDeleteId = deleteButton.dataset.id;
        deleteModal.classList.remove('hidden');
    }
});

cancelBtn.addEventListener('click', resetForm);

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    centerToDeleteId = null;
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!centerToDeleteId) return;
    confirmDeleteBtn.disabled = true;
    try {
        await centerService.safeDelete(centerToDeleteId);
        await loadCenters();
    } catch (error) {
        alert('فشل الحذف: ' + error.message);
    } finally {
        deleteModal.classList.add('hidden');
        centerToDeleteId = null;
        confirmDeleteBtn.disabled = false;
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', loadCenters);
