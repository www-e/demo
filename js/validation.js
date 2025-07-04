// js/validation.js

const rules = {
    studentName: {
        validate: value => /^[\u0600-\u06FF\s]{3,}$/.test(value),
        message: 'يجب أن يكون الاسم 3 أحرف عربية على الأقل.'
    },
    studentPhone: {
        validate: value => /^01[0125]\d{8}$/.test(value),
        message: 'رقم الهاتف يجب أن يكون 11 رقماً ويبدأ بـ 010, 011, 012, أو 015.'
    },
    parentPhone: {
        validate: value => /^01[0125]\d{8}$/.test(value),
        message: 'رقم ولي الأمر يجب أن يكون 11 رقماً ويبدأ بـ 010, 011, 012, أو 015.'
    },
    grade: {
        validate: value => value !== '',
        message: 'يرجى اختيار الصف الدراسي.'
    },
    // UPDATED: Replaced 'group' and 'time' with a single rule for the combined dropdown.
    groupTime: {
        validate: value => value !== '',
        message: 'يرجى اختيار المجموعة والموعد.'
    },
};

const getFieldElement = (form, fieldName) => form.querySelector(`#${fieldName}`);

const showError = (field, message) => {
    // For custom dropdowns, we need to target the visual element
    const container = field.parentElement;
    const customDropdown = container.querySelector('.custom-dropdown-container .selected-option');
    const targetElement = customDropdown || field;

    targetElement.classList.add('invalid');
    // Ensure the invalid style is visible for custom dropdowns
    if(customDropdown) {
        customDropdown.style.borderColor = 'var(--error)';
    }

    const messageDiv = container.querySelector('.validation-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    }
};

const clearError = (field) => {
    const container = field.parentElement;
    const customDropdown = container.querySelector('.custom-dropdown-container .selected-option');
    const targetElement = customDropdown || field;
    
    targetElement.classList.remove('invalid');
    if(customDropdown) {
        customDropdown.style.borderColor = ''; // Revert to default
    }

    const messageDiv = container.querySelector('.validation-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
};

export const validateField = (fieldName, form) => {
    const field = getFieldElement(form, fieldName);
    if (!field) return true; // If field doesn't exist, skip validation
    const rule = rules[fieldName];
    if (!rule) return true;

    if (rule.validate(field.value)) {
        clearError(field);
        return true;
    } else {
        showError(field, rule.message);
        return false;
    }
};

export const validateForm = (form) => {
    let isFormValid = true;
    // We get the keys from the form itself to ensure we only validate existing fields
    const formFields = Array.from(form.elements).map(el => el.id);
    for (const fieldName in rules) {
        if (formFields.includes(fieldName)) {
            if (!validateField(fieldName, form)) {
                isFormValid = false;
            }
        }
    }
    return isFormValid;
};

export const initRealtimeValidation = (form) => {
    form.addEventListener('input', (e) => {
        const fieldName = e.target.id;
        if (rules[fieldName]) {
            validateField(fieldName, form);
        }
    });

    form.addEventListener('change', (e) => {
        const fieldName = e.target.id;
         if (rules[fieldName]) {
            validateField(fieldName, form);
        }
    });
};