// js/pages/admin/filters.js
import { STUDENTS_PER_PAGE } from './constants.js';
import { currentFilter, currentPage, setAllStudents } from './state.js';
import { renderTable, renderPagination } from './table-renderer.js';
import { showLoading, hideLoading, showToast } from './helpers.js';
import { fetchFilteredStudents } from './supabase-client.js'; // <-- IMPORTANT: Use the new function
import { renderFilterCards } from './filter-cards.js'; // <-- We need this now

export async function applyFilters() {
    showLoading();
    
    try {
        // ONE API call to get everything
        const result = await fetchFilteredStudents(currentPage, STUDENTS_PER_PAGE, currentFilter);
        
        const students = result.page_data;
        const totalCount = result.total_count;
        const gradeCounts = result.grade_counts;

        setAllStudents(students); // Update state with current page's students
        
        document.getElementById('total-students-count').textContent = totalCount;
        
        renderTable(students);
        renderPagination(totalCount);
        renderFilterCards(gradeCounts); // <-- Pass the counts directly

    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('حدث خطأ أثناء تحديث البيانات', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="12" class="p-8 text-center text-red-500">حدث خطأ أثناء تحميل البيانات</td></tr>`;
    } finally {
        hideLoading();
    }
}