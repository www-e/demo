// js/pages/admin/event-handlers.js
import { currentFilter, currentPage, allStudents, studentDetailModal, setCurrentFilter, setCurrentPage } from './state.js';
import { applyFilters, updateGroupFilterDropdown } from './filters.js';
import { renderModalContent } from './modal-manager.js';
import { handleDeleteStudent } from './crud-operations.js';
import { debounce } from './helpers.js';

export function setupEventListeners() {
    // Grade filter cards
    document.getElementById('stats-section').addEventListener('click', e => {
        const card = e.target.closest('.filter-card');
        if (!card) return;
        
        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        setCurrentFilter({ grade: card.dataset.grade });
        setCurrentPage(1);
        updateGroupFilterDropdown();
        applyFilters();
    });

    // Group filter dropdown
    document.getElementById('group-filter').addEventListener('change', e => {
        setCurrentFilter({ group: e.target.value });
        setCurrentPage(1);
        applyFilters();
    });

    // NEW: Debounced search input (300ms delay)
    const debouncedSearch = debounce((searchQuery) => {
        setCurrentFilter({ searchQuery });
        setCurrentPage(1);
        applyFilters();
    }, 300);

    document.getElementById('search-input').addEventListener('input', e => {
        debouncedSearch(e.target.value);
    });

    // Table interactions
    document.getElementById('students-table-body').addEventListener('click', e => {
        const deleteButton = e.target.closest('.btn-action.delete');
        if (deleteButton) {
            e.stopPropagation();
            const studentId = deleteButton.dataset.id;
            const studentName = deleteButton.dataset.name;
            handleDeleteStudent(studentId, studentName);
            return;
        }

        const studentRow = e.target.closest('tr[data-id]');
        if (studentRow) {
            const studentId = studentRow.dataset.id;
            const student = allStudents.find(s => s.id === studentId);
            if (student) {
                renderModalContent(student);
                studentDetailModal.show();
            }
        }
    });
    
    // Pagination with smooth scrolling
    document.getElementById('pagination-controls').addEventListener('click', e => {
        const button = e.target.closest('button[data-page]');
        if (!button || button.disabled) return;
        
        const page = parseInt(button.dataset.page, 10);
        setCurrentPage(page);
        applyFilters();
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
