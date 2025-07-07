// js/ui/dropdowns.js

let activeDropdown = null;

function closeAllDropdowns() {
    if (activeDropdown) {
        activeDropdown.classList.remove('active');
        activeDropdown.querySelector('.dropdown-options')?.classList.remove('show');
        activeDropdown.querySelector('.selected-option')?.setAttribute('aria-expanded', 'false');
        activeDropdown = null;
    }
}

function createDropdown(selectElement) {
    const container = selectElement.parentElement;
    container.querySelector('.custom-dropdown-container')?.remove();

    const customDropdown = document.createElement('div');
    customDropdown.className = 'custom-dropdown-container';

    const selectedOptionDisplay = document.createElement('div');
    selectedOptionDisplay.className = 'selected-option';
    selectedOptionDisplay.textContent = selectElement.options[0].textContent;
    selectedOptionDisplay.tabIndex = 0;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'dropdown-options';

    const updateOptions = () => {
        optionsContainer.innerHTML = '';
        Array.from(selectElement.options).forEach(option => {
            if (!option.value) return;

            const dropdownOption = document.createElement('div');
            dropdownOption.className = 'dropdown-option';
            dropdownOption.dataset.value = option.value;
            
            dropdownOption.textContent = option.textContent;

            dropdownOption.addEventListener('click', e => {
                e.stopPropagation();
                selectedOptionDisplay.textContent = option.textContent;
                selectElement.value = option.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                closeAllDropdowns();
            });
            optionsContainer.appendChild(dropdownOption);
        });
    };

    selectedOptionDisplay.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = customDropdown.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) {
            customDropdown.classList.add('active');
            optionsContainer.classList.add('show');
            activeDropdown = customDropdown;
        }
    });

    selectElement.addEventListener('update', updateOptions);
    customDropdown.append(selectedOptionDisplay, optionsContainer);
    selectElement.style.display = 'none';
    container.appendChild(customDropdown);
    updateOptions();
}

export function initDropdowns() {
    document.querySelectorAll('.registration-form select').forEach(createDropdown);
    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', e => e.key === 'Escape' && closeAllDropdowns());
}

// FIXED: This function now correctly syncs the display text with the select's current value.
export function updateSelectOptions(select, options, placeholder) {
    const currentValue = select.value; // Store the current value before clearing
    select.innerHTML = `<option value="">${placeholder}</option>`;
    
    let isCurrentValueStillValid = false;
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        select.appendChild(option);
        if (opt.value === currentValue) {
            isCurrentValueStillValid = true;
        }
    });

    // Restore the value if it's still a valid option, otherwise reset.
    select.value = isCurrentValueStillValid ? currentValue : "";

    // Now, update the custom display to match the real select's state.
    const customSelected = select.parentElement.querySelector('.selected-option');
    if (customSelected) {
        // Find the text of the selected option in the real select
        const selectedIndex = select.selectedIndex > -1 ? select.selectedIndex : 0;
        customSelected.textContent = select.options[selectedIndex].textContent;
    }

    select.dispatchEvent(new Event('update'));
}