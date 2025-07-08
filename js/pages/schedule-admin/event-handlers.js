// js/pages/schedule-admin/event-handlers.js
import { showConfirmation, showToast } from './ui-helpers.js';
import * as ScheduleService from '../../services/schedule-service.js';
import { deleteAndReassign as deleteAndReassignTeacher } from '../../services/teacher-service.js';
import { deleteAndReassignMaterial } from '../../services/material-service.js';

export function createEventHandlers({ elements, state, timeBuilder, teacherModal, materialModal, formManager, tableHandler, loadAndRenderAllData }) {
    
    // This function remains the same.
    function handleEditGroup(dataset) {
        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: 'بدء التعديل', body: `سيتم تحميل بيانات مجموعة "${dataset.group}" للتعديل.`,
            confirmText: 'نعم، ابدأ', btnClass: 'btn-info',
            onConfirm: () => {
                state.setEditingGroup(dataset);
                const { grade, group, teacher, material, center } = dataset;
                const groupSchedules = state.getSchedules().filter(s => 
                    s.grade === grade && 
                    s.group_name === group &&
                    s.center_id === center &&
                    (s.teacher_id === teacher || (s.teacher_id === null && !teacher)) &&
                    (s.material_id === material || (s.material_id === null && !material))
                );
                
                elements.formTitle.textContent = `تعديل مجموعة: ${group}`;
                elements.gradeSelect.value = grade;
                elements.teacherSelect.value = teacher || '';
                elements.materialSelect.value = material || '';
                elements.centerSelect.value = center || '';
                
                const standardGroup = Array.from(elements.groupNameSelect.options).find(opt => opt.value === group);
                elements.groupNameSelect.value = standardGroup ? group : 'custom';
                elements.groupNameCustomInput.style.display = standardGroup ? 'none' : 'block';
                if (!standardGroup) elements.groupNameCustomInput.value = group;
                
                const timeSlots = groupSchedules.map(s => s.time_slot);
                timeBuilder.setTimes(timeSlots);
                
                if (timeSlots.length > 0) timeBuilder.prefill(timeSlots[0]);
                
                elements.saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التعديلات';
                elements.cancelBtn.style.display = 'inline-block';
                window.scrollTo({ top: elements.form.offsetTop - 20, behavior: 'smooth' });
            }
        });
    }

    // This function remains the same. It correctly uses the smart update.
    async function handleDelete(id) {
        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: 'تأكيد الحذف', body: 'هل أنت متأكد من الحذف النهائي لهذا الموعد؟',
            confirmText: 'نعم، حذف', btnClass: 'btn-danger',
            onConfirm: async () => {
                try {
                    await ScheduleService.deleteScheduleById(id);
                    showToast('تم حذف الموعد بنجاح!', 'delete');
                    
                    const currentSchedules = state.getSchedules();
                    const updatedSchedules = currentSchedules.filter(s => s.id !== id);
                    state.setSchedules(updatedSchedules);
                    tableHandler.render(updatedSchedules);

                } catch (error) { showToast('خطأ في الحذف: ' + error.message, 'error'); }
            }
        });
    }

    // This is the function that needed the fix.
    // It now correctly uses the smart update logic and does NOT call loadAndRenderAllData.
    async function handleSave(e) {
        e.preventDefault();
        const groupName = elements.groupNameSelect.value === 'custom' ? elements.groupNameCustomInput.value.trim() : elements.groupNameSelect.value;
        const timeSlots = timeBuilder.getTimes();
        const teacherId = elements.teacherSelect.value || null;
        const materialId = elements.materialSelect.value || null;
        const centerId = elements.centerSelect.value || null;
        
        if (!elements.gradeSelect.value || !groupName || timeSlots.length === 0 || !centerId) {
            return showToast('يرجى ملء جميع الحقول (المركز، الصف، المادة، المدرس، المجموعة، والمواعيد).', 'error');
        }

        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: state.getEditingGroup() ? 'تأكيد التعديلات' : 'تأكيد الإضافة',
            body: `هل أنت متأكد من حفظ مجموعة "${groupName}"؟`,
            confirmText: 'نعم، حفظ', btnClass: 'btn-primary',
            onConfirm: async () => {
                const saveBtn = elements.saveBtn;
                const originalBtnHTML = saveBtn.innerHTML;
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جار الحفظ...';

                try {
                    const recordsToSave = timeSlots.map(time => ({ 
                        grade: elements.gradeSelect.value, 
                        group_name: groupName, 
                        time_slot: time,
                        teacher_id: teacherId,
                        material_id: materialId,
                        center_id: centerId
                    }));

                    const isEditing = !!state.getEditingGroup();
                    const newSchedules = await ScheduleService.saveSchedule(recordsToSave, isEditing, state.getEditingGroup());
                    
                    showToast(isEditing ? 'تم تعديل المجموعة!' : 'تمت إضافة المجموعة!', 'success');
                    
                    let allSchedules = state.getSchedules();

                    if (isEditing) {
                        const { group, grade, teacher, material, center } = state.getEditingGroup();
                        allSchedules = allSchedules.filter(s => 
                            !(s.group_name === group && s.grade === grade && s.teacher_id === (teacher || null) && s.material_id === (material || null) && s.center_id === (center || null))
                        );
                    }
                    
                    const updatedSchedules = [...allSchedules, ...newSchedules];
                    state.setSchedules(updatedSchedules);
                    
                    tableHandler.render(updatedSchedules);
                    formManager.resetForm(state.setEditingGroup);

                } catch (error) { 
                    showToast(error.message.includes('unique_schedule_time') ? 'خطأ: أحد هذه المواعيد موجود بالفعل بنفس المواصفات.' : 'حدث خطأ: ' + error.message, 'error'); 
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalBtnHTML;
                }
            }
        });
    }

    // This function remains the same.
    function handleAddTeacher() {
        teacherModal.show(state.getTeachers());
    }

    // This function and its 'onDelete' part remain the same. The 'onSaved' part is corrected.
    function setupTeacherModalListeners() {
        teacherModal.onSaved(async (updatedTeacher) => {
            teacherModal.hide();
            const teachers = state.getTeachers();
            const index = teachers.findIndex(t => t.id === updatedTeacher.id);
            if (index > -1) {
                teachers[index] = updatedTeacher;
            } else {
                teachers.push(updatedTeacher);
            }
            state.setTeachers(teachers);
            
            formManager.populateTeacherSelects(state.getTeachers());
            tableHandler.populateFilterDropdowns(state.getSchedules(), state.getTeachers(), state.getMaterials(), state.getCenters());
            // No full table render needed, just updating dropdowns is sufficient here.
        });

        teacherModal.onDelete(async (teacher) => {
            // Reload is acceptable here for this infrequent, complex operation.
            teacherModal.hide();
            showConfirmation({
                modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
                title: 'تأكيد الحذف',
                body: `هل أنت متأكد من حذف المدرس "${teacher.name}"؟ سيتم نقل كل الطلاب والمجموعات المسجلة لديه إلى "عام". لا يمكن التراجع عن هذا الإجراء.`,
                confirmText: 'نعم، حذف وأعد التعيين',
                btnClass: 'btn-danger',
                onConfirm: async () => {
                    try {
                        await deleteAndReassignTeacher(teacher.id);
                        showToast('تم حذف المدرس ونقل الطلاب والمجموعات بنجاح.', 'success');
                        await loadAndRenderAllData();
                    } catch (error) {
                        showToast('خطأ في الحذف: ' + error.message, 'error');
                    }
                }
            });
        });
    }

    // This function remains the same.
    function handleAddMaterial() {
        materialModal.show(state.getMaterials());
    }

    // This function and its 'onDelete' part remain the same. The 'onSaved' part is corrected.
    function setupMaterialModalListeners() {
        materialModal.onSaved(async (updatedMaterial) => {
            materialModal.hide();
            const materials = state.getMaterials();
            const index = materials.findIndex(m => m.id === updatedMaterial.id);
            if (index > -1) {
                materials[index] = updatedMaterial;
            } else {
                materials.push(updatedMaterial);
            }
            state.setMaterials(materials);

            formManager.populateMaterialSelects(state.getMaterials());
            tableHandler.populateFilterDropdowns(state.getSchedules(), state.getTeachers(), state.getMaterials(), state.getCenters());
             // No full table render needed, just updating dropdowns is sufficient here.
        });

        materialModal.onDelete(async (material) => {
             // Reload is acceptable here.
            materialModal.hide();
            showConfirmation({
                modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
                title: 'تأكيد الحذف',
                body: `هل أنت متأكد من حذف المادة "${material.name}"؟ سيتم نقل كل المجموعات المسجلة بها إلى "عامة". لا يمكن التراجع عن هذا الإجراء.`,
                confirmText: 'نعم، حذف وأعد التعيين',
                btnClass: 'btn-danger',
                onConfirm: async () => {
                    try {
                        await deleteAndReassignMaterial(material.id);
                        showToast('تم حذف المادة ونقل المجموعات بنجاح.', 'success');
                        await loadAndRenderAllData();
                    } catch (error) {
                        showToast('خطأ في الحذف: ' + error.message, 'error');
                    }
                }
            });
        });
    }

    return {
        handleEditGroup,
        handleDelete,
        handleSave,
        handleAddTeacher,
        setupTeacherModalListeners,
        handleAddMaterial,
        setupMaterialModalListeners,
    };
}