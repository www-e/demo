// js/main.js
import { GRADE_NAMES } from './config.js';
import { getAvailableGroupTimes, submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { initDropdowns, updateSelectOptions } from './ui/dropdowns.js';
import { SuccessModal, ThirdGradeModal, RestrictedGroupsModal, DuplicateRegistrationModal } from './ui/modals.js';
// NEW: Import validation functions
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
    const groupTimeSelect = form.querySelector('#groupTime'); // Updated selector
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
    initRealtimeValidation(form); // NEW: Initialize real-time validation
    await loadSchedulesFromDB();
    console.log("Schedules loaded and ready.");

    // --- Event Listeners & Logic ---
    gradeSelect.addEventListener('change', () => {
        if (gradeSelect.value === 'third') {
            modals.thirdGrade.show();
        }
        updateGroupTimeOptions();
    });

    function updateGroupTimeOptions() {
        const grade = gradeSelect.value;
        const groupTimes = getAvailableGroupTimes(grade);
        updateSelectOptions(groupTimeSelect, groupTimes, 'اختر المجموعة والموعد');
        groupTimeSelect.disabled = !groupTimes.length;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // NEW: Add form validation check before doing anything else.
        const isFormValid = validateForm(form);
        if (!isFormValid) {
            console.log("Validation failed. Form submission stopped.");
            return; // Stop the submission if validation fails
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
        
        try {
            const formData = new FormData(form);
            const combinedValue = formData.get('group_time');
            
            const [days_group, time_slot] = combinedValue.split('|');
            // Create a new data object instead of modifying FormData
            const registrationData = {
                student_name: formData.get('student_name'),
                student_phone: formData.get('student_phone'),
                parent_phone: formData.get('parent_phone'),
                grade: formData.get('grade'),
                days_group: days_group,
                time_slot: time_slot
            };

            const result = await submitRegistration(registrationData);

            if (result.success) {
                modals.success.show({
                    studentName: registrationData.student_name,
                    gradeName: GRADE_NAMES[registrationData.grade],
                    groupName: registrationData.days_group,
                    timeName: convertTo12HourFormat(registrationData.time_slot)
                });
                form.reset();
                // After reset, re-run update to show placeholders
                updateGroupTimeOptions(); 
                // Clear validation states after successful submission and reset
                document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                document.querySelectorAll('.validation-message').forEach(el => el.style.display = 'none');

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

    // Initial population
    updateGroupTimeOptions();
});