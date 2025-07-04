// js/admin.js
import { initializeUpdateModal } from './components/update-modal.js';
import { initializePageLoader } from './pages/admin/page-loader.js';
import { supabase, getGradeCounts } from './pages/admin/supabase-client.js';
import { setAllStudents, setStudentDetailModal, setDeleteConfirmationModal } from './pages/admin/state.js';
import { setupEventListeners } from './pages/admin/event-handlers.js';
import { renderFilterCards } from './pages/admin/filter-cards.js';
import { applyFilters } from './pages/admin/filters.js';
import { hideLoading, showToast } from './pages/admin/helpers.js';

// Initialize page loader
initializePageLoader();

// Main Execution
document.addEventListener('DOMContentLoaded', async () => {
    initializeUpdateModal();
    setStudentDetailModal(new bootstrap.Modal(document.getElementById('studentDetailModal')));
    setDeleteConfirmationModal(new bootstrap.Modal(document.getElementById('deleteConfirmationModal')));

    try {
        // NEW: Load initial data more efficiently
        const { data, error } = await supabase
            .from('registrations_2025_2026')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Load first 100 for dropdown options
            
        if (error) throw error;
        setAllStudents(data);
        
        await initializeDashboard();
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showToast('فشل في تحميل البيانات. تأكد من الاتصال بالانترنت.', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="8" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    } finally {
        hideLoading();
    }
});

// Enhanced Dashboard Initialization
async function initializeDashboard() {
    await renderFilterCards();
    await applyFilters();
    setupEventListeners();
}
