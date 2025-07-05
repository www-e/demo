// js/ui/modals.js
// This file is correct as-is. No changes are needed here.

class BaseModal {
    constructor(modalClass, innerHTML) {
        this.modal = document.createElement('div');
        this.modal.className = `info-modal ${modalClass}`;
        this.modal.innerHTML = innerHTML;
        document.body.appendChild(this.modal);
        this.modal.querySelector('.info-modal-close')?.addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', e => { if (e.target === this.modal) this.hide(); });
    }
    show() { setTimeout(() => this.modal.classList.add('active'), 10); }
    hide() {
        this.modal.classList.remove('active');
        setTimeout(() => this.modal.remove(), 300);
    }
}

export class ThirdGradeModal extends BaseModal {
    constructor() {
        super('third-grade-modal', `
            <div class="info-modal-content">
                <div class="info-modal-header"><h3 class="info-modal-title">معلومات هامة للصف الثالث الثانوي</h3><button class="info-modal-close"><i class="fas fa-times"></i></button></div>
                <div class="info-modal-body">
                    <div class="info-icon"><i class="fas fa-graduation-cap"></i></div>
                    <h4>نظام الدراسة المتميز</h4>
                    <ul>
                        <li><span class="info-highlight"><i class="fas fa-calendar-alt"></i>امتحانات</span> <strong>كويز كل حصة</strong></li>
                    </ul>
                </div>
            </div>`);
    }
}

export class RestrictedGroupsModal extends BaseModal {
    constructor() {
        super('restricted-modal', `
            <div class="info-modal-content">
                <div class="info-modal-header"><h3 class="info-modal-title">مجموعات غير متاحة</h3><button class="info-modal-close"><i class="fas fa-times"></i></button></div>
                <div class="info-modal-body">
                    <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <p>عفواً، هذه المجموعة مكتملة. يرجى اختيار مجموعة أخرى.</p>
                </div>
            </div>`);
    }
}

export class DuplicateRegistrationModal extends BaseModal {
    constructor() {
        super('duplicate-modal', `
            <div class="info-modal-content">
                <div class="info-modal-header"><h3 class="info-modal-title">طالب مسجل بالفعل</h3><button class="info-modal-close"><i class="fas fa-times"></i></button></div>
                <div class="info-modal-body">
                    <div class="info-icon duplicate-icon"><i class="fas fa-user-check"></i></div>
                    <p class="duplicate-message"><strong>هذا الطالب مسجل بالفعل!</strong></p>
                    <p>رقم الهاتف <span class="phone-number"></span> مسجل مسبقاً في هذا الصف.</p>
                </div>
            </div>`);
        this.phoneSpan = this.modal.querySelector('.phone-number');
    }
    show(phone) {
        this.phoneSpan.textContent = phone || '';
        super.show();
    }
}

export class SuccessModal {
    constructor() {
        this.createModal();
    }
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'success-message info-modal';
        this.modal.style.display = 'none';

        this.modal.innerHTML = `
        <div class="success-content info-modal-content">
            <button class="close-btn info-modal-close"><i class="fas fa-times"></i></button>
            <i class="fas fa-check-circle success-icon" style="font-size: 4rem; color: var(--success);"></i>
            <h3>تم تسجيل بياناتك بنجاح</h3>
            <div class="receipt-info-group">
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-user"></i> اسم الطالب</span>
                    <span class="receipt-value student-name"></span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-graduation-cap"></i> الصف</span>
                    <span class="receipt-value grade-name"></span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-users"></i> المجموعة</span>
                    <span class="receipt-value group-name"></span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-clock"></i> الموعد</span>
                    <span class="receipt-value time-name"></span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-chalkboard-teacher"></i> المدرس</span>
                    <span class="receipt-value teacher-name"></span>
                </div>
            </div>
            <div class="confirmation-details" style="text-align: right; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <h4 style="font-size: 1.2rem; color: var(--primary); margin-bottom: 0.75rem;"><i class="fas fa-exclamation-circle"></i> خطوة هامة لتأكيد الحجز</h4>
                <p>لإتمام التسجيل، يرجى تأكيد الحجز بالحضور إلى السنتر.</p>
                <p><strong>الموعد:</strong>  من 4:00م حتى 10:00م.</p>
                <p><strong>المطلوب:</strong> سداد رسوم تأكيد الحجز 50 جنيهًا.</p>
            </div>
        </div>`;
        document.body.appendChild(this.modal);
        this.modal.querySelector('.close-btn').addEventListener('click', () => this.hide());
    }
    show(data) {
        this.modal.querySelector('.student-name').textContent = data.studentName || 'غير متوفر';
        this.modal.querySelector('.grade-name').textContent = data.gradeName || 'غير متوفر';
        this.modal.querySelector('.group-name').textContent = data.groupName || 'غير متوفر';
        this.modal.querySelector('.time-name').textContent = data.timeName || 'غير متوفر';
        this.modal.querySelector('.teacher-name').textContent = data.teacherName || 'غير متوفر'; // ADDED: Teacher name
        this.modal.style.display = 'flex';
        setTimeout(() => this.modal.classList.add('active'), 10);
    }
    hide() { 
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }
}