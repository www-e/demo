// js/components/teacher-modal.js
import { createTeacher, updateTeacher, fetchTeachers } from '../services/teacher-service.js';

export class TeacherModal {
    constructor() {
        this.modal = null;
        this.isEditMode = false;
        this.currentTeacherId = null;
        this.onTeacherSaved = null;
        this.onTeacherDelete = null; // Callback for delete
        this.createModal();
    }

    createModal() {
        const modalHTML = `
        <div class="modal fade" id="teacherModal" tabindex="-1" aria-labelledby="teacherModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="teacherModalLabel">إدارة المدرسين</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Teacher List -->
                        <div id="teacherListContainer" class="mb-4">
                           <p class="text-center text-muted">جاري تحميل قائمة المدرسين...</p>
                        </div>
                        <hr/>
                        <!-- Add/Edit Form -->
                        <h6 id="teacherFormTitle" class="mt-4">إضافة مدرس جديد</h6>
                        <form id="teacherForm" class="d-flex align-items-center gap-2">
                            <input type="text" class="form-control" id="teacherName" name="name" required placeholder="اسم المدرس">
                            <button type="submit" class="btn btn-primary" id="saveTeacherBtn" style="white-space: nowrap;">
                                <i class="fas fa-plus"></i> إضافة
                            </button>
                             <button type="button" class="btn btn-secondary" id="cancelEditBtn" style="display: none; white-space: nowrap;">إلغاء</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('teacherModal'));
        this.setupEventListeners();
    }
    
    renderTeachersList(teachers) {
        const container = document.getElementById('teacherListContainer');
        if (!teachers || teachers.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">لا يوجد مدرسين حالياً.</p>';
            return;
        }

        container.innerHTML = `
            <ul class="list-group">
                ${teachers.map(teacher => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${teacher.name}</span>
                        ${!teacher.name.includes('عام') ? `
                        <div>
                            <button class="btn btn-sm btn-outline-info" data-action="edit" data-id="${teacher.id}" data-name="${teacher.name}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${teacher.id}" data-name="${teacher.name}"><i class="fas fa-trash"></i></button>
                        </div>
                        ` : ''}
                    </li>
                `).join('')}
            </ul>`;
            
        // Add event listeners for new buttons
        container.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                const teacher = { id, name };

                if (action === 'edit') {
                    this.handleEdit(teacher);
                } else if (action === 'delete') {
                    if (this.onTeacherDelete) this.onTeacherDelete(teacher);
                }
            });
        });
    }

    setupEventListeners() {
        const form = document.getElementById('teacherForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => this.resetForm());
    }

    handleEdit(teacher) {
        this.isEditMode = true;
        this.currentTeacherId = teacher.id;
        document.getElementById('teacherFormTitle').textContent = `تعديل المدرس: ${teacher.name}`;
        document.getElementById('teacherName').value = teacher.name;
        document.getElementById('saveTeacherBtn').innerHTML = '<i class="fas fa-save"></i> تحديث';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
    }

    resetForm() {
        this.isEditMode = false;
        this.currentTeacherId = null;
        document.getElementById('teacherForm').reset();
        document.getElementById('teacherFormTitle').textContent = 'إضافة مدرس جديد';
        document.getElementById('saveTeacherBtn').innerHTML = '<i class="fas fa-plus"></i> إضافة';
        document.getElementById('cancelEditBtn').style.display = 'none';
    }

    async handleSave() {
        const nameInput = document.getElementById('teacherName');
        const name = nameInput.value.trim();
        if (name.length < 2) {
            showToast('اسم المدرس يجب أن يكون حرفين على الأقل', 'error');
            return;
        }

        const saveBtn = document.getElementById('saveTeacherBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            if (this.isEditMode) {
                await updateTeacher(this.currentTeacherId, { name });
                showToast('تم تحديث المدرس بنجاح', 'success');
            } else {
                await createTeacher({ name });
                showToast('تم إضافة المدرس بنجاح', 'success');
            }
            this.resetForm();
            if (this.onTeacherSaved) this.onTeacherSaved();
        } catch (error) {
            const errorMessage = error.code === '23505' ? 'اسم المدرس موجود بالفعل' : 'حدث خطأ أثناء الحفظ';
            showToast(errorMessage, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    show(teachers) {
        this.renderTeachersList(teachers);
        this.resetForm();
        this.modal.show();
    }
    
    hide() {
        this.modal.hide();
    }

    onSaved(callback) {
        this.onTeacherSaved = callback;
    }
    
    onDelete(callback) {
        this.onTeacherDelete = callback;
    }
}

// Helper function, assuming it's not exported elsewhere
function showToast(message, type = 'success') {
    const toastTypeClasses = { success: 'bg-success', error: 'bg-danger', info: 'bg-info', warning: 'bg-warning' };
    const headerClass = toastTypeClasses[type] || 'bg-secondary';
    const toastHTML = `<div class="toast" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-header text-white ${headerClass}"><strong class="me-auto">${type === 'error' ? 'خطأ' : 'إشعار'}</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button></div><div class="toast-body">${message}</div></div>`;
    let container = document.getElementById('toastContainer');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', toastHTML);
    const newToast = container.lastElementChild;
    const bsToast = new bootstrap.Toast(newToast, { delay: 5000 });
    bsToast.show();
    newToast.addEventListener('hidden.bs.toast', () => newToast.remove());
}