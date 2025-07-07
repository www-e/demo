// js/pages/schedule-admin/event-handlers.js
import { showConfirmation, showToast } from './ui-helpers.js';
import * as ScheduleService from '../../services/schedule-service.js';
import { deleteAndReassignStudents } from '../../services/teacher-service.js';
import { deleteAndReassignMaterial } from '../../services/material-service.js';

export function createEventHandlers({ elements, state, timeBuilder, teacherModal, materialModal, formManager, loadAndRenderAllData }) {

    function handleEditGroup(dataset) {
        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: 'بدء التعديل', body: `سيتم تحميل بيانات مجموعة "${dataset.group}" للتعديل.`,
            confirmText: 'نعم، ابدأ', btnClass: 'btn-info',
            onConfirm: () => {
                state.setEditingGroup(dataset);
                const { grade, group, teacher, material } = dataset;
                const groupSchedules = state.getSchedules().filter(s => 
                    s.grade === grade && 
                    s.group_name === group && 
                    (s.teacher_id === teacher || (s.teacher_id === null && !teacher)) &&
                    (s.material_id === material || (s.material_id === null && !material))
                );
                
                elements.formTitle.textContent = `تعديل مجموعة: ${group}`;
                elements.gradeSelect.value = grade;
                elements.teacherSelect.value = teacher || '';
                elements.materialSelect.value = material || '';
                
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
                    await loadAndRenderAllData();
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
        
        if (!elements.gradeSelect.value || !groupName || timeSlots.length === 0) {
            return showToast('يرجى ملء جميع الحقول.', 'error');
        }

        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: state.getEditingGroup() ? 'تأكيد التعديلات' : 'تأكيد الإضافة',
            body: `هل أنت متأكد من حفظ مجموعة "${groupName}"؟`,
            confirmText: 'نعم، حفظ', btnClass: 'btn-primary',
            onConfirm: async () => {
                const records = timeSlots.map(time => ({ 
                    grade: elements.gradeSelect.value, 
                    group_name: groupName, 
                    time_slot: time,
                    teacher_id: teacherId,
                    material_id: materialId
                }));
                
                try {
                    const isEditing = !!state.getEditingGroup();
                    await ScheduleService.saveScheduleWithTeacherAndMaterial(records, isEditing, state.getEditingGroup());
                    showToast(isEditing ? 'تم تعديل المجموعة!' : 'تمت إضافة المجموعة!', 'success');
                    formManager.resetForm(state.setEditingGroup);
                    await loadAndRenderAllData();
                } catch (error) { 
                    showToast(error.code === '23505' ? 'خطأ: أحد هذه المواعيد موجود بالفعل.' : 'حدث خطأ: ' + error.message, 'error'); 
                }
            }
        });
    }

    function handleAddTeacher() {
        teacherModal.show(state.getTeachers());
    }

    function setupTeacherModalListeners() {
        teacherModal.onSaved(async () => {
            await loadAndRenderAllData();
        });

        teacherModal.onDelete(async (teacher) => {
            teacherModal.hide();
            showConfirmation({
                modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
                title: 'تأكيد الحذف',
                body: `هل أنت متأكد من حذف المدرس "${teacher.name}"؟ سيتم نقل كل الطلاب والمجموعات المسجلة لديه إلى "عام". لا يمكن التراجع عن هذا الإجراء.`,
                confirmText: 'نعم، حذف وأعد التعيين',
                btnClass: 'btn-danger',
                onConfirm: async () => {
                    try {
                        await deleteAndReassignStudents(teacher.id);
                        showToast('تم حذف المدرس ونقل الطلاب والمجموعات بنجاح.', 'success');
                        await loadAndRenderAllData();
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
        materialModal.onSaved(async () => {
            await loadAndRenderAllData();
        });

        materialModal.onDelete(async (material) => {
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