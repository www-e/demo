// js/admin.js
import { initializeUpdateModal } from './components/update-modal.js';
import { initializePageLoader } from './pages/admin/page-loader.js';
import { supabase, getGradeCounts } from './pages/admin/supabase-client.js';
import { fetchTeachers } from './services/teacher-service.js';
import { allStudents, currentFilter, setAllStudents, setStudentDetailModal, setDeleteConfirmationModal } from './pages/admin/state.js';
import { setupEventListeners } from './pages/admin/event-handlers.js';
import { renderFilterCards } from './pages/admin/filter-cards.js';
import { applyFilters } from './pages/admin/filters.js';
import { hideLoading, showToast, convertTo12HourFormat } from './pages/admin/helpers.js';

// Import the PDF printer feature
import { initializePdfPrinter } from './features/pdf-printer.js'; 

// Define constants needed by the PDF printer
const GRADE_NAMES = {
    'first': 'الصف الأول',
    'second': 'الصف الثاني',
    'third': 'الصف الثالث'
};

// Initialize page loader
initializePageLoader();

// Load teachers and populate filter
async function loadTeachers() {
    try {
        const teachers = await fetchTeachers();
        const teacherFilterSelect = document.getElementById('teacherFilter');
        if (teacherFilterSelect) {
            teacherFilterSelect.innerHTML = '<option value="all">كل المدرسين</option>';
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = teacher.name;
                teacherFilterSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

// Main Execution
document.addEventListener('DOMContentLoaded', async () => {
    initializeUpdateModal();
    setStudentDetailModal(new bootstrap.Modal(document.getElementById('studentDetailModal')));
    setDeleteConfirmationModal(new bootstrap.Modal(document.getElementById('deleteConfirmationModal')));

    try {
        // Load initial data more efficiently
        const { data, error } = await supabase
            .from('registrations_2025_2026')
            .select(`
                *,
                teacher:teachers(id, name)
            `) // Include teacher information
            .order('created_at', { ascending: false })
            .limit(100); // Load first 100 for dropdown options
            
        if (error) throw error;
        setAllStudents(data);
        
        await initializeDashboard();
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showToast('فشل في تحميل البيانات. تأكد من الاتصال بالانترنت.', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="9" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    } finally {
        hideLoading();
    }
});

// Enhanced Dashboard Initialization
async function initializeDashboard() {
    await Promise.all([
        loadTeachers(), // Load teachers
        renderFilterCards(),
        applyFilters()
    ]);
    setupEventListeners();

    // Initialize the PDF printer after the rest of the dashboard is ready
    initializePdfPrinter(
        allStudents,            // Pass the student data from state
        currentFilter,          // Pass the filter object from state
        GRADE_NAMES,            // Pass the defined grade names constant
        convertTo12HourFormat   // Pass the helper function for time
    );
}