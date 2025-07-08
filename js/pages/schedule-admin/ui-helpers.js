// js/pages/schedule-admin/ui-helpers.js

export const convertDigitsToArabic = (str) => str.toString().replace(/\d/g, d => ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'][d]);
export const convertTo24HourFormat = (h, m, p) => { let hours = parseInt(h, 10); if (p === 'PM' && hours < 12) hours += 12; if (p === 'AM' && hours === 12) hours = 0; return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
export const convertTo12HourArabic = (time24) => { if (!time24) return ''; const [h, m] = time24.split(':'); const hour = parseInt(h, 10); const period = hour >= 12 ? 'م' : 'ص'; const hour12 = hour % 12 === 0 ? 12 : hour % 12; return `${convertDigitsToArabic(hour12)}:${convertDigitsToArabic(m)} ${period}`; };
export const translateGrade = (g) => ({ first: 'الأول', second: 'الثاني', third: 'الثالث' }[g] || g);

export function showToast(message, type = 'success') {
    const toastTypeClass = `toast-${type}`;
    const toastHTML = `<div class="toast ${toastTypeClass}" role="alert"><div class="toast-header"><strong class="me-auto">إشعار</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button></div><div class="toast-body">${message}</div></div>`;
    document.getElementById('toastContainer').insertAdjacentHTML('beforeend', toastHTML);
    new bootstrap.Toast(document.getElementById('toastContainer').lastElementChild, { delay: 4000 }).show();
}

export function showConfirmation({ modal, title, body, confirmText, btnClass, onConfirm }) {
    modal.title.textContent = title;
    modal.body.textContent = body;
    modal.confirmBtn.textContent = confirmText;
    modal.confirmBtn.className = `btn ${btnClass}`;
    modal.confirmBtn.onclick = () => {
        onConfirm();
        modal.instance.hide();
    };
    modal.instance.show();
}

export function showLoader(loader, container, show) {
    if (loader) loader.style.display = show ? 'flex' : 'none';
    if (container) container.style.display = show ? 'none' : 'block';
}

export function populateSelect(select, options, placeholder = null) {
    select.innerHTML = ''; // Start with a clean slate
    if (placeholder) {
        select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
    }
    options.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt.v;
        optionEl.textContent = opt.t;
        if (opt.disabled) {
            optionEl.disabled = true;
            optionEl.style.color = 'var(--error-color)';
        }
        select.appendChild(optionEl);
    });
    if (!placeholder) {
        select.value = options.length > 0 ? options[0].v : "";
    } else {
        select.value = "";
    }
}