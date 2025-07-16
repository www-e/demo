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

// NEW: A brand new, detailed success modal with pricing.
export class SuccessModal extends BaseModal {
    constructor() {
        const innerHTML = `
        <div class="info-modal-content">
            <button class="info-modal-close"><i class="fas fa-times"></i></button>
            <div class="info-modal-body">
                <div class="info-icon"><i class="fas fa-check-circle" style="color: var(--success);"></i></div>
                <h3 class="info-modal-title" style="color: var(--text-primary);">تم التسجيل بنجاح!</h3>
                <p class="text-secondary mb-4">تم تسجيل بياناتك. يرجى مراجعة التفاصيل .</p>

                <!-- Receipt Details -->
                <div class="receipt-info-group">
                    <div class="receipt-data-row">
                        <span class="receipt-label"><i class="fas fa-user"></i> اسم الطالب</span>
                        <span class="receipt-value" id="receipt-studentName"></span>
                    </div>
                    <div class="receipt-data-row">
                        <span class="receipt-label"><i class="fas fa-graduation-cap"></i> الصف والمادة</span>
                        <span class="receipt-value" id="receipt-gradeMaterial"></span>
                    </div>
                    <div class="receipt-data-row">
                        <span class="receipt-label"><i class="fas fa-users"></i> المجموعة</span>
                        <span class="receipt-value" id="receipt-groupTime"></span>
                    </div>
                </div>

                <!-- Pricing Details -->
                <div class="receipt-info-group mt-3">
                    <h4 class="receipt-title">تفاصيل الرسوم</h4>
                    <div class="receipt-data-row">
                        <span class="receipt-label">كرت السنتر</span>
                        <span class="receipt-value" id="receipt-centerFee"></span>
                    </div>
                    <div class="receipt-data-row">
                        <span class="receipt-label" id="receipt-materialFeeLabel">رسوم المادة</span>
                        <span class="receipt-value" id="receipt-materialFee"></span>
                    </div>
                    <div class="receipt-data-row total">
                        <span class="receipt-label">الإجمالي للدفع</span>
                        <span class="receipt-value" id="receipt-totalFee"></span>
                    </div>
                </div>
            </div>
        </div>`;
        super('success-modal', innerHTML);
    }

    show(data) {
        // Populate data
        document.getElementById('receipt-studentName').textContent = data.studentName;
        document.getElementById('receipt-gradeMaterial').textContent = `${data.gradeName} - ${data.materialName}`;
        document.getElementById('receipt-groupTime').textContent = `${data.groupName} - ${data.timeName}`;

        // Populate fees
        document.getElementById('receipt-centerFee').textContent = `${data.fees.centerFee} جنيه`;
        document.getElementById('receipt-materialFee').textContent = `${data.fees.materialFee} جنيه`;
        document.getElementById('receipt-totalFee').textContent = `${data.fees.total} جنيه`;

        // Handle specific labels for 2nd/3rd year
        const materialFeeLabel = document.getElementById('receipt-materialFeeLabel');
        if (data.grade === 'second' || data.grade === 'third') {
            materialFeeLabel.textContent = `رسوم (بحتة + تطبيقية)`;
        } else {
            materialFeeLabel.textContent = `رسوم المادة`;
        }

        super.show();
    }
}