// js/components/teacher-modal.js
import { createTeacher, updateTeacher, fetchTeachers } from '../services/teacher-service.js';

export class TeacherModal {
    constructor() {
        this.modal = null;
        this.isEditMode = false;
        this.currentTeacherId = null;
        this.onTeacherSaved = null;
        this.createModal();
    }

    createModal() {
        const modalHTML = `
        <div class="modal fade" id="teacherModal" tabindex="-1" aria-labelledby="teacherModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="teacherModalLabel">إضافة مدرس جديد</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="teacherForm">
                            <div class="mb-3">
                                <label for="teacherName" class="form-label">اسم المدرس</label>
                                <input type="text" class="form-control" id="teacherName" name="name" required>
                                <div class="invalid-feedback">يرجى إدخال اسم المدرس</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" id="saveTeacherBtn">
                            <i class="fas fa-save"></i> حفظ
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('teacherModal'));
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('teacherForm');
        const saveBtn = document.getElementById('saveTeacherBtn');
        const nameInput = document.getElementById('teacherName');

        saveBtn.addEventListener('click', () => this.handleSave());
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // Real-time validation
        nameInput.addEventListener('input', () => {
            this.validateForm();
        });
    }

    validateForm() {
        const nameInput = document.getElementById('teacherName');
        const saveBtn = document.getElementById('saveTeacherBtn');
        
        const isValid = nameInput.value.trim().length >= 2;
        
        if (isValid) {
            nameInput.classList.remove('is-invalid');
            saveBtn.disabled = false;
        } else {
            nameInput.classList.add('is-invalid');
            saveBtn.disabled = true;
        }
        
        return isValid;
    }

    async handleSave() {
        if (!this.validateForm()) return;

        const saveBtn = document.getElementById('saveTeacherBtn');
        const originalText = saveBtn.innerHTML;
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

        try {
            const formData = new FormData(document.getElementById('teacherForm'));
            const teacherData = {
                name: formData.get('name').trim()
            };

            let result;
            if (this.isEditMode) {
                result = await updateTeacher(this.currentTeacherId, teacherData);
            } else {
                result = await createTeacher(teacherData);
            }

            this.modal.hide();
            
            if (this.onTeacherSaved) {
                this.onTeacherSaved(result);
            }

            this.showToast(
                this.isEditMode ? 'تم تحديث المدرس بنجاح' : 'تم إضافة المدرس بنجاح',
                'success'
            );

        } catch (error) {
            console.error('Error saving teacher:', error);
            let errorMessage = 'حدث خطأ أثناء الحفظ';
            
            if (error.code === '23505') {
                errorMessage = 'اسم المدرس موجود بالفعل';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    show(teacherData = null) {
        this.isEditMode = !!teacherData;
        this.currentTeacherId = teacherData?.id || null;

        const modalTitle = document.getElementById('teacherModalLabel');
        const nameInput = document.getElementById('teacherName');
        const saveBtn = document.getElementById('saveTeacherBtn');

        if (this.isEditMode) {
            modalTitle.textContent = 'تعديل المدرس';
            nameInput.value = teacherData.name;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> تحديث';
        } else {
            modalTitle.textContent = 'إضافة مدرس جديد';
            nameInput.value = '';
            saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
        }

        // Reset validation state
        nameInput.classList.remove('is-invalid');
        saveBtn.disabled = false;

        this.modal.show();
        
        // Focus on name input after modal is shown
        document.getElementById('teacherModal').addEventListener('shown.bs.modal', () => {
            nameInput.focus();
        }, { once: true });
    }

    hide() {
        this.modal.hide();
    }

    onSaved(callback) {
        this.onTeacherSaved = callback;
    }

    showToast(message, type = 'success') {
        const toastTypeClasses = { 
            success: 'bg-success', 
            error: 'bg-danger', 
            info: 'bg-info', 
            warning: 'bg-warning' 
        };
        const headerClass = toastTypeClasses[type] || 'bg-secondary';
        
        const toastHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header text-white ${headerClass}">
                    <strong class="me-auto">${type === 'error' ? 'خطأ' : 'إشعار'}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">${message}</div>
            </div>`;
        
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1100';
            document.body.appendChild(container);
        }
        
        container.insertAdjacentHTML('beforeend', toastHTML);
        const newToast = container.lastElementChild;
        const bsToast = new bootstrap.Toast(newToast, { delay: type === 'error' ? 6000 : 4000 });
        bsToast.show();
        newToast.addEventListener('hidden.bs.toast', () => newToast.remove());
    }
}
