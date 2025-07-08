// js/modal-manager.js
import { GRADE_NAMES } from './constants.js';
import { convertTo12HourFormat, formatFullDate } from './helpers.js';

export function renderModalContent(student) {
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
<div class="modal-section">
    <h6 class="modal-section-title">بيانات التسجيل</h6>
    <div class="details-grid">
        <div class="detail-pair">
            <i class="fas fa-hashtag detail-pair-icon"></i>
            <div class="detail-pair-content">
                <p class="detail-pair-label">رقم معاملة الدفع</p>
                <p class="detail-pair-value" style="direction: ltr; text-align: right;">${student.transaction_id || '—'}</p>
            </div>
        </div>
        <div class="detail-pair" style="grid-column: 1 / -1;">
            <i class="fas fa-users detail-pair-icon"></i>
            <div class="detail-pair-content">
                <p class="detail-pair-label">المجموعة والموعد</p>
                <p class="detail-pair-value">${groupTime}</p>
            </div>
        </div>
    </div>
</div>
        <div class="modal-section"><h6 class="modal-section-title">بيانات التواصل</h6><div class="details-grid"><div class="detail-pair"><i class="fas fa-mobile-alt detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">رقم الطالب</p><p class="detail-pair-value"><a href="https://wa.me/20${student.student_phone.substring(1)}" target="_blank">${student.student_phone} <i class="fab fa-whatsapp"></i></a></p></div></div><div class="detail-pair"><i class="fas fa-user-shield detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">رقم ولي الأمر</p><p class="detail-pair-value"><a href="https://wa.me/20${student.parent_phone.substring(1)}" target="_blank">${student.parent_phone} <i class="fab fa-whatsapp"></i></a></p></div></div></div></div>
        <div class="modal-section"><h6 class="modal-section-title">معلومات إضافية</h6><div class="details-grid"><div class="detail-pair"><i class="fas fa-chalkboard-teacher detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">المدرس</p><p class="detail-pair-value">${student.teacher?.name || 'غير محدد'}</p></div></div><div class="detail-pair"><i class="fas fa-book-open detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">المادة</p><p class="detail-pair-value">${student.material?.name || 'غير محدد'}</p></div></div><div class="detail-pair" style="grid-column: 1 / -1;"><i class="fas fa-calendar-check detail-pair-icon"></i><div class="detail-pair-content"><p class="detail-pair-label">تاريخ التسجيل</p><p class="detail-pair-value">${formatFullDate(student.created_at)}</p></div></div></div></div>
    `;
}
