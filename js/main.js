// js/main.js
import { GRADE_NAMES } from './pages/admin/constants.js';
import { submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchCenters } from './services/center-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';
import { validateForm, initRealtimeValidation } from './validation.js';

let allSchedules = [];
let allMaterials = []; // Store materials to access their names

const convertTo12HourFormat = (time24) => {
    if (!time24) return 'غير محدد';
    return new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
};

// NEW: Modular function for all pricing logic
function calculateFees(grade, materialName) {
    const fees = {
        centerFee: 30,
        materialFee: 0,
        total: 0,
    };

    if (grade === 'first') {
        fees.materialFee = 25;
    } else if (grade === 'second') {
        if (materialName.includes('بحته')) {
            fees.materialFee = 25;
        } else if (materialName.includes('تطبيقية')) {
            fees.materialFee = 50;
        }
    } else if (grade === 'third') {
        if (materialName.includes('بحته')) {
            fees.materialFee = 30;
        } else if (materialName.includes('تطبيقية')) {
            fees.materialFee = 55;
        }
    }

    fees.total = fees.centerFee + fees.materialFee;
    return fees;
}


document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const gradeSelect = form.querySelector('#grade');
    const teacherSelect = form.querySelector('#teacher');
    const materialSelect = form.querySelector('#material');
    const centerSelect = form.querySelector('#center');
    const groupTimeSelect = form.querySelector('#groupTime');
    const submitBtn = form.querySelector('.submit-btn');

    // Initialize all modals
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
        allMaterials = materials; // Save for later use
        
        const filteredCenters = centers.filter(c => c.name !== 'عام');
        updateSelectOptions(centerSelect, filteredCenters.map(c => ({ value: c.id, text: c.name })), 'اختر المركز');
        updateAvailableOptions();

    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('حدث خطأ في تحميل البيانات الأساسية. يرجى تحديث الصفحة.');
    }
    
    console.log("Schedules and dropdown data loaded and ready.");

    function updateAvailableOptions() {
        let available = [...allSchedules];

        // Filter based on selections
        if (centerSelect.value) available = available.filter(s => s.center_id === centerSelect.value);
        
        const materialOptions = [...new Map(available.map(s => [s.material.id, s.material])).values()]
            .map(m => ({ value: m.id, text: m.name }))
            .filter(m => m.text !== 'عامة');
        updateSelectOptions(materialSelect, materialOptions, 'اختر المادة');
        if (materialSelect.value) available = available.filter(s => s.material_id === materialSelect.value);

        const teacherOptions = [...new Map(available.map(s => [s.teacher.id, s.teacher])).values()]
            .filter(t => t.is_active)
            .map(t => ({ value: t.id, text: t.name }))
            .filter(t => t.text !== 'عام');
        updateSelectOptions(teacherSelect, teacherOptions, 'اختر المدرس');
        if (teacherSelect.value) available = available.filter(s => s.teacher_id === teacherSelect.value);

        const gradeOptions = [...new Set(available.map(s => s.grade))].map(g => ({ value: g, text: GRADE_NAMES[g] }));
        updateSelectOptions(gradeSelect, gradeOptions, 'اختر الصف');
        if (gradeSelect.value) available = available.filter(s => s.grade === gradeSelect.value);

        // MODIFIED: Process availability and create badges
        const groupTimeOptions = available.map(s => {
            const registeredCount = s.registrations_2025_2026_count || 0;
            const capacity = s.capacity || 145;
            let badgeText = '';
            let badgeClass = '';

            if (registeredCount >= capacity) {
                badgeText = 'اكتمل العدد';
                badgeClass = 'tag-full';
            } else if (registeredCount >= capacity - 10) { // "Limited" threshold
                badgeText = 'أماكن محدودة';
                badgeClass = 'tag-limited';
            } else {
                badgeText = 'متاح';
                badgeClass = 'tag-available';
            }

            return {
                value: `${s.group_name}|${s.time_slot}`,
                text: `${s.group_name} - ${convertTo12HourFormat(s.time_slot)}`,
                badgeText: badgeText,
                badgeClass: badgeClass
            };
        });
        
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
        const grade = formData.get('grade');
        const materialId = formData.get('material');
        const selectedMaterial = allMaterials.find(m => m.id === materialId);
        const materialName = selectedMaterial ? selectedMaterial.name : '';

        // RULE: 2nd and 3rd year must select math subjects
        if ((grade === 'second' || grade === 'third') && (!materialName.includes('بحته') && !materialName.includes('تطبيقية'))) {
             modals.restricted.show('للتسجيل في الصف الثاني أو الثالث، يجب حجز مجموعتين (بحته وتطبيقية) معًا. يرجى العلم أنه سيتم حجز المادة الأخرى لك تلقائيًا.');
             return;
        }

        if (!validateForm(form) || !formData.get('group_time')) {
            console.log("Validation failed. Form submission stopped.");
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        
        try {
            const [days_group, time_slot] = formData.get('group_time').split('|');
            const registrationData = {
                p_student_name: formData.get('student_name'),
                p_student_phone: formData.get('student_phone'),
                p_parent_phone: formData.get('parent_phone'),
                p_transaction_id: formData.get('transaction_id'),
                p_grade: grade,
                p_teacher_id: formData.get('teacher'),
                p_material_id: materialId,
                p_center_id: formData.get('center'),
                p_days_group: days_group,
                p_time_slot: time_slot
            };

            const result = await submitRegistration(registrationData);

            if (result.success) {
                const fees = calculateFees(grade, materialName);
                modals.success.show({
                    studentName: registrationData.p_student_name,
                    gradeName: GRADE_NAMES[grade],
                    materialName: materialName,
                    groupName: days_group,
                    timeName: convertTo12HourFormat(time_slot),
                    fees: fees
                });
                
                form.reset();
                document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                initDropdowns(); // Re-initialize dropdowns to clear them
                updateAvailableOptions();

            } else {
                // Handle specific errors from the database
                if (result.errorCode === 'DUPLICATE_STUDENT') {
                    modals.duplicate.show(registrationData.p_student_phone);
                } else if (result.errorCode === 'GROUP_FULL') {
                    modals.restricted.show('عفواً، هذه المجموعة مكتملة العدد. يرجى اختيار مجموعة أخرى.');
                } else {
                    modals.restricted.show(); // Generic "not available"
                }
            }
        } catch (error) {
            console.error('Submission failed:', error);
            modals.restricted.show('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane ms-2"></i> تسجيل';
        }
    });
});