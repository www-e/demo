// js/main.js
import { GRADE_NAMES } from './pages/admin/constants.js';
import { submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchCenters } from './services/center-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal, MathWarningModal } from './ui/modals.js';
import { validateForm, initRealtimeValidation } from './validation.js';
import { FeesModal } from './components/fees-modal.js';

let allSchedules = [];
let allMaterials = [];
let allTeachers = [];
let allCenters = [];

const convertTo12HourFormat = (time24) => {
    if (!time24) return 'غير محدد';
    return new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
};

function calculateFees(grade, materialName) {
    const fees = {
        centerFee: 30,
        materialFee: 0,
        total: 0,
    };

    if (grade === 'first' && materialName.includes('الرياضيات')) {
        fees.materialFee = 25;
    } else if (grade === 'second' && materialName.includes('بحتة - تطبيقية')) {
        fees.materialFee = 75;
    } else if (grade === 'third' && materialName.includes('بحتة - تطبيقية')) {
        fees.materialFee = 85;
    }

    fees.total = fees.centerFee + fees.materialFee;
    return fees;
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;
    // Initialize the new FeesModal
    const feesModal = new FeesModal();
    const showFeesBtn = document.getElementById('showFeesBtn');
    if (showFeesBtn) {
        showFeesBtn.addEventListener('click', () => feesModal.show());
    }
    const ui = {
        gradeSelect: form.querySelector('#grade'),
        teacherSelect: form.querySelector('#teacher'),
        materialSelect: form.querySelector('#material'),
        centerSelect: form.querySelector('#center'),
        groupTimeSelect: form.querySelector('#groupTime'),
        submitBtn: form.querySelector('.submit-btn')
    };

    const modals = {
        success: new SuccessModal(),
        thirdGrade: new ThirdGradeModal(),
        restricted: new RestrictedGroupsModal(),
        duplicate: new DuplicateRegistrationModal(),
        mathWarning: new MathWarningModal() // Add this line
    };

    initDropdowns();
    initRealtimeValidation(form);

    try {
        [allSchedules, allTeachers, allMaterials, allCenters] = await Promise.all([
            loadSchedulesFromDB(),
            fetchTeachers(),
            fetchMaterials(),
            fetchCenters()
        ]);

        // Initial population of the first dropdown in the hierarchy
        const centerOptions = allCenters
            .filter(c => c.name !== 'عام')
            .map(c => ({ value: c.id, text: c.name }));
        updateSelectOptions(ui.centerSelect, centerOptions, 'اختر المركز');

        // Trigger the first cascade
        updateAvailableOptions();

    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('حدث خطأ في تحميل البيانات الأساسية. يرجى تحديث الصفحة.');
    }

    // REFACTORED: The single source of truth for all dropdown logic.
    function updateAvailableOptions() {
        let availableSchedules = [...allSchedules];

        // 1. Filter by Center
        const selectedCenter = ui.centerSelect.value;
        if (selectedCenter) {
            availableSchedules = availableSchedules.filter(s => s.center_id === selectedCenter);
        }

        // 2. Populate and Filter by Grade
        const gradeOptions = [...new Set(availableSchedules.map(s => s.grade))]
            .map(g => ({ value: g, text: GRADE_NAMES[g] }));
        updateSelectOptions(ui.gradeSelect, gradeOptions, 'اختر الصف');

        const selectedGrade = ui.gradeSelect.value;
        if (selectedGrade) {
            availableSchedules = availableSchedules.filter(s => s.grade === selectedGrade);
        }

        // 3. Populate and Filter by Material
        const materialOptions = [...new Map(availableSchedules.map(s => [s.material.id, s.material])).values()]
            .map(m => ({ value: m.id, text: m.name }));
        updateSelectOptions(ui.materialSelect, materialOptions, 'اختر المادة');

        const selectedMaterial = ui.materialSelect.value;
        if (selectedMaterial) {
            availableSchedules = availableSchedules.filter(s => s.material_id === selectedMaterial);
        }

        // 4. Populate and Filter by Teacher
        const teacherOptions = [...new Map(availableSchedules.map(s => [s.teacher.id, s.teacher])).values()]
            .filter(t => t.is_active)
            .map(t => ({ value: t.id, text: t.name }));
        updateSelectOptions(ui.teacherSelect, teacherOptions, 'اختر المدرس');

        const selectedTeacher = ui.teacherSelect.value;
        if (selectedTeacher) {
            availableSchedules = availableSchedules.filter(s => s.teacher_id === selectedTeacher);
        }

        // 5. Populate final Group/Time options
        const groupTimeOptions = availableSchedules.map(s => {
            const registeredCount = s.registrations_2025_2026_count || 0;
            const capacity = s.capacity || 145;
            let badgeText = '', badgeClass = '';

            if (registeredCount >= capacity) {
                badgeText = 'اكتمل العدد'; badgeClass = 'tag-full';
            } else if (registeredCount >= capacity - 10) {
                badgeText = 'أماكن محدودة'; badgeClass = 'tag-limited';
            } else {
                badgeText = 'متاح'; badgeClass = 'tag-available';
            }

            return {
                value: `${s.group_name}|${s.time_slot}`,
                text: `${s.group_name} - ${convertTo12HourFormat(s.time_slot)}`,
                badgeText,
                badgeClass
            };
        });

        updateSelectOptions(ui.groupTimeSelect, groupTimeOptions, 'اختر المجموعة والموعد');
        ui.groupTimeSelect.disabled = !groupTimeOptions.length;
    }

    // Setup event listeners to trigger the cascade
    ui.centerSelect.addEventListener('change', updateAvailableOptions);
    ui.gradeSelect.addEventListener('change', updateAvailableOptions);
    ui.materialSelect.addEventListener('change', updateAvailableOptions);
    ui.teacherSelect.addEventListener('change', updateAvailableOptions);
    ui.materialSelect.addEventListener('change', () => {
        const selectedGrade = ui.gradeSelect.value;
        const selectedOption = ui.materialSelect.options[ui.materialSelect.selectedIndex];

        // Ensure an option is actually selected
        if (!selectedOption || !selectedOption.value) {
            return;
        }

        const materialText = selectedOption.textContent;

        // Check if grade is 2nd or 3rd and material is math-related
        if ((selectedGrade === 'second' || selectedGrade === 'third') &&
            (materialText.includes('بحته') || materialText.includes('تطبيقيه'))) {
            modals.mathWarning.show();
        }
    });
    // Form submission logic remains the same
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        if (!validateForm(form) || !formData.get('group_time')) {
            return;
        }

        ui.submitBtn.disabled = true;
        ui.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';

        try {
            const grade = formData.get('grade');
            const materialId = formData.get('material');
            const selectedMaterial = allMaterials.find(m => m.id === materialId);
            const materialName = selectedMaterial ? selectedMaterial.name : '';

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
                const selectedCenter = allCenters.find(c => c.id === registrationData.p_center_id);
                const centerName = selectedCenter ? selectedCenter.name : 'غير محدد';

                modals.success.show({
                    studentName: registrationData.p_student_name,
                    studentPhone: registrationData.p_student_phone,
                    parentPhone: registrationData.p_parent_phone,
                    gradeName: GRADE_NAMES[grade],
                    materialName: materialName,
                    centerName: centerName,
                    groupName: days_group,
                    timeName: convertTo12HourFormat(time_slot),
                    transactionId: registrationData.p_transaction_id
                });

                form.reset();
                document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                initDropdowns(); // Re-initialize dropdowns to clear selections visually
                updateAvailableOptions(); // Refresh the options for the next registration
            } else {
                if (result.errorCode === 'DUPLICATE_STUDENT') {
                    modals.duplicate.show(registrationData.p_student_phone);
                } else if (result.errorCode === 'GROUP_FULL') {
                    modals.restricted.show('عفواً، هذه المجموعة مكتملة العدد. يرجى اختيار مجموعة أخرى.');
                } else {
                    modals.restricted.show();
                }
            }
        } catch (error) {
            console.error('Submission failed:', error);
            modals.restricted.show('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        } finally {
            ui.submitBtn.disabled = false;
            ui.submitBtn.innerHTML = '<i class="fas fa-paper-plane ms-2"></i> تسجيل';
        }
    });
});