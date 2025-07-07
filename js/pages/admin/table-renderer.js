// js/pages/admin/table-renderer.js
import { GRADE_NAMES, GRADE_COLORS, STUDENTS_PER_PAGE } from './constants.js';
import { currentPage } from './state.js';
import { convertTo12HourFormat, formatFullDate } from './helpers.js';

export function renderTable(students) {
    const tableBody = document.getElementById('students-table-body');
    if (!students || students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-gray-400">لا يوجد طلاب يطابقون هذا البحث.</td></tr>`; // CHANGED: colspan from 8 to 9
        return;
    }
    tableBody.innerHTML = students.map((student, index) => {
        const rowColor = GRADE_COLORS[student.grade] || 'bg-white';
        const timeFormatted = convertTo12HourFormat(student.time_slot);
        const groupTime = [student.days_group, timeFormatted].filter(val => val && val !== '—').join(' - ') || '—';
        const globalIndex = (currentPage - 1) * STUDENTS_PER_PAGE + index + 1;
        
        const deleteBtnHTML = `<button class="btn-action delete" data-id="${student.id}" data-name="${student.student_name}" title="حذف الطالب"><i class="fas fa-trash-alt"></i></button>`;

        return `
        <tr class="hover:bg-gray-100 border-b border-gray-200 text-sm" data-id="${student.id}">
            <td class="p-3 text-center text-slate-600 cursor-pointer">${globalIndex}</td>
            <td class="p-3 font-semibold text-slate-800 cursor-pointer">${student.student_name}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${GRADE_NAMES[student.grade] || ''}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${groupTime}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${student.teacher?.name || 'عام'}</td>
            <td class="p-3 text-slate-700 cursor-pointer">${student.material?.name || 'عامة'}</td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">
                <a href="https://wa.me/20${student.student_phone.substring(1)}" target="_blank" class="hover:underline text-green-600 font-semibold" onclick="event.stopPropagation();"><i class="fab fa-whatsapp"></i> ${student.student_phone}</a>
            </td>
            <td class="p-3 text-slate-700 text-left font-mono" dir="ltr">
                <a href="https://wa.me/20${student.parent_phone.substring(1)}" target="_blank" class="hover:underline text-green-600 font-semibold" onclick="event.stopPropagation();"><i class="fab fa-whatsapp"></i> ${student.parent_phone}</a>
            </td>
            <td class="p-3 text-xs text-slate-500 whitespace-nowrap cursor-pointer">${formatFullDate(student.created_at)}</td>
            <td class="p-3 text-center">
                <div class="action-buttons">${deleteBtnHTML}</div>
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

    let paginationHTML = `<button data-page="${currentPage - 1}" class="pagination-btn bg-white text-gray-700 hover:bg-gray-50" ${currentPage === 1 ? 'disabled' : ''}>السابق</button>`;
    
    const createBtn = (p, isActive = false) => `<button data-page="${p}" class="pagination-btn ${isActive ? 'active' : 'bg-white text-gray-700 hover:bg-gray-50'}">${p}</button>`;
    const ellipsis = `<span class="px-3 py-1 text-gray-500">...</span>`;

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) paginationHTML += createBtn(i, i === currentPage);
    } else {
        if (currentPage < 5) {
            for (let i = 1; i <= 5; i++) paginationHTML += createBtn(i, i === currentPage);
            paginationHTML += ellipsis + createBtn(totalPages);
        } else if (currentPage > totalPages - 4) {
            paginationHTML += createBtn(1) + ellipsis;
            for (let i = totalPages - 4; i <= totalPages; i++) paginationHTML += createBtn(i, i === currentPage);
        } else {
            paginationHTML += createBtn(1) + ellipsis;
            for (let i = currentPage - 1; i <= currentPage + 1; i++) paginationHTML += createBtn(i, i === currentPage);
            paginationHTML += ellipsis + createBtn(totalPages);
        }
    }
    
    paginationHTML += `<button data-page="${currentPage + 1}" class="pagination-btn bg-white text-gray-700 hover:bg-gray-50" ${currentPage === totalPages ? 'disabled' : ''}>التالي</button>`;
    container.innerHTML = paginationHTML;
}

export function showTableLoading() {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="p-8 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span class="text-gray-600 mr-3">جار تحميل البيانات...</span>
                </div>
            </td>
        </tr>
    `;
}

export function showTableError(errorMessage = 'حدث خطأ أثناء تحميل البيانات') {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = `
        <tr>
            <td colspan="9" class="p-8 text-center">
                <div class="flex flex-col items-center space-y-3">
                    <i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
                    <p class="text-red-500 font-medium">${errorMessage}</p>
                    <button onclick="location.reload()" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-redo-alt me-1"></i>
                        إعادة المحاولة
                    </button>
                </div>
            </td>
        </tr>
    `;
}

export function updatePaginationInfo(currentItems, totalItems, currentPage, totalPages) {
    const infoElement = document.getElementById('pagination-info');
    if (infoElement) {
        const start = ((currentPage - 1) * STUDENTS_PER_PAGE) + 1;
        const end = Math.min(currentPage * STUDENTS_PER_PAGE, totalItems);
        infoElement.textContent = `عرض ${start} إلى ${end} من ${totalItems} طالب (الصفحة ${currentPage} من ${totalPages})`;
    }
}
