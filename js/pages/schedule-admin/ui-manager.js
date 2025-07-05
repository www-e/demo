// js/pages/schedule-admin/ui-manager.js
import { populateSelect } from './ui-helpers.js';

export function createFormManager(elements, timeBuilder) {

    function populateTeacherSelects(teachers) {
        const generalTeacher = teachers.find(t => t.name.includes('عام'));
        const otherTeachers = teachers.filter(t => !t.name.includes('عام'));

        const formOptions = [
            { v: generalTeacher ? generalTeacher.id : '', t: 'عام (متاح للجميع)' },
            ...otherTeachers.map(teacher => ({ v: teacher.id, t: teacher.name }))
        ];
        populateSelect(elements.teacherSelect, formOptions, 'اختر المدرس...');

        const filterOptions = [
             { v: 'all', t: 'كل المدرسين' },
            ...teachers.map(teacher => ({ v: teacher.id, t: teacher.name }))
        ];
        if (elements.teacherFilterSelect) {
            populateSelect(elements.teacherFilterSelect, filterOptions, 'فلترة بالمدرس...');
        }
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
        resetForm,
        initializeBaseUIDropdowns
    };
}