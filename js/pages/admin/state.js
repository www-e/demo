// js/pages/admin/state.js
export let allStudents = [];
export let currentFilter = { grade: 'all', group: 'all', teacher: 'all', material: 'all', searchQuery: '' }; // ADDED: material: 'all'
export let studentDetailModal;
export let deleteConfirmationModal;
export let currentPage = 1;

export function setAllStudents(students) {
    allStudents = students;
}

export function setCurrentFilter(filter) {
    currentFilter = { ...currentFilter, ...filter };
}

export function setStudentDetailModal(modal) {
    studentDetailModal = modal;
}

export function setDeleteConfirmationModal(modal) {
    deleteConfirmationModal = modal;
}

export function setCurrentPage(page) {
    currentPage = page;
}
