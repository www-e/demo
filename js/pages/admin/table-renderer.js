// js/pages/admin/table-renderer.js
import { GRADE_NAMES, STUDENTS_PER_PAGE } from './constants.js';
import { currentPage } from './state.js';
import { convertTo12HourFormat, formatFullDate } from './helpers.js';

export function renderTable(students) {
    const tableBody = document.getElementById('students-table-body');
    if (!students || students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="11" class="p-8 text-center text-gray-400">لا يوجد طلاب يطابقون هذا البحث.</td></tr>`;
        return;
    }
    tableBody.innerHTML = students.map((student, index) => {
        const timeFormatted = convertTo12HourFormat(student.time_slot);
        const groupTime = [student.days_group, timeFormatted].filter(val => val && val !== '—').join(' - ') || '—';
        const globalIndex = (currentPage - 1) * STUDENTS_PER_PAGE + index + 1;
        
        // FIXED: Check if the teacher is inactive to apply a warning style
        const isTeacherInactive = student.teacher && !student.teacher.is_active;
        const warningClass = isTeacherInactive ? 'text-red-500 font-bold' : '';

        return `
        <tr class="hover:bg-gray-100 border-b border-gray-200 text-sm" data-id="${student.id}">
            <td class="p-3 text-center text-slate-600 cursor-pointer">${globalIndex}</td>
            <td class="p-3 font-semibold text-slate-800 cursor-pointer">${student.student_name}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${GRADE_NAMES[student.grade] || ''}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${student.center?.name || 'عام'}</td>
            <td class="p-3 text-slate-700 cursor-pointer ${warningClass}">${groupTime}</td>
            <td class="p-3 text-slate-700 cursor-pointer ${warningClass}">${student.teacher?.name || 'عام'}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${student.material?.name || 'عامة'}</td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">
                <a href="https://wa.me/20${student.student_phone.substring(1)}" target="_blank" class="hover:underline text-green-600 font-semibold" onclick="event.stopPropagation();"><i class="fab fa-whatsapp"></i> ${student.student_phone}</a>
            </td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">
                <a href="https://wa.me/20${student.parent_phone.substring(1)}" target="_blank" class="hover:underline text-green-600 font-semibold" onclick="event.stopPropagation();"><i class="fab fa-whatsapp"></i> ${student.parent_phone}</a>
            </td>
            <td class="p-3 text-xs text-slate-500 whitespace-nowrap cursor-pointer">${formatFullDate(student.created_at)}</td>
            <td class="p-3 text-center">
                <div class="action-buttons"><button class="btn-action delete" data-id="${student.id}" data-name="${student.student_name}" title="حذف الطالب"><i class="fas fa-trash-alt"></i></button></div>
            </td>
        </tr>
    `}).join('');
}

export function renderPagination(totalItems) {
    const container = document.getElementById('pagination-controls');
    const totalPages = Math.ceil(totalItems / STUDENTS_PER_PAGE);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = `<button data-page="${currentPage - 1}" class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''}>السابق</button>`;
    
    const createBtn = (p) => `<button data-page="${p}" class="pagination-btn ${p === currentPage ? 'active' : ''}">${p}</button>`;
    const ellipsis = `<span class="px-3 py-1 text-gray-500">...</span>`;

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) paginationHTML += createBtn(i);
    } else {
        if (currentPage < 5) {
            for (let i = 1; i <= 5; i++) paginationHTML += createBtn(i);
            paginationHTML += ellipsis + createBtn(totalPages);
        } else if (currentPage > totalPages - 4) {
            paginationHTML += createBtn(1) + ellipsis;
            for (let i = totalPages - 4; i <= totalPages; i++) paginationHTML += createBtn(i);
        } else {
            paginationHTML += createBtn(1) + ellipsis;
            for (let i = currentPage - 1; i <= currentPage + 1; i++) paginationHTML += createBtn(i);
            paginationHTML += ellipsis + createBtn(totalPages);
        }
    }
    
    paginationHTML += `<button data-page="${currentPage + 1}" class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}>التالي</button>`;
    container.innerHTML = paginationHTML;
}