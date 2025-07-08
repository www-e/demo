// js/pages/schedule-admin/event-handlers.js
import { showConfirmation, showToast } from './ui-helpers.js';
import * as ScheduleService from '../../services/schedule-service.js';
import { deleteAndReassign as deleteAndReassignTeacher } from '../../services/teacher-service.js';
import { deleteAndReassignMaterial } from '../../services/material-service.js';

export function createEventHandlers({ elements, state, timeBuilder, teacherModal, materialModal, formManager, tableHandler, loadAndRenderAllData }) {
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

    async function handleDelete(id) {
        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: 'تأكيد الحذف', body: 'هل أنت متأكد من الحذف النهائي لهذا الموعد؟',
            confirmText: 'نعم، حذف', btnClass: 'btn-danger',
            onConfirm: async () => {
                try {
                    await ScheduleService.deleteScheduleById(id);
                    showToast('تم حذف الموعد بنجاح!', 'delete');
                    
                    // SMART UPDATE: No API calls to refresh UI
                    const currentSchedules = state.getSchedules();
                    const updatedSchedules = currentSchedules.filter(s => s.id !== id);
                    state.setSchedules(updatedSchedules);
                    tableHandler.render(updatedSchedules); // Re-render the table with local data

                } catch (error) { showToast('خطأ في الحذف: ' + error.message, 'error'); }
            }
        });
    }

    async function handleSave(e) {
        e.preventDefault();
        const groupName = elements.groupNameSelect.value === 'custom' ? elements.groupNameCustomInput.value.trim() : elements.groupNameSelect.value;
        const timeSlots = timeBuilder.getTimes();
        const teacherId = elements.teacherSelect.value || null;
        const materialId = elements.materialSelect.value || null;
        const centerId = elements.centerSelect.value || null; // ADDED
        
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
                    
                    // The service now returns the newly created/updated records
                    const newSchedules = await ScheduleService.saveSchedule(recordsToSave, isEditing, state.getEditingGroup());
                    
                    showToast(isEditing ? 'تم تعديل المجموعة!' : 'تمت إضافة المجموعة!', 'success');
                    
                    // --- START OF SMART UPDATE LOGIC ---
                    let allSchedules = state.getSchedules();

                    if (isEditing) {
                        // Remove all old versions of the edited group
                        const { group, grade, teacher, material, center } = state.getEditingGroup();
                        allSchedules = allSchedules.filter(s => 
                            !(s.group_name === group && s.grade === grade && s.teacher_id === (teacher || null) && s.material_id === (material || null) && s.center_id === (center || null))
                        );
                    }
                    
                    // Add the new schedules to our local state
                    const updatedSchedules = [...allSchedules, ...newSchedules];
                    state.setSchedules(updatedSchedules);
                    
                    // Re-render UI with the fresh local data
                    tableHandler.render(updatedSchedules);
                    // --- END OF SMART UPDATE LOGIC ---

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

    function handleAddTeacher() {
        teacherModal.show(state.getTeachers());
    }

    function setupTeacherModalListeners() {
        teacherModal.onSaved(async (updatedTeacher) => { // The modal now gives us the new/updated teacher
            teacherModal.hide();
            // SMART UPDATE: No full reload. Just update the local state.
            const teachers = state.getTeachers();
            const index = teachers.findIndex(t => t.id === updatedTeacher.id);
            if (index > -1) {
                teachers[index] = updatedTeacher; // Update existing
            } else {
                teachers.push(updatedTeacher); // Add new
            }
            state.setTeachers(teachers);
            
            // Re-render only what's necessary
            formManager.populateTeacherSelects(state.getTeachers());
            tableHandler.render(state.getSchedules());
        });

        teacherModal.onDelete(async (teacher) => {
            // This action (safe delete) affects multiple tables, so a reload is still the safest and simplest approach here.
            // This is an acceptable trade-off as deleting a teacher is an infrequent operation.
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
                        await loadAndRenderAllData(); // Reload is acceptable here.
                    } catch (error) {
                        showToast('خطأ في الحذف: ' + error.message, 'error');
                    }
                }
            });
        });
    }

    function handleAddMaterial() {
        materialModal.show(state.getMaterials());
    }

    function setupMaterialModalListeners() {
        materialModal.onSaved(async (updatedMaterial) => { // The modal gives us the new/updated material
            materialModal.hide();
            // SMART UPDATE
            const materials = state.getMaterials();
            const index = materials.findIndex(m => m.id === updatedMaterial.id);
            if (index > -1) {
                materials[index] = updatedMaterial; // Update
            } else {
                materials.push(updatedMaterial); // Add
            }
            state.setMaterials(materials);

            // Re-render only what's necessary
            formManager.populateMaterialSelects(state.getMaterials());
            tableHandler.render(state.getSchedules());
        });

        materialModal.onDelete(async (material) => {
            // Safe delete also affects multiple tables, so a reload is the simplest, safest approach.
            // Deleting a material is also infrequent.
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
                        await loadAndRenderAllData(); // Reload is acceptable here.
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