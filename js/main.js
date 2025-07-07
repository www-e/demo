// js/main.js
import { GRADE_NAMES } from './config.js';
import { getAvailableGroupTimes, submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchCenters } from './services/center-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';
import { validateForm, initRealtimeValidation } from './validation.js';

// Helper to format 24-hour time to 12-hour Arabic format
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

    // --- DOM Elements ---
    const gradeSelect = form.querySelector('#grade');
    const teacherSelect = form.querySelector('#teacher');
    const materialSelect = form.querySelector('#material');
    const centerSelect = form.querySelector('#center');
    const groupTimeSelect = form.querySelector('#groupTime');
    const submitBtn = form.querySelector('.submit-btn');

    // --- Modal Instances ---
    const modals = {
        success: new SuccessModal(),
        thirdGrade: new ThirdGradeModal(),
        restricted: new RestrictedGroupsModal(),
        duplicate: new DuplicateRegistrationModal()
    };
    
    // --- Initialize UI ---
    initDropdowns();
    initRealtimeValidation(form);
    
    // --- Initial Data Loading ---
    try {
        // Load all data concurrently for faster page load
        const [schedules, teachers, materials, centers] = await Promise.all([
            loadSchedulesFromDB(),
            fetchTeachers(),
            fetchMaterials(),
            fetchCenters()
        ]);
        
        // Populate dropdowns with the fetched data
        updateSelectOptions(teacherSelect, teachers.filter(t => t.is_active).map(t => ({ value: t.id, text: t.name })), 'اختر المدرس');
        updateSelectOptions(materialSelect, materials.map(m => ({ value: m.id, text: m.name })), 'اختر المادة');
        updateSelectOptions(centerSelect, centers.map(c => ({ value: c.id, text: c.name })), 'اختر المركز');

    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('حدث خطأ في تحميل البيانات الأساسية. يرجى تحديث الصفحة.');
    }
    
    console.log("Schedules and dropdown data loaded and ready.");

    // --- Event Listeners & Logic ---
    gradeSelect.addEventListener('change', () => {
        if (gradeSelect.value === 'third') {
            modals.thirdGrade.show();
        }
        updateGroupTimeOptions();
    });

    teacherSelect.addEventListener('change', updateGroupTimeOptions);
    materialSelect.addEventListener('change', updateGroupTimeOptions);
    centerSelect.addEventListener('change', updateGroupTimeOptions);

    function updateGroupTimeOptions() {
        const grade = gradeSelect.value;
        const teacherId = teacherSelect.value;
        const materialId = materialSelect.value;
        const centerId = centerSelect.value;
        const groupTimes = getAvailableGroupTimes(grade, teacherId, materialId, centerId);
        
        updateSelectOptions(groupTimeSelect, groupTimes, 'اختر المجموعة والموعد');
        groupTimeSelect.disabled = !groupTimes.length;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isFormValid = validateForm(form);
        if (!isFormValid) {
            console.log("Validation failed. Form submission stopped.");
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        
        try {
            const formData = new FormData(form);
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
                const selectedTeacher = teacherSelect.options[teacherSelect.selectedIndex].text;
                const selectedMaterial = materialSelect.options[materialSelect.selectedIndex].text;
                const selectedCenter = centerSelect.options[centerSelect.selectedIndex].text;
                
                modals.success.show({
                    studentName: registrationData.student_name,
                    gradeName: GRADE_NAMES[registrationData.grade],
                    groupName: registrationData.days_group,
                    timeName: convertTo12HourFormat(registrationData.time_slot),
                    teacherName: selectedTeacher,
                    materialName: selectedMaterial,
                    centerName: selectedCenter
                });
                
                form.reset();
                initDropdowns(); // Re-initialize dropdowns to reset their display text
                updateGroupTimeOptions(); 
                
                document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                document.querySelectorAll('.validation-message').forEach(el => el.style.display = 'none');

            } else {
                if (result.errorCode === 'DUPLICATE_STUDENT') {
                    modals.duplicate.show(registrationData.student_phone);
                } else {
                    modals.restricted.show();
                }
            }
        } catch (error)
        {
            console.error('Submission failed:', error);
            alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane ms-2"></i> تسجيل';
        }
    });

    // Initial population
    updateGroupTimeOptions();
});