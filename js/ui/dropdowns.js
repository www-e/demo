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
            
            // Core change: Add badge if data exists
            const badgeText = option.dataset.badgeText;
            const badgeClass = option.dataset.badgeClass;

            let badgeHTML = '';
            if (badgeText && badgeClass) {
                badgeHTML = `<span class="new-badge ${badgeClass}">${badgeText}</span>`;
            }
            
            // Use a span for the text to control layout
            dropdownOption.innerHTML = `<span class="time-text">${option.textContent}</span>${badgeHTML}`;

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

export function updateSelectOptions(select, options, placeholder) {
    const currentValue = select.value;
    select.innerHTML = `<option value="">${placeholder}</option>`;
    
    let isCurrentValueStillValid = false;
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        
        // Core change: Add badge data as data attributes
        if (opt.badgeText) {
            option.dataset.badgeText = opt.badgeText;
        }
        if (opt.badgeClass) {
            option.dataset.badgeClass = opt.badgeClass;
        }

        select.appendChild(option);
        if (opt.value === currentValue) {
            isCurrentValueStillValid = true;
        }
    });

    select.value = isCurrentValueStillValid ? currentValue : "";

    const customSelected = select.parentElement.querySelector('.selected-option');
    if (customSelected) {
        const selectedIndex = select.selectedIndex > -1 ? select.selectedIndex : 0;
        customSelected.textContent = select.options[selectedIndex].textContent;
    }

    select.dispatchEvent(new Event('update'));
}