// js/pages/schedule-admin/ui-manager.js
import { populateSelect } from './ui-helpers.js';

export function createFormManager(elements, timeBuilder) {

    function populateTeacherSelects(teachers) {
        // FIXED: Disable inactive teachers in the form dropdown
        const formOptions = teachers.map(teacher => ({ 
            v: teacher.id, 
            t: teacher.name,
            disabled: !teacher.is_active // Add a disabled flag for inactive teachers
        }));
        populateSelect(elements.teacherSelect, formOptions, 'اختر المدرس...');
    }

    function populateMaterialSelects(materials) {
        const materialOptions = materials.map(material => ({ v: material.id, t: material.name }));
        populateSelect(elements.materialSelect, materialOptions, 'اختر المادة...');
    }
    
    function populateCenterSelects(centers) {
        const centerOptions = centers.map(center => ({ v: center.id, t: center.name }));
        populateSelect(elements.centerSelect, centerOptions, 'اختر المركز...');
    }

    function resetForm(setEditingGroup) {
        setEditingGroup(null);
        elements.form.reset();
        timeBuilder.clear();
        elements.formTitle.textContent = 'إضافة مجموعة جديدة';
        elements.saveBtn.innerHTML = '<i class="fas fa-plus"></i> حفظ المجموعة';
        elements.cancelBtn.style.display = 'none';
        elements.groupNameCustomInput.style.display = 'none';
    }
    
    function initializeBaseUIDropdowns() {
        populateSelect(elements.gradeSelect, [ { v: 'first', t: 'الأول الثانوي'}, { v: 'second', t: 'الثاني الثانوي'}, { v: 'third', t: 'الثالث الثانوي'}], 'اختر الصف...');
        populateSelect(elements.groupNameSelect, [ {v: "السبت و الثلاثاء", t: "السبت و الثلاثاء"}, {v: "الأحد و الأربعاء", t: "الأحد و الأربعاء"}, {v: "الاثنين و الخميس", t: "الاثنين و الخميس"}, {v: "السبت و الثلاثاء و الخميس", t: "السبت و الثلاثاء و الخميس"}, {v: "الأحد و الأربعاء و الجمعة", t: "الأحد و الأربعاء و الجمعة"}, {v: "custom", t: "أخرى"} ], "اختر أيام المجموعة...");
    }

    return {
        populateTeacherSelects,
        populateMaterialSelects,
        populateCenterSelects,
        resetForm,
        initializeBaseUIDropdowns
    };
}