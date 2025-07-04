// js/pages/admin/ui-renderer.js
// Re-export everything from the split modules for backward compatibility
export { 
    renderTable, 
    renderPagination, 
    showTableLoading, 
    showTableError, 
    updatePaginationInfo 
} from './table-renderer.js';

export { 
    renderFilterCards, 
    refreshFilterCards, 
    updateGroupStudentCount 
} from './filter-cards.js';
