// js/pages/admin/filters.js
import { STUDENTS_PER_PAGE } from './constants.js';
import { currentFilter, currentPage, setAllStudents } from './state.js';
import { renderTable, renderPagination } from './table-renderer.js';
import { showLoading, hideLoading, showToast } from './helpers.js';
import { fetchStudents, getStudentsCount } from './supabase-client.js';

export async function applyFilters() {
    showLoading();
    
    try {
        // FIXED: Pass the entire filter object for cleaner code
        const students = await fetchStudents(currentPage, STUDENTS_PER_PAGE, currentFilter);
        setAllStudents(students); // Update state with current page's students
        
        // FIXED: Pass the entire filter object
        const totalCount = await getStudentsCount(currentFilter);
        
        document.getElementById('total-students-count').textContent = totalCount;
        
        renderTable(students);
        renderPagination(totalCount);
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('حدث خطأ أثناء تحديث البيانات', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="11" class="p-8 text-center text-red-500">حدث خطأ أثناء تحميل البيانات</td></tr>`;
    } finally {
        hideLoading();
    }
}