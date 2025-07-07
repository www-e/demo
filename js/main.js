// js/main.js
import { GRADE_NAMES } from './config.js';
import { getAvailableGroupTimes, submitRegistration, loadSchedulesFromDB } from './services/registration-service.js';
import { fetchTeachers } from './services/teacher-service.js'; // ADDED: Import teacher service
import { fetchMaterials } from './services/material-service.js'; // ADDED: Import material service
import { fetchCenters } from './services/center-service.js'; // ADDED: Import center service
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
    const teacherSelect = form.querySelector('#teacher'); // ADDED: Teacher select element
    const materialSelect = form.querySelector('#material'); // ADDED: Material select element
    const centerSelect = form.querySelector('#center'); // ADDED: Center select element
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
    
    // MODIFIED: Load both schedules and teachers
    await Promise.all([
        loadSchedulesFromDB(),
        loadTeachers(),
        loadMaterials(), // ADDED: Load materials
        loadCenters() // ADDED: Load centers
    ]);
    
    console.log("Schedules and teachers loaded and ready.");

    // ADDED: Load Teachers function
    async function loadMaterials() {
        try {
            const materials = await fetchMaterials();
            updateSelectOptions(materialSelect, materials.map(material => ({
                value: material.id,
                text: material.name 
            })), 'اختر المادة');
        } catch (error) {
            console.error('Error loading materials:', error);
        }
    }

    async function loadCenters() {
        try {
            const centers = await fetchCenters();
            updateSelectOptions(centerSelect, centers.map(center => ({
                value: center.id,
                text: center.name 
            })), 'اختر المركز');
        } catch (error) {
            console.error('Error loading centers:', error);
        }
    }

    // --- Event Listeners & Logic ---
    gradeSelect.addEventListener('change', () => {
        if (gradeSelect.value === 'third') {
            modals.thirdGrade.show();
        }
        updateGroupTimeOptions();
    });

    // ADDED: Teacher select change event
    centerSelect.addEventListener('change', () => {
        updateGroupTimeOptions();
    });

    materialSelect.addEventListener('change', () => {
        updateGroupTimeOptions();
    });

    // MODIFIED: Updated to include teacher filter
    function updateGroupTimeOptions() {
        const grade = gradeSelect.value;
        const teacherId = teacherSelect.value;
        const materialId = materialSelect.value; // ADDED
        const centerId = centerSelect.value; // ADDED
        const groupTimes = getAvailableGroupTimes(grade, teacherId, materialId, centerId); // MODIFIED
        
        // FIXED: `getAvailableGroupTimes` already returns the correct format.
        // No need to re-map the array. This fixes the empty/white dropdown issue.
        updateSelectOptions(groupTimeSelect, groupTimes, 'اختر المجموعة والموعد');
        
        groupTimeSelect.disabled = !groupTimes.length;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Form validation check
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
                material_id: formData.get('material'), // ADDED
                center_id: formData.get('center'), // ADDED
                days_group: days_group,
                time_slot: time_slot
            };

            const result = await submitRegistration(registrationData);

            if (result.success) {
                // ADDED: Get teacher name for display
                const selectedTeacher = await getTeacherName(registrationData.teacher_id);
                
                modals.success.show({
                    studentName: registrationData.student_name,
                    gradeName: GRADE_NAMES[registrationData.grade],
                    groupName: registrationData.days_group,
                    timeName: convertTo12HourFormat(registrationData.time_slot),
                    teacherName: selectedTeacher, // ADDED: Include teacher name
                    materialName: selectedMaterial, // ADDED: Include material name
                    centerName: selectedCenter // ADDED: Include center name
                });
                
                form.reset();
                updateGroupTimeOptions(); 
                
                // Clear validation states
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

    // ADDED: Helper function to get teacher name
    async function getTeacherName(teacherId) {
        try {
            const teachers = await fetchTeachers();
            const teacher = teachers.find(t => t.id === teacherId);
            return teacher ? teacher.name : 'غير محدد';
        } catch (error) {
            return 'غير محدد';
        }
    }

    async function getMaterialName(materialId) {
        try {
            const materials = await fetchMaterials();
            const material = materials.find(m => m.id === materialId);
            return material ? material.name : 'غير محدد';
        } catch (error) {
            return 'غير محدد';
        }
    }

    async function getCenterName(centerId) {
        try {
            const centers = await fetchCenters();
            const center = centers.find(c => c.id === centerId);
            return center ? center.name : 'غير محدد';
        } catch (error) {
            return 'غير محدد';
        }
    }

    // Initial population
    updateGroupTimeOptions();
});