// js/admin.js
import { initializeUpdateModal } from './components/update-modal.js'; // FIXED PATH
import { initializePageLoader } from './pages/admin/page-loader.js';
import { getGradeCounts } from './pages/admin/supabase-client.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchCenters } from './services/center-service.js';
import { setStudentDetailModal, setDeleteConfirmationModal } from './pages/admin/state.js';
import { setupEventListeners } from './pages/admin/event-handlers.js';
import { renderFilterCards } from './pages/admin/filter-cards.js';
import { applyFilters } from './pages/admin/filters.js';
import { hideLoading, showToast } from './pages/admin/helpers.js';

initializePageLoader();

async function populateFilterDropdowns() {
    try {
        const [materials, teachers, centers] = await Promise.all([
            fetchMaterials(),
            fetchTeachers(),
            fetchCenters()
        ]);

        const materialFilter = document.getElementById('materialFilter');
        const teacherFilter = document.getElementById('teacherFilter');
        const centerFilter = document.getElementById('centerFilter');

        materialFilter.innerHTML = '<option value="all">كل المواد</option>';
        materials.forEach(m => materialFilter.innerHTML += `<option value="${m.id}">${m.name}</option>`);

        teacherFilter.innerHTML = '<option value="all">كل المدرسين</option>';
        teachers.forEach(t => {
            if (t.is_active) teacherFilter.innerHTML += `<option value="${t.id}">${t.name}</option>`
        });
        
        centerFilter.innerHTML = '<option value="all">كل المراكز</option>';
        centers.forEach(c => centerFilter.innerHTML += `<option value="${c.id}">${c.name}</option>`);

    } catch (error) {
        console.error('Error loading filter dropdowns:', error);
        showToast('فشل في تحميل الفلاتر.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initializeUpdateModal();
    setStudentDetailModal(new bootstrap.Modal(document.getElementById('studentDetailModal')));
    setDeleteConfirmationModal(new bootstrap.Modal(document.getElementById('deleteConfirmationModal')));

    try {
        await populateFilterDropdowns();
        await renderFilterCards();
        await applyFilters();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing admin page:', error);
        showToast('فشل في تحميل بيانات الطلاب.', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="11" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    } finally {
        hideLoading();
    }
});