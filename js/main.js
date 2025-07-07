// js/main.js
import { GRADE_NAMES } from './config.js';
import { submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchCenters } from './services/center-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';
import { validateForm, initRealtimeValidation } from './validation.js';

let allSchedules = [];

const convertTo12HourFormat = (time24) => {
    if (!time24) return 'غير محدد';
    return new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const gradeSelect = form.querySelector('#grade');
    const teacherSelect = form.querySelector('#teacher');
    const materialSelect = form.querySelector('#material');
    const centerSelect = form.querySelector('#center');
    const groupTimeSelect = form.querySelector('#groupTime');
    const submitBtn = form.querySelector('.submit-btn');

    const modals = {
        success: new SuccessModal(),
        thirdGrade: new ThirdGradeModal(),
        restricted: new RestrictedGroupsModal(),
        duplicate: new DuplicateRegistrationModal()
    };
    
    initDropdowns();
    initRealtimeValidation(form);
    
    try {
        const [schedules, teachers, materials, centers] = await Promise.all([
            loadSchedulesFromDB(),
            fetchTeachers(),
            fetchMaterials(),
            fetchCenters()
        ]);
        
        allSchedules = schedules;
        
        updateSelectOptions(centerSelect, centers.map(c => ({ value: c.id, text: c.name })), 'اختر المركز');
        updateAvailableOptions();

    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('حدث خطأ في تحميل البيانات الأساسية. يرجى تحديث الصفحة.');
    }
    
    console.log("Schedules and dropdown data loaded and ready.");

    function updateAvailableOptions() {
        let available = allSchedules;

        if (centerSelect.value) {
            available = available.filter(s => s.center_id === centerSelect.value);
        }
        const materialOptions = [...new Map(available.map(s => [s.material.id, s.material])).values()]
            .map(m => ({ value: m.id, text: m.name }));
        updateSelectOptions(materialSelect, materialOptions, 'اختر المادة');

        if (materialSelect.value) {
            available = available.filter(s => s.material_id === materialSelect.value);
        }
        const teacherOptions = [...new Map(available.map(s => [s.teacher.id, s.teacher])).values()]
            .filter(t => t.is_active)
            .map(t => ({ value: t.id, text: t.name }));
        updateSelectOptions(teacherSelect, teacherOptions, 'اختر المدرس');

        if (teacherSelect.value) {
            available = available.filter(s => s.teacher_id === teacherSelect.value);
        }
        const gradeOptions = [...new Set(available.map(s => s.grade))].map(g => ({
            value: g,
            text: GRADE_NAMES[g]
        }));
        updateSelectOptions(gradeSelect, gradeOptions, 'اختر الصف');

        if (gradeSelect.value) {
            available = available.filter(s => s.grade === gradeSelect.value);
        }
        const groupTimeOptions = available.map(s => ({
            value: `${s.group_name}|${s.time_slot}`,
            text: `${s.group_name} - ${convertTo12HourFormat(s.time_slot)}`
        }));
        
        updateSelectOptions(groupTimeSelect, groupTimeOptions, 'اختر المجموعة والموعد');
        groupTimeSelect.disabled = !groupTimeOptions.length;
    }

    centerSelect.addEventListener('change', updateAvailableOptions);
    materialSelect.addEventListener('change', updateAvailableOptions);
    teacherSelect.addEventListener('change', updateAvailableOptions);
    gradeSelect.addEventListener('change', updateAvailableOptions);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        if (!formData.get('group_time')) {
            alert('يرجى اختيار مجموعة وموعد قبل التسجيل.');
            const groupTimeContainer = document.getElementById('groupTimeContainer');
            groupTimeContainer.querySelector('.selected-option')?.classList.add('invalid');
            return;
        }

        if (!validateForm(form)) {
            console.log("Validation failed. Form submission stopped.");
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        
        try {
            const combinedValue = formData.get('group_time');
            const [days_group, time_slot] = combinedValue.split('|');
            const registrationData = {
                student_name: formData.get('student_name'),
                student_phone: formData.get('student_phone'),
                parent_phone: formData.get('parent_phone'),
                grade: formData.get('grade'),
                teacher_id: formData.get('teacher'),
                material_id: formData.get('material'),
                center_id: formData.get('center'),
                days_group: days_group,
                time_slot: time_slot
            };

            const result = await submitRegistration(registrationData);

            if (result.success) {
                modals.success.show({
                    studentName: registrationData.student_name,
                    gradeName: GRADE_NAMES[registrationData.grade],
                    groupName: registrationData.days_group,
                    timeName: convertTo12HourFormat(registrationData.time_slot),
                    teacherName: teacherSelect.options[teacherSelect.selectedIndex].text,
                    materialName: materialSelect.options[materialSelect.selectedIndex].text,
                    centerName: centerSelect.options[centerSelect.selectedIndex].text
                });
                
                form.reset();
                initDropdowns();
                updateAvailableOptions();
                document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

            } else {
                if (result.errorCode === 'DUPLICATE_STUDENT') {
                    modals.duplicate.show(registrationData.student_phone);
                } else {
                    modals.restricted.show();
                }
            }
        } catch (error) {
            console.error('Submission failed:', error);
            alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane ms-2"></i> تسجيل';
        }
    });
});