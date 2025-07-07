// js/pages/admin/event-handlers.js
import { currentFilter, allStudents, studentDetailModal, setCurrentFilter, setCurrentPage } from './state.js';
import { applyFilters } from './filters.js';
import { renderModalContent } from './modal-manager.js';
import { handleDeleteStudent } from './crud-operations.js';
import { debounce, showLoading } from './helpers.js'; // Import showLoading
import { renderFilterCards } from './filter-cards.js';

export function setupEventListeners() {
    // Grade filter cards
    document.getElementById('stats-section').addEventListener('click', e => {
        const card = e.target.closest('.filter-card');
        if (!card) return;
        
        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        setCurrentFilter({ grade: card.dataset.grade });
        setCurrentPage(1);
        applyFilters();
    });

    // Dropdown filters
    const setupFilterListener = (id, filterKey) => {
        const filterElement = document.getElementById(id);
        if (filterElement) {
            filterElement.addEventListener('change', e => {
                setCurrentFilter({ [filterKey]: e.target.value });
                setCurrentPage(1);
                applyFilters();
                renderFilterCards(); // Refresh grade counts based on new filters
            });
        }
    };
    
    setupFilterListener('centerFilter', 'center');
    setupFilterListener('teacherFilter', 'teacher');
    setupFilterListener('materialFilter', 'material');

    // FIXED: Debounced search input with loading indicator inside
    const debouncedSearch = debounce(() => {
        showLoading(); // Show loading spinner only when the search is about to run
        setCurrentPage(1);
        applyFilters();
    }, 300);

    document.getElementById('search-input').addEventListener('input', e => {
        // We update the state immediately, but the API call is debounced.
        setCurrentFilter({ searchQuery: e.target.value });
        debouncedSearch();
    });

    // Table interactions
    document.getElementById('students-table-body').addEventListener('click', e => {
        const deleteButton = e.target.closest('.btn-action.delete');
        if (deleteButton) {
            e.stopPropagation();
            handleDeleteStudent(deleteButton.dataset.id, deleteButton.dataset.name);
            return;
        }

        const studentRow = e.target.closest('tr[data-id]');
        if (studentRow) {
            const student = allStudents.find(s => s.id === studentRow.dataset.id);
            if (student) {
                renderModalContent(student);
                studentDetailModal.show();
            }
        }
    });
    
    // Pagination
    document.getElementById('pagination-controls').addEventListener('click', e => {
        const button = e.target.closest('button[data-page]');
        if (!button || button.disabled) return;
        
        setCurrentPage(parseInt(button.dataset.page, 10));
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}