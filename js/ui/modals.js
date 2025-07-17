// js/ui/modals.js

class BaseModal {
    constructor(modalClass, innerHTML) {
        // Prevent creating duplicate modals
        const existingModal = document.querySelector(`.${modalClass.split(' ')[0]}`);
        if (existingModal) {
            this.modal = existingModal;
        } else {
            this.modal = document.createElement('div');
            this.modal.className = `info-modal ${modalClass}`;
            this.modal.innerHTML = innerHTML;
            document.body.appendChild(this.modal);
        }
        this.modal.querySelector('.info-modal-close')?.addEventListener('click', () => this.hide());
        this.modal.addEventListener('click', e => { if (e.target === this.modal) this.hide(); });
    }
    show() { setTimeout(() => this.modal.classList.add('active'), 10); }
    hide() {
        this.modal.classList.remove('active');
        // Do not remove the element from the DOM, just hide it. This preserves it for reuse.
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

// MODIFIED: This modal is now for group full/not found errors
export class RestrictedGroupsModal extends BaseModal {
    constructor() {
        super('restricted-modal', `
            <div class="info-modal-content">
                <div class="info-modal-header"><h3 class="info-modal-title">المجموعة غير متاحة</h3><button class="info-modal-close"><i class="fas fa-times"></i></button></div>
                <div class="info-modal-body">
                    <div class="warning-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <p id="restricted-modal-message">عفواً، هذه المجموعة مكتملة العدد أو لم تعد متاحة. يرجى اختيار مجموعة أخرى.</p>
                </div>
            </div>`);
    }
    // NEW: Allow customizing the message
    show(message) {
        const p = this.modal.querySelector('#restricted-modal-message');
        if (message) {
            p.textContent = message;
        } else {
            p.textContent = 'عفواً، هذه المجموعة مكتملة العدد أو لم تعد متاحة. يرجى اختيار مجموعة أخرى.';
        }
        super.show();
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
                    <p>رقم الهاتف <span class="phone-number"></span> مسجل مسبقاً في هذه المادة والصف.</p>
                </div>
            </div>`);
        this.phoneSpan = this.modal.querySelector('.phone-number');
    }
    show(phone) {
        this.phoneSpan.textContent = phone || '';
        super.show();
    }
}
export class MathWarningModal extends BaseModal {
    constructor() {
        super('math-warning-modal', `
            <div class="info-modal-content">
                <div class="info-modal-header"><h3 class="info-modal-title">ملاحظة هامة</h3><button class="info-modal-close"><i class="fas fa-times"></i></button></div>
                <div class="info-modal-body">
                    <div class="info-icon" style="color: var(--info);"><i class="fas fa-info-circle"></i></div>
                    <p>تأكد من حجز المادتين معًا (بحتة وتطبيقية) لاستكمال تسجيل مواد الرياضيات.</p>
                </div>
            </div>`);
    }
}
// NEW: A brand new, detailed success modal with pricing.

// REPLACE THE ENTIRE SuccessModal CLASS WITH THIS NEW VERSION

export class SuccessModal extends BaseModal {
    constructor() {
        const innerHTML = `
        <div class="info-modal-content">
            <button class="info-modal-close"><i class="fas fa-times"></i></button>
            <div class="info-modal-body">
                <div class="info-icon"><i class="fas fa-check-circle" style="color: var(--success);"></i></div>
                <h3 class="info-modal-title" style="color: var(--text-primary);">تم التسجيل بنجاح!</h3>
                <p class="text-secondary mb-4">تم تسجيل بياناتك. يرجى مراجعة التفاصيل.</p>
                <div class="receipt-info-group" id="receipt-details-container">
                    <!-- Details will be injected here by the show() method -->
                </div>
            </div>
        </div>`;
        super('success-modal', innerHTML);
        this.detailsContainer = this.modal.querySelector('#receipt-details-container');
    }

    show(data) {
        // Clear previous content
        this.detailsContainer.innerHTML = '';

        // --- NEW LOGIC: Check if we have a detailed summary to display ---
        if (data.summary && Array.isArray(data.summary)) {
            // Build the multi-item summary view
            this.detailsContainer.innerHTML += `
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-user"></i> اسم الطالب</span>
                    <span class="receipt-value">${data.studentName}</span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-mobile-alt"></i> رقم الطالب</span>
                    <span class="receipt-value" style="direction: ltr;">${data.studentPhone}</span>
                </div>
            `;
            
            data.summary.forEach(item => {
                this.detailsContainer.innerHTML += `
                <div class="receipt-data-row" style="background: rgba(var(--primary-rgb), 0.02); padding: 8px; border-radius: 8px; margin-top: 8px;">
                    <span class="receipt-label"><i class="fas fa-book-open"></i> ${item.materialName}</span>
                    <span class="receipt-value">${item.groupName} - ${item.timeName}</span>
                </div>
                `;
            });

        } else {
            // --- FALLBACK: Original logic for single registration display ---
            this.detailsContainer.innerHTML = `
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-user"></i> اسم الطالب</span>
                    <span class="receipt-value">${data.studentName}</span>
                </div>
                 <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-mobile-alt"></i> رقم الطالب</span>
                    <span class="receipt-value" style="direction: ltr;">${data.studentPhone}</span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-user-shield"></i> رقم ولي الأمر</span>
                    <span class="receipt-value" style="direction: ltr;">${data.parentPhone}</span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-graduation-cap"></i> الصف والمادة</span>
                    <span class="receipt-value">${data.gradeName} - ${data.materialName}</span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-building"></i> المركز</span>
                    <span class="receipt-value">${data.centerName}</span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-users"></i> المجموعة</span>
                    <span class="receipt-value">${data.groupName} - ${data.timeName}</span>
                </div>
                <div class="receipt-data-row">
                    <span class="receipt-label"><i class="fas fa-hashtag"></i> رقم المعاملة</span>
                    <span class="receipt-value" style="direction: ltr;">${data.transactionId}</span>
                </div>
            `;
        }
        
        super.show();
    }
}
export class SecondMathStepModal extends BaseModal {
    constructor() {
        const innerHTML = `
        <div class="info-modal-content">
            <div class="info-modal-header">
                <h3 class="info-modal-title" id="second-step-modal-title"></h3>
                <button class="info-modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="info-modal-body">
                <div class="info-icon" style="color: var(--primary);"><i class="fas fa-arrow-right"></i></div>
                <p id="second-step-modal-message"></p>
                <div class="action-buttons">
                    <button class="primary-btn" id="second-step-confirm-btn"></button>
                    <button class="secondary-btn" id="second-step-cancel-btn">لاحقًا</button>
                </div>
            </div>
        </div>`;
        super('second-math-step-modal', innerHTML);
        this.titleEl = this.modal.querySelector('#second-step-modal-title');
        this.messageEl = this.modal.querySelector('#second-step-modal-message');
        this.confirmBtn = this.modal.querySelector('#second-step-confirm-btn');
        this.cancelBtn = this.modal.querySelector('#second-step-cancel-btn');
    }

    show({ onConfirm, onCancel, firstMaterialName, secondMaterialName }) {
        this.titleEl.textContent = `تم التسجيل في مادة ${firstMaterialName} بنجاح!`;
        this.messageEl.textContent = `لاستكمال تسجيل مواد الرياضيات، يجب التسجيل في مادة ${secondMaterialName} الآن.`;
        this.confirmBtn.innerHTML = `<i class="fas fa-arrow-left"></i> تسجيل في ${secondMaterialName} الآن`;
        
        // Use .cloneNode to remove old event listeners before adding new ones
        const newConfirmBtn = this.confirmBtn.cloneNode(true);
        this.confirmBtn.parentNode.replaceChild(newConfirmBtn, this.confirmBtn);
        this.confirmBtn = newConfirmBtn;
        
        const newCancelBtn = this.cancelBtn.cloneNode(true);
        this.cancelBtn.parentNode.replaceChild(newCancelBtn, this.cancelBtn);
        this.cancelBtn = newCancelBtn;

        this.confirmBtn.addEventListener('click', () => {
            onConfirm();
            this.hide();
        });

        this.cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            this.hide();
        });
        
        // The main close button should also trigger the onCancel callback
        this.modal.querySelector('.info-modal-close').onclick = () => {
            if (onCancel) onCancel();
            this.hide();
        };

        super.show();
    }
}