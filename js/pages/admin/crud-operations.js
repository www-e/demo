// js/pages/admin/crud-operations.js
import { supabase } from './supabase-client.js';
import { STUDENTS_PER_PAGE } from './constants.js';
import { allStudents, currentFilter, currentPage, deleteConfirmationModal, setAllStudents, setCurrentPage } from './state.js';
import { showToast, showLoading, hideLoading } from './helpers.js';
import { applyFilters } from './filters.js';
import { renderFilterCards } from './filter-cards.js';

// NEW: Optimistic delete with proper error handling
export async function handleDeleteStudent(studentId, studentName) {
    document.getElementById('deleteModalBody').textContent = 
        `هل أنت متأكد من الحذف النهائي للطالب "${studentName}"؟ لا يمكن التراجع عن هذا الإجراء.`;
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    // Clean up previous event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // Single-use event listener
    const handleConfirmDelete = async () => {
        newConfirmBtn.disabled = true;
        newConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جار الحذف...';
        
        // Store original state for rollback
        const originalStudents = [...allStudents];
        
        try {
            // Optimistic update: Remove from UI immediately
            const updatedStudents = allStudents.filter(s => s.id !== studentId);
            setAllStudents(updatedStudents);
            
            // Update UI optimistically
            await applyFilters();
            renderFilterCards();
            
            // Hide modal immediately for better UX
            deleteConfirmationModal.hide();
            
            // Show optimistic success message
            showToast(`جار حذف الطالب "${studentName}"...`, 'info');
            
            // Perform actual deletion
            const { error } = await supabase.from('registrations_2025_2026').delete().eq('id', studentId);
            if (error) throw error;

            // Confirm success
            showToast(`تم حذف الطالب "${studentName}" بنجاح.`, 'success');
            
        } catch (error) {
            console.error('Error deleting student:', error);
            
            // Rollback optimistic update
            setAllStudents(originalStudents);
            await applyFilters();
            renderFilterCards();
            
            // Show error
            showToast(`فشل في حذف الطالب: ${error.message}`, 'error');
            
        } finally {
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerHTML = 'نعم، حذف';
        }
    };

    newConfirmBtn.addEventListener('click', handleConfirmDelete, { once: true });
    deleteConfirmationModal.show();
}
