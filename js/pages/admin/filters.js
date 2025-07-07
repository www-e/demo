// js/pages/admin/filters.js
import { STUDENTS_PER_PAGE } from './constants.js';
import { allStudents, currentFilter, currentPage, setAllStudents } from './state.js';
import { renderTable, renderPagination } from './table-renderer.js';
import { updateGroupStudentCount } from './filter-cards.js';
import { convertTo12HourFormat, showLoading, hideLoading, showToast } from './helpers.js';
import { fetchStudents, getStudentsCount } from './supabase-client.js';

// Server-side filtering with loading states
export async function applyFilters() {
    showLoading();
    
    try {
        // Fetch paginated data from server
        const students = await fetchStudents(
            currentPage,
            STUDENTS_PER_PAGE,
            currentFilter.grade,
            currentFilter.group,
            currentFilter.teacher,
            currentFilter.material, // ADDED
            currentFilter.searchQuery
        );
        
        // Get total count for pagination
        const totalCount = await getStudentsCount(
            currentFilter.grade,
            currentFilter.group,
            currentFilter.teacher,
            currentFilter.material, // ADDED
            currentFilter.searchQuery
        );
        
        document.getElementById('total-students-count').textContent = totalCount;
        
        renderTable(students);
        renderPagination(totalCount);
        updateGroupStudentCount();
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('حدث خطأ أثناء تحديث البيانات', 'error');
        document.getElementById('students-table-body').innerHTML = 
            `<tr><td colspan="9" class="p-8 text-center text-red-500">حدث خطأ أثناء تحميل البيانات</td></tr>`;
    } finally {
        hideLoading();
    }
}

// Keep for backward compatibility with group filtering
export function updateGroupFilterDropdown() {
    const groupFilterSection = document.getElementById('secondary-filter-section');
    const groupSelect = document.getElementById('group-filter');
    
    if (currentFilter.grade === 'all') {
        groupFilterSection.classList.add('hidden');
        return;
    }
    
    // Filter current students for dropdown options
    const studentsInGrade = allStudents.filter(s => s.grade === currentFilter.grade);
    const uniqueGroupTimes = [...new Set(studentsInGrade.map(s => `${s.days_group}|${s.time_slot}`))];
    
    groupSelect.innerHTML = '<option value="all">كل المجموعات والمواعيد</option>';
    uniqueGroupTimes.forEach(combinedValue => {
        const [groupName, timeSlot] = combinedValue.split('|');
        const displayText = `${groupName} - ${convertTo12HourFormat(timeSlot)}`;
        groupSelect.innerHTML += `<option value="${combinedValue}">${displayText}</option>`;
    });
    
    currentFilter.group = 'all';
    groupSelect.value = 'all';
    groupFilterSection.classList.remove('hidden');
}