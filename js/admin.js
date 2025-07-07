// js/admin.js
import { initializeUpdateModal } from './components/update-modal.js';
import { initializePageLoader } from './pages/admin/page-loader.js';
import { allStudents, currentFilter } from './pages/admin/state.js';
import { setStudentDetailModal, setDeleteConfirmationModal } from './pages/admin/state.js';
import { setupEventListeners } from './pages/admin/event-handlers.js';
import { renderFilterCards } from './pages/admin/filter-cards.js';
import { applyFilters } from './pages/admin/filters.js';
import { hideLoading, showToast, convertTo12HourFormat } from './pages/admin/helpers.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchCenters } from './services/center-service.js';
import { initializePdfPrinter } from './features/pdf-printer.js';
import { GRADE_NAMES } from './pages/admin/constants.js';

initializePageLoader();

async function populateFilterDropdowns() {
    try {
        const [materials, allTeachers, centers] = await Promise.all([
            fetchMaterials(),
            fetchTeachers(), // This now fetches ALL teachers (active and inactive)
            fetchCenters()
        ]);

        const materialFilter = document.getElementById('materialFilter');
        const teacherFilter = document.getElementById('teacherFilter');
        const centerFilter = document.getElementById('centerFilter');

        materialFilter.innerHTML = '<option value="all">كل المواد</option>';
        materials.forEach(m => materialFilter.innerHTML += `<option value="${m.id}">${m.name}</option>`);
        
        centerFilter.innerHTML = '<option value="all">كل المراكز</option>';
        centers.forEach(c => centerFilter.innerHTML += `<option value="${c.id}">${c.name}</option>`);

        // FIXED: Separate active and inactive teachers for better UX
        teacherFilter.innerHTML = '<option value="all">كل المدرسين</option>';
        const activeTeachers = allTeachers.filter(t => t.is_active);
        const inactiveTeachers = allTeachers.filter(t => !t.is_active);

        activeTeachers.forEach(t => {
            teacherFilter.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });

        if (inactiveTeachers.length > 0) {
            teacherFilter.innerHTML += `<optgroup label="مدرسين محذوفين">`;
            inactiveTeachers.forEach(t => {
                teacherFilter.innerHTML += `<option value="${t.id}" class="text-danger">${t.name} (محذوف)</option>`;
            });
            teacherFilter.innerHTML += `</optgroup>`;
        }

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
        
        initializePdfPrinter(
            allStudents,
            currentFilter,
            GRADE_NAMES,
            convertTo12HourFormat
        );

    } catch (error) {
        console.error('Error initializing admin page:', error);
        showToast('فشل في تحميل بيانات الطلاب.', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="11" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    } finally {
        hideLoading();
    }
});