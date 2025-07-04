// js/admin.js
import { initializeUpdateModal } from './components/update-modal.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
// --- Page Loader Logic ---
const pageLoader = document.getElementById('page-loader');
document.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.hostname === window.location.hostname) {
            pageLoader?.classList.remove('hidden');
        }
    });
});


const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Data Mappings & Constants ---
const GRADE_NAMES = { 'first': 'الصف الأول', 'second': 'الصف الثاني', 'third': 'الصف الثالث' };
const GRADE_COLORS = { 'first': 'bg-blue-50', 'second': 'bg-green-50', 'third': 'bg-orange-50' };
const STUDENTS_PER_PAGE = 20;

// --- Global State ---
let allStudents = [];
let currentFilter = { grade: 'all', group: 'all', searchQuery: '' };
let studentDetailModal;
let deleteConfirmationModal; // New state for the delete modal
let currentPage = 1;

// --- Helper Functions ---
const convertTo12HourFormat = time24 => time24 ? new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : '—';
const formatFullDate = dateStr => new Date(dateStr).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

function showToast(message, type = 'success') {
    const toastTypeClasses = { success: 'bg-success', error: 'bg-danger', info: 'bg-info' };
    const headerClass = toastTypeClasses[type] || 'bg-secondary';
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header text-white ${headerClass}">
                <strong class="me-auto">إشعار</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>`;
    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    const newToast = document.getElementById('toastContainer').lastElementChild;
    const bsToast = new bootstrap.Toast(newToast, { delay: 4000 });
    bsToast.show();
    newToast.addEventListener('hidden.bs.toast', () => newToast.remove());
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', async () => {
    initializeUpdateModal();
    studentDetailModal = new bootstrap.Modal(document.getElementById('studentDetailModal'));
    deleteConfirmationModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));

    try {
        const { data, error } = await supabase.from('registrations_2025_2026').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allStudents = data;
        initializeDashboard();
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('students-table-body').innerHTML = `<tr><td colspan="8" class="p-8 text-center text-red-500">فشل في تحميل البيانات. تأكد من صلاحيات الوصول (RLS).</td></tr>`;
    } finally {
        if(pageLoader) pageLoader.classList.add('hidden');
    }
});

// --- Initialization ---
function initializeDashboard() {
    renderFilterCards();
    applyFilters();
    setupEventListeners();
}

// --- Main Filtering & Rendering Logic ---
function applyFilters() {
    let filteredStudents = [...allStudents];

    if (currentFilter.grade !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.grade === currentFilter.grade);
    }
    
    if (currentFilter.group !== 'all') {
        const [filterGroup, filterTime] = currentFilter.group.split('|');
        filteredStudents = filteredStudents.filter(s => s.days_group === filterGroup && s.time_slot === filterTime);
    }

    const query = currentFilter.searchQuery.trim().toLowerCase();
    if (query) {
        filteredStudents = filteredStudents.filter(s =>
            s.student_name.toLowerCase().includes(query) || s.student_phone.includes(query) || s.parent_phone.includes(query)
        );
    }
    
    document.getElementById('total-students-count').textContent = filteredStudents.length;
    
    // Client-side pagination logic
    const start = (currentPage - 1) * STUDENTS_PER_PAGE;
    const end = start + STUDENTS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(start, end);
    
    renderTable(paginatedStudents);
    renderPagination(filteredStudents.length);
    updateGroupStudentCount();
}

// --- UI Rendering ---
function renderTable(students) {
    const tableBody = document.getElementById('students-table-body');
    if (!students || students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-gray-400">لا يوجد طلاب يطابقون هذا البحث.</td></tr>`;
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

function renderPagination(totalItems) {
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

function renderFilterCards() {
    const container = document.getElementById('stats-section').querySelector('.grid');
    const counts = { all: allStudents.length, first: allStudents.filter(s => s.grade === 'first').length, second: allStudents.filter(s => s.grade === 'second').length, third: allStudents.filter(s => s.grade === 'third').length, };
    const cardsData = [
        { grade: 'all', label: 'إجمالي الطلاب', count: counts.all, icon: 'fa-users', color: 'violet' },
        { grade: 'first', label: 'الصف الأول', count: counts.first, icon: 'fa-child', color: 'blue' },
        { grade: 'second', label: 'الصف الثاني', count: counts.second, icon: 'fa-user-graduate', color: 'green' },
        { grade: 'third', label: 'الصف الثالث', count: counts.third, icon: 'fa-crown', color: 'orange' }
    ];
    container.innerHTML = cardsData.map(card => `<div data-grade="${card.grade}" class="filter-card group bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-${card.color}-400"><div class="text-center sm:text-right"><p class="text-gray-500 text-xs sm:text-sm font-medium">${card.label}</p><p class="text-2xl sm:text-3xl font-bold">${card.count}</p></div><div class="bg-${card.color}-100 text-${card.color}-600 rounded-full p-3 mt-2 sm:mt-0 transition-transform group-hover:scale-110"><i class="fas ${card.icon} fa-fw"></i></div></div>`).join('');
    container.querySelector('[data-grade="all"]').classList.add('active');
}

function updateGroupFilterDropdown() {
    const groupFilterSection = document.getElementById('secondary-filter-section');
    const groupSelect = document.getElementById('group-filter');
    if (currentFilter.grade === 'all') {
        groupFilterSection.classList.add('hidden');
        return;
    }
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

function updateGroupStudentCount() {
    const countElement = document.getElementById('group-student-count');
    if (currentFilter.grade === 'all' || currentFilter.group === 'all') {
        countElement.textContent = '—';
        return;
    }
    const [filterGroup, filterTime] = currentFilter.group.split('|');
    const count = allStudents.filter(s => s.grade === currentFilter.grade && s.days_group === filterGroup && s.time_slot === filterTime).length;
    countElement.textContent = count;
}

function renderModalContent(student) {
    const modalHeader = document.querySelector('#studentDetailModal .modal-header');
    const modalBody = document.getElementById('modal-body-content');
    const studentInitial = student.student_name.charAt(0).toUpperCase();

    modalHeader.innerHTML = `
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        <div class="modal-header-avatar">${studentInitial}</div>
        <h5 class="modal-header-name">${student.student_name}</h5>
        <p class="modal-header-grade">${GRADE_NAMES[student.grade] || 'غير محدد'}</p>
    `;

    const timeFormatted = convertTo12HourFormat(student.time_slot);
    const groupTime = [student.days_group, timeFormatted].filter(val => val && val !== '—').join(' - ') || '—';

    modalBody.innerHTML = `
        <div class="modal-section"><h6 class="modal-section-title">بيانات التسجيل</h6><div class="details-grid"><div class="detail-pair" style="grid-column: 1 / -1;"><i class="fas fa-users detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">المجموعة والموعد</p><p class="detail-pair-value">${groupTime}</p></div></div></div></div>
        <div class="modal-section"><h6 class="modal-section-title">بيانات التواصل</h6><div class="details-grid"><div class="detail-pair"><i class="fas fa-mobile-alt detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">رقم الطالب</p><p class="detail-pair-value"><a href="https://wa.me/20${student.student_phone.substring(1)}" target="_blank">${student.student_phone} <i class="fab fa-whatsapp"></i></a></p></div></div><div class="detail-pair"><i class="fas fa-user-shield detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">رقم ولي الأمر</p><p class="detail-pair-value"><a href="https://wa.me/20${student.parent_phone.substring(1)}" target="_blank">${student.parent_phone} <i class="fab fa-whatsapp"></i></a></p></div></div></div></div>
        <div class="modal-section"><h6 class="modal-section-title">معلومات إضافية</h6><div class="details-grid"><div class="detail-pair" style="grid-column: 1 / -1;"><i class="fas fa-calendar-check detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">تاريخ التسجيل</p><p class="detail-pair-value">${formatFullDate(student.created_at)}</p></div></div></div></div>
    `;
}

function setupEventListeners() {
    document.getElementById('stats-section').addEventListener('click', e => {
        const card = e.target.closest('.filter-card');
        if (!card) return;
        document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentFilter.grade = card.dataset.grade;
        currentPage = 1;
        updateGroupFilterDropdown();
        applyFilters();
    });

    document.getElementById('group-filter').addEventListener('change', e => {
        currentFilter.group = e.target.value;
        currentPage = 1;
        applyFilters();
    });

    document.getElementById('search-input').addEventListener('input', e => {
        currentFilter.searchQuery = e.target.value;
        currentPage = 1;
        applyFilters();
    });

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
    
    document.getElementById('pagination-controls').addEventListener('click', e => {
        const button = e.target.closest('button[data-page]');
        if (!button || button.disabled) return;
        const page = parseInt(button.dataset.page, 10);
        currentPage = page;
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

async function handleDeleteStudent(studentId, studentName) {
    document.getElementById('deleteModalBody').textContent = `هل أنت متأكد من الحذف النهائي للطالب "${studentName}"؟ لا يمكن التراجع عن هذا الإجراء.`;
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
        newConfirmBtn.disabled = true;
        newConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جار الحذف...';
        
        try {
            const { error } = await supabase.from('registrations_2025_2026').delete().eq('id', studentId);
            if (error) throw error;

            allStudents = allStudents.filter(s => s.id !== studentId);
            
            const totalFilteredItems = allStudents.filter(s => (currentFilter.grade === 'all' || s.grade === currentFilter.grade)).length;
            const totalPages = Math.ceil(totalFilteredItems / STUDENTS_PER_PAGE);
            if (currentPage > totalPages && currentPage > 1) {
                currentPage--;
            }

            applyFilters();
            renderFilterCards();

            deleteConfirmationModal.hide();
            showToast(`تم حذف الطالب "${studentName}" بنجاح.`, 'success');

        } catch (error) {
            console.error('Error deleting student:', error);
            deleteConfirmationModal.hide();
            showToast(`حدث خطأ أثناء حذف الطالب: ${error.message}`, 'error');
        } finally {
            newConfirmBtn.disabled = false;
            newConfirmBtn.innerHTML = 'نعم، حذف';
        }
    }, { once: true }); // Ensure the listener only fires once

    deleteConfirmationModal.show();
}