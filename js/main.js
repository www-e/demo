// js/main.js

// --- MODULE IMPORTS ---
// Importing all necessary components, services, and utilities.
import { GRADE_NAMES } from './pages/admin/constants.js';
import { submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { fetchTeachers } from './services/teacher-service.js';
import { fetchMaterials } from './services/material-service.js';
import { fetchCenters } from './services/center-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal, MathWarningModal, SecondMathStepModal } from './ui/modals.js';
import { validateForm, initRealtimeValidation } from './validation.js';
import { FeesModal } from './components/fees-modal.js';

// --- STATE AND CONSTANTS ---

// A key to store the pending registration state in the browser's session storage.
// This makes the two-step registration process persistent even if the user reloads the page.
const PENDING_MATH_REGISTRATION_KEY = 'pendingSecondMathRegistration';

// Module-level variables to cache data fetched from the database.
let allSchedules = [];
let allMaterials = [];
let allTeachers = [];
let allCenters = [];

// --- HELPER FUNCTIONS ---

/**
 * Converts a 24-hour time string (e.g., "14:30") to a 12-hour Arabic format (e.g., "٢:٣٠ م").
 * @param {string} time24 - The time in 24-hour format.
 * @returns {string} The formatted time.
 */
const convertTo12HourFormat = (time24) => {
    if (!time24) return 'غير محدد';
    return new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    });
};

/**
 * A utility function for fee calculation (retained from original file).
 */
function calculateFees(grade, materialName) {
    const fees = { centerFee: 30, materialFee: 0, total: 0 };
    if (grade === 'first' && materialName.includes('الرياضيات')) fees.materialFee = 25;
    else if (grade === 'second' && materialName.includes('بحتة - تطبيقية')) fees.materialFee = 75;
    else if (grade === 'third' && materialName.includes('بحتة - تطبيقية')) fees.materialFee = 85;
    fees.total = fees.centerFee + fees.materialFee;
    return fees;
}

/**
 * Prefills the form with student data for the second registration step and makes personal info fields readonly.
 * @param {object} data - The student's data { student_name, student_phone, parent_phone }.
 * @param {HTMLFormElement} form - The registration form element.
 */
function prefillAndLockForm(data, form) {
    const { student_name, student_phone, parent_phone } = data;
    const nameInput = form.querySelector('#studentName');
    const studentPhoneInput = form.querySelector('#studentPhone');
    const parentPhoneInput = form.querySelector('#parentPhone');
    const transactionIdInput = form.querySelector('#transactionId');

    nameInput.value = student_name;
    studentPhoneInput.value = student_phone;
    parentPhoneInput.value = parent_phone;
    transactionIdInput.value = ''; // Clear transaction ID for the new registration

    nameInput.readOnly = true;
    studentPhoneInput.readOnly = true;
    parentPhoneInput.readOnly = true;

    form.querySelectorAll('select').forEach(select => { select.value = ''; });
    initDropdowns();
}

/**
 * Resets the form to its initial state, clears session storage, and makes all fields editable again.
 * @param {HTMLFormElement} form - The registration form element.
 */
function resetAndUnlockForm(form) {
    sessionStorage.removeItem(PENDING_MATH_REGISTRATION_KEY);
    form.querySelector('#studentName').readOnly = false;
    form.querySelector('#studentPhone').readOnly = false;
    form.querySelector('#parentPhone').readOnly = false;
    form.reset();
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    initDropdowns();
}

// --- MAIN APPLICATION LOGIC ---

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // Initialize UI components and modals
    new FeesModal();
    const showFeesBtn = document.getElementById('showFeesBtn');
    if (showFeesBtn) showFeesBtn.addEventListener('click', () => new FeesModal().show());

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
        mathWarning: new MathWarningModal(),
        secondMathStep: new SecondMathStepModal()
    };

    // On page load, check if there's a pending registration and lock the form if needed.
    const pendingRegistrationJSON = sessionStorage.getItem(PENDING_MATH_REGISTRATION_KEY);
    if (pendingRegistrationJSON) {
        try {
            prefillAndLockForm(JSON.parse(pendingRegistrationJSON), form);
        } catch (e) {
            console.error("Failed to parse pending registration data", e);
            sessionStorage.removeItem(PENDING_MATH_REGISTRATION_KEY);
        }
    }

    initDropdowns();
    initRealtimeValidation(form);
    // --- NEW: Copy Button Functionality ---
    const copyPhoneBtn = document.getElementById('copy-phone-btn');
    const paymentPhoneNumber = document.getElementById('payment-phone-number');
    if (copyPhoneBtn && paymentPhoneNumber) {
        copyPhoneBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(paymentPhoneNumber.textContent).then(() => {
                const icon = copyPhoneBtn.querySelector('i');
                const originalIconClass = icon.className;

                // Visual feedback
                icon.className = 'fas fa-check';
                copyPhoneBtn.classList.add('copied');

                // Revert after a short time
                setTimeout(() => {
                    icon.className = originalIconClass;
                    copyPhoneBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy phone number: ', err);
                alert('فشل نسخ الرقم. يرجى النسخ يدوياً.');
            });
        });
    }

    // Fetch initial data from the database.
    try {
        [allSchedules, allTeachers, allMaterials, allCenters] = await Promise.all([
            loadSchedulesFromDB(), fetchTeachers(), fetchMaterials(), fetchCenters()
        ]);
        const centerOptions = allCenters.filter(c => c.name !== 'عام').map(c => ({ value: c.id, text: c.name }));
        updateSelectOptions(ui.centerSelect, centerOptions, 'اختر المركز');
        updateAvailableOptions();
    } catch (error) {
        console.error('Error loading initial data:', error);
        alert('حدث خطأ في تحميل البيانات الأساسية. يرجى تحديث الصفحة.');
    }

    /**
     * **CORRECTED AND FINAL VERSION**
     * This function intelligently updates all dropdowns based on user selections.
     * It solves the filtering bug by populating Grade/Material/Teacher dropdowns from a common
     * "schedulesForCenter" list, and only applies the strict filtering for the final Group/Time list.
     */
    // REPLACE THIS ENTIRE FUNCTION
    function updateAvailableOptions() {
        // Step 1: Create a base list of schedules filtered ONLY by the selected Center.
        const selectedCenter = ui.centerSelect.value;
        const schedulesForCenter = selectedCenter
            ? allSchedules.filter(s => s.center_id === selectedCenter)
            : allSchedules;

        // Step 2: Populate Grade, Material, and Teacher dropdowns.
        const gradeOptions = [...new Set(schedulesForCenter.map(s => s.grade))].map(g => ({ value: g, text: GRADE_NAMES[g] }));
        updateSelectOptions(ui.gradeSelect, gradeOptions, 'اختر الصف');

        // --- NEW LOGIC: Smarter material filtering ---
        const pendingRegistrationJSON = sessionStorage.getItem(PENDING_MATH_REGISTRATION_KEY);
        let firstMaterialId = null;
        if (pendingRegistrationJSON) {
            try {
                firstMaterialId = JSON.parse(pendingRegistrationJSON).firstMaterialId;
            } catch (e) { console.error(e); }
        }

        // Get all unique materials for the center...
        const materialOptions = [...new Map(schedulesForCenter.map(s => [s.material.id, s.material])).values()]
            // ...but filter out the one that was already registered if we're in the second step.
            .filter(m => m.id !== firstMaterialId)
            .map(m => ({ value: m.id, text: m.name }));
        updateSelectOptions(ui.materialSelect, materialOptions, 'اختر المادة');

        const teacherOptions = [...new Map(schedulesForCenter.map(s => [s.teacher.id, s.teacher])).values()].filter(t => t.is_active).map(t => ({ value: t.id, text: t.name }));
        updateSelectOptions(ui.teacherSelect, teacherOptions, 'اختر المدرس');

        // Step 3: Get current selections.
        const selectedGrade = ui.gradeSelect.value;
        const selectedMaterial = ui.materialSelect.value;
        const selectedTeacher = ui.teacherSelect.value;

        // Step 4: Create the FINAL, strictly filtered list.
        let finalSchedules = schedulesForCenter;
        if (selectedGrade) finalSchedules = finalSchedules.filter(s => s.grade === selectedGrade);
        if (selectedMaterial) finalSchedules = finalSchedules.filter(s => s.material_id === selectedMaterial);
        if (selectedTeacher) finalSchedules = finalSchedules.filter(s => s.teacher_id === selectedTeacher);

        // Step 5: Populate the final Group/Time options.
        const groupTimeOptions = finalSchedules.map(s => {
            const registeredCount = s.registrations_2025_2026_count || 0, capacity = s.capacity || 145;
            let badgeText = 'متاح', badgeClass = 'tag-available';
            if (registeredCount >= capacity) { badgeText = 'اكتمل العدد'; badgeClass = 'tag-full'; }
            else if (registeredCount >= capacity - 10) { badgeText = 'أماكن محدودة'; badgeClass = 'tag-limited'; }
            return { value: `${s.group_name}|${s.time_slot}`, text: `${s.group_name} - ${convertTo12HourFormat(s.time_slot)}`, badgeText, badgeClass };
        });
        updateSelectOptions(ui.groupTimeSelect, groupTimeOptions, 'اختر المجموعة والموعد');
        ui.groupTimeSelect.disabled = !groupTimeOptions.length;
    }

    // --- EVENT LISTENERS ---

    // Listen for changes on all dropdowns to re-filter the available options.
    ['centerSelect', 'gradeSelect', 'materialSelect', 'teacherSelect'].forEach(id => {
        ui[id].addEventListener('change', updateAvailableOptions);
    });

    // **RESTORED FEATURE**: Show the Math Warning modal for 2nd/3rd grade.
    ui.materialSelect.addEventListener('change', () => {
        const selectedGrade = ui.gradeSelect.value;
        const selectedOption = ui.materialSelect.options[ui.materialSelect.selectedIndex];
        if (!selectedOption || !selectedOption.value) return;
        const materialText = selectedOption.textContent;
        if ((selectedGrade === 'second' || selectedGrade === 'third') && (materialText.includes('بحتة') || materialText.includes('تطبيقية'))) {
            modals.mathWarning.show();
        }
    });

    // Main form submission logic.
    // REPLACE THIS ENTIRE EVENT LISTENER
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        if (!validateForm(form) || !formData.get('group_time')) {
            return;
        }

        ui.submitBtn.disabled = true;
        ui.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';

        try {
            const [days_group, time_slot] = formData.get('group_time').split('|');
            const registrationData = {
                p_student_name: formData.get('student_name'),
                p_student_phone: formData.get('student_phone'),
                p_parent_phone: formData.get('parent_phone'),
                p_transaction_id: formData.get('transaction_id'),
                p_grade: formData.get('grade'),
                p_teacher_id: formData.get('teacher'),
                p_material_id: formData.get('material'),
                p_center_id: formData.get('center'),
                p_days_group: days_group,
                p_time_slot: time_slot
            };

            const result = await submitRegistration(registrationData);

            if (result.success) {
                const grade = formData.get('grade'), materialId = formData.get('material');
                const selectedMaterial = allMaterials.find(m => m.id === materialId);
                const materialName = selectedMaterial ? selectedMaterial.name : '';
                const isMathRegistration = (grade === 'second' || grade === 'third') && (materialName.includes('بحتة') || materialName.includes('تطبيقية'));

                const pendingRegistrationJSON = sessionStorage.getItem(PENDING_MATH_REGISTRATION_KEY);

                if (isMathRegistration && !pendingRegistrationJSON) {
                    // PATH 1: First math registration. Start the two-step process.
                    const pendingData = {
                        student_name: registrationData.p_student_name,
                        student_phone: registrationData.p_student_phone,
                        parent_phone: registrationData.p_parent_phone,
                        // --- NEW: Store details of the FIRST registration ---
                        firstMaterialId: materialId,
                        firstRegistrationDetails: {
                            materialName: materialName,
                            groupName: days_group,
                            timeName: convertTo12HourFormat(time_slot)
                        }
                    };
                    sessionStorage.setItem(PENDING_MATH_REGISTRATION_KEY, JSON.stringify(pendingData));

                    modals.secondMathStep.show({
                        onConfirm: () => { prefillAndLockForm(pendingData, form); updateAvailableOptions(); },
                        onCancel: () => { prefillAndLockForm(pendingData, form); updateAvailableOptions(); },
                        firstMaterialName: materialName,
                        secondMaterialName: materialName.includes('بحتة') ? 'تطبيقية' : 'بحتة'
                    });
                } else {
                    // PATH 2: Normal registration or SECOND math registration.
                    let successData = {};

                    if (isMathRegistration && pendingRegistrationJSON) {
                        // This is the SECOND registration, build the summary.
                        const firstRegData = JSON.parse(pendingRegistrationJSON);
                        successData = {
                            studentName: registrationData.p_student_name,
                            studentPhone: registrationData.p_student_phone,
                            summary: [
                                firstRegData.firstRegistrationDetails, // The first registration
                                { // The second (current) registration
                                    materialName: materialName,
                                    groupName: days_group,
                                    timeName: convertTo12HourFormat(time_slot)
                                }
                            ]
                        };
                    } else {
                        // This is a normal (non-math) registration.
                        const selectedCenter = allCenters.find(c => c.id === registrationData.p_center_id);
                        successData = {
                            studentName: registrationData.p_student_name, studentPhone: registrationData.p_student_phone, parentPhone: registrationData.p_parent_phone,
                            gradeName: GRADE_NAMES[grade], materialName: materialName, centerName: selectedCenter ? selectedCenter.name : 'غير محدد',
                            groupName: days_group, timeName: convertTo12HourFormat(time_slot), transactionId: registrationData.p_transaction_id
                        };
                    }

                    modals.success.show(successData);
                    resetAndUnlockForm(form);
                    updateAvailableOptions();
                }
            } else {
                if (result.errorCode === 'DUPLICATE_STUDENT') modals.duplicate.show(registrationData.p_student_phone);
                else if (result.errorCode === 'GROUP_FULL') modals.restricted.show('عفواً، هذه المجموعة مكتملة العدد. يرجى اختيار مجموعة أخرى.');
                else modals.restricted.show();
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