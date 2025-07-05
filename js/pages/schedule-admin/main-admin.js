// js/pages/schedule-admin/main-admin.js
import { initializeUpdateModal } from '../../components/update-modal.js';
import { TeacherModal } from '../../components/teacher-modal.js'; // ADDED: Import teacher modal
import { elements } from './dom-elements.js';
import { showToast, showConfirmation, showLoader, populateSelect } from './ui-helpers.js';
import { createTimeBuilder } from './time-builder.js';
import { createTableHandler } from './table-handler.js';
import { fetchTeachers } from '../../services/teacher-service.js'; // ADDED: Import teacher service
import * as ScheduleService from '../../services/schedule-service.js';

// --- Page Loader Logic ---
const pageLoader = document.getElementById('page-loader');
document.querySelectorAll('.nav-link-item').forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.hostname === window.location.hostname) {
            pageLoader.classList.remove('hidden');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    initializeUpdateModal();
    if(pageLoader) pageLoader.classList.add('hidden');

    // --- State ---
    let allSchedules = [];
    let allTeachers = []; // ADDED: Teachers state
    let isEditingGroup = null;

    // ADDED: Teacher Modal
    const teacherModal = new TeacherModal();
    teacherModal.onSaved(() => {
        loadTeachers();
    });

    // --- Module Instances ---
    const timeBuilder = createTimeBuilder(elements);
    const tableHandler = createTableHandler(elements, handleEditGroup, handleDelete);

    // --- Core Functions ---
    async function loadSchedules() {
        showLoader(elements.loader, elements.schedulesTableContainer, true);
        try {
            allSchedules = await ScheduleService.fetchSchedulesWithTeachers(); // CHANGED: Use teacher-aware fetch
            tableHandler.render(allSchedules);
            tableHandler.populateGroupFilter(allSchedules);
        } catch (error) {
            showToast('خطأ في تحميل المواعيد: ' + error.message, 'error');
        } finally {
            showLoader(elements.loader, elements.schedulesTableContainer, false);
        }
    }

    // ADDED: Load Teachers function
    async function loadTeachers() {
        try {
            allTeachers = await fetchTeachers();
            populateTeacherSelect();
        } catch (error) {
            showToast('خطأ في تحميل المدرسين: ' + error.message, 'error');
        }
    }

    // ADDED: Populate teacher select
    function populateTeacherSelect() {
        const teacherOptions = [
            { v: '', t: 'عام (متاح للجميع)' },
            ...allTeachers.map(teacher => ({ v: teacher.id, t: teacher.name }))
        ];
        populateSelect(elements.teacherSelect, teacherOptions, 'اختر المدرس...');
    }
    
    function resetForm() {
        isEditingGroup = null;
        elements.form.reset();
        timeBuilder.clear();
        elements.formTitle.textContent = 'إضافة مجموعة جديدة';
        elements.saveBtn.innerHTML = '<i class="fas fa-plus"></i> حفظ المجموعة';
        elements.cancelBtn.style.display = 'none';
        elements.groupNameCustomInput.style.display = 'none';
    }

    // --- CRUD Handlers ---
    function handleEditGroup(dataset) {
        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: 'بدء التعديل', body: `سيتم تحميل بيانات مجموعة "${dataset.group}" للتعديل.`,
            confirmText: 'نعم، ابدأ', btnClass: 'btn-info',
            onConfirm: () => {
                isEditingGroup = dataset;
                const { grade, group, teacher } = dataset;
                const groupSchedules = allSchedules.filter(s => 
                    s.grade === grade && 
                    s.group_name === group && 
                    (s.teacher_id === teacher || (!s.teacher_id && !teacher))
                );
                
                elements.formTitle.textContent = `تعديل مجموعة: ${group}`;
                elements.gradeSelect.value = grade;
                elements.teacherSelect.value = teacher || ''; // ADDED: Set teacher value
                
                const standardGroup = Array.from(elements.groupNameSelect.options).find(opt => opt.value === group);
                elements.groupNameSelect.value = standardGroup ? group : 'custom';
                elements.groupNameCustomInput.style.display = standardGroup ? 'none' : 'block';
                if (!standardGroup) elements.groupNameCustomInput.value = group;
                
                timeBuilder.setTimes(groupSchedules.map(s => s.time_slot));
                
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
                    await loadSchedules();
                } catch (error) { showToast('خطأ في الحذف: ' + error.message, 'error'); }
            }
        });
    }

    async function handleSave(e) {
        e.preventDefault();
        const groupName = elements.groupNameSelect.value === 'custom' ? elements.groupNameCustomInput.value.trim() : elements.groupNameSelect.value;
        const timeSlots = timeBuilder.getTimes();
        const teacherId = elements.teacherSelect.value || null; // ADDED: Get teacher ID
        
        if (!elements.gradeSelect.value || !groupName || timeSlots.length === 0) {
            return showToast('يرجى ملء جميع الحقول.', 'error');
        }

        showConfirmation({
            modal: { instance: elements.confirmationModal, title: elements.confirmationModalTitle, body: elements.confirmationModalBody, confirmBtn: elements.confirmActionBtn },
            title: isEditingGroup ? 'تأكيد التعديلات' : 'تأكيد الإضافة',
            body: `هل أنت متأكد من حفظ مجموعة "${groupName}"؟`,
            confirmText: 'نعم، حفظ', btnClass: 'btn-primary',
            onConfirm: async () => {
                const records = timeSlots.map(time => ({ 
                    grade: elements.gradeSelect.value, 
                    group_name: groupName, 
                    time_slot: time,
                    teacher_id: teacherId // ADDED: Include teacher_id
                }));
                
                try {
                    // CHANGED: Use teacher-aware save function
                    await ScheduleService.saveScheduleWithTeacher(records, !!isEditingGroup, isEditingGroup);
                    showToast(isEditingGroup ? 'تم تعديل المجموعة!' : 'تمت إضافة المجموعة!', 'success');
                    resetForm();
                    await loadSchedules();
                } catch (error) { 
                    showToast(error.code === '23505' ? 'خطأ: أحد هذه المواعيد موجود بالفعل.' : 'حدث خطأ: ' + error.message, 'error'); 
                }
            }
        });
    }

    // ADDED: Handle Add Teacher
    function handleAddTeacher() {
        teacherModal.show();
    }

    // --- Initial Setup & Event Listeners ---
    populateSelect(elements.gradeSelect, [ 
        { v: 'first', t: 'الأول الثانوي'}, 
        { v: 'second', t: 'الثاني الثانوي'}, 
        { v: 'third', t: 'الثالث الثانوي'}
    ], 'اختر الصف...');
    
    populateSelect(elements.groupNameSelect, [ 
        {v: "السبت و الثلاثاء", t: "السبت و الثلاثاء"}, 
        {v: "الأحد و الأربعاء", t: "الأحد و الأربعاء"}, 
        {v: "الاثنين و الخميس", t: "الاثنين و الخميس"}, 
        {v: "السبت و الثلاثاء و الخميس", t: "السبت و الثلاثاء و الخميس"}, 
        {v: "الأحد و الأربعاء و الجمعة", t: "الأحد و الأربعاء و الجمعة"}, 
        {v: "custom", t: "أخرى"} 
    ], "اختر أيام المجموعة...");
    
    timeBuilder.setup();
    
    elements.groupNameSelect.addEventListener('change', () => {
        elements.groupNameCustomInput.style.display = (elements.groupNameSelect.value === 'custom') ? 'block' : 'none';
    });
    
    elements.form.addEventListener('submit', handleSave);
    elements.cancelBtn.addEventListener('click', resetForm);
    elements.addTeacherBtn.addEventListener('click', handleAddTeacher); // ADDED: Teacher button event
    
    elements.gradeFiltersContainer.addEventListener('click', (e) => tableHandler.handleGradeFilterClick(e, allSchedules));
    elements.groupFilterSelect.addEventListener('change', () => tableHandler.render(allSchedules));
    
    // CHANGED: Load both schedules and teachers
    Promise.all([loadSchedules(), loadTeachers()]);
});
