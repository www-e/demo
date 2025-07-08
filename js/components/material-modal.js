// js/components/material-modal.js
import { createMaterial, updateMaterial } from '../services/material-service.js';

// This helper function should be defined or imported if not globally available
function showToast(message, type = 'success') {
    // Implementation depends on your project's toast notification system
    console.log(`Toast (${type}): ${message}`);
    // Example using Bootstrap Toasts if available
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer && window.bootstrap) {
        const toastTypeClasses = { success: 'bg-success', error: 'bg-danger', info: 'bg-info', warning: 'bg-warning' };
        const headerClass = toastTypeClasses[type] || 'bg-secondary';
        const toastHTML = `<div class="toast" role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-header text-white ${headerClass}"><strong class="me-auto">${type === 'error' ? 'خطأ' : 'إشعار'}</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button></div><div class="toast-body">${message}</div></div>`;
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const newToast = toastContainer.lastElementChild;
        const bsToast = new bootstrap.Toast(newToast, { delay: 5000 });
        bsToast.show();
        newToast.addEventListener('hidden.bs.toast', () => newToast.remove());
    }
}

export class MaterialModal {
    constructor() {
        this.modal = null;
        this.isEditMode = false;
        this.currentMaterialId = null;
        this.onMaterialSaved = null;
        this.onMaterialDelete = null;
        this.createModal();
    }

    createModal() {
        const modalHTML = `
        <div class="modal fade" id="materialModal" tabindex="-1" aria-labelledby="materialModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="materialModalLabel">إدارة المواد الدراسية</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="materialListContainer" class="mb-4">
                           <p class="text-center text-muted">جاري تحميل قائمة المواد...</p>
                        </div>
                        <hr/>
                        <h6 id="materialFormTitle" class="mt-4">إضافة مادة جديدة</h6>
                        <form id="materialForm" class="d-flex align-items-center gap-2">
                            <input type="text" class="form-control" id="materialName" name="name" required placeholder="اسم المادة">
                            <button type="submit" class="btn btn-primary" id="saveMaterialBtn" style="white-space: nowrap;">
                                <i class="fas fa-plus"></i> إضافة
                            </button>
                             <button type="button" class="btn btn-secondary" id="cancelEditMaterialBtn" style="display: none; white-space: nowrap;">إلغاء</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = new bootstrap.Modal(document.getElementById('materialModal'));
        this.setupEventListeners();
    }
    
    renderMaterialsList(materials) {
        const container = document.getElementById('materialListContainer');
        if (!materials || materials.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">لا توجد مواد حالياً.</p>';
            return;
        }

        container.innerHTML = `
            <ul class="list-group">
                ${materials.map(material => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${material.name}</span>
                        ${!material.name.includes('عامة') ? `
                        <div>
                            <button class="btn btn-sm btn-outline-info" data-action="edit" data-id="${material.id}" data-name="${material.name}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${material.id}" data-name="${material.name}"><i class="fas fa-trash"></i></button>
                        </div>
                        ` : ''}
                    </li>
                `).join('')}
            </ul>`;
            
        container.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                const material = { id, name };

                if (action === 'edit') {
                    this.handleEdit(material);
                } else if (action === 'delete') {
                    if (this.onMaterialDelete) this.onMaterialDelete(material);
                }
            });
        });
    }

    setupEventListeners() {
        const form = document.getElementById('materialForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        document.getElementById('cancelEditMaterialBtn').addEventListener('click', () => this.resetForm());
    }

    handleEdit(material) {
        this.isEditMode = true;
        this.currentMaterialId = material.id;
        document.getElementById('materialFormTitle').textContent = `تعديل المادة: ${material.name}`;
        document.getElementById('materialName').value = material.name;
        document.getElementById('saveMaterialBtn').innerHTML = '<i class="fas fa-save"></i> تحديث';
        document.getElementById('cancelEditMaterialBtn').style.display = 'inline-block';
    }

    resetForm() {
        this.isEditMode = false;
        this.currentMaterialId = null;
        document.getElementById('materialForm').reset();
        document.getElementById('materialFormTitle').textContent = 'إضافة مادة جديدة';
        document.getElementById('saveMaterialBtn').innerHTML = '<i class="fas fa-plus"></i> إضافة';
        document.getElementById('cancelEditMaterialBtn').style.display = 'none';
    }

    async handleSave() {
        const nameInput = document.getElementById('materialName');
        const name = nameInput.value.trim();
        if (name.length < 2) {
            showToast('اسم المادة يجب أن يكون حرفين على الأقل', 'error');
            return;
        }

        const saveBtn = document.getElementById('saveMaterialBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            let result;
            if (this.isEditMode) {
                result = await updateMaterial(this.currentMaterialId, { name });
                showToast('تم تحديث المادة بنجاح', 'success');
            } else {
                result = await createMaterial({ name });
                showToast('تمت إضافة المادة بنجاح', 'success');
            }
            this.resetForm();
            if (this.onMaterialSaved) this.onMaterialSaved(result); // Pass the saved material data back
        } catch (error) {
            const errorMessage = error.code === '23505' ? 'اسم المادة موجود بالفعل' : 'حدث خطأ أثناء الحفظ';
            showToast(errorMessage, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }

    show(materials) {
        this.renderMaterialsList(materials);
        this.resetForm();
        this.modal.show();
    }
    
    hide() {
        this.modal.hide();
    }

    onSaved(callback) {
        this.onMaterialSaved = callback;
    }
    
    onDelete(callback) {
        this.onMaterialDelete = callback;
    }
}
