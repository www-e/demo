// js/pages/admin/helpers.js
export const convertTo12HourFormat = time24 => 
    time24 ? new Date(`1970-01-01T${time24}Z`).toLocaleTimeString('ar-EG', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true, 
        timeZone: 'UTC' 
    }) : '—';

export const formatFullDate = dateStr => 
    new Date(dateStr).toLocaleString('ar-EG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });

// NEW: Debounce function for search optimization
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

// NEW: Loading state helpers
export function showLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.remove('hidden');
}

export function hideLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('hidden');
}

// NEW: Enhanced toast with better error handling
export function showToast(message, type = 'success') {
    const toastTypeClasses = { success: 'bg-success', error: 'bg-danger', info: 'bg-info', warning: 'bg-warning' };
    const headerClass = toastTypeClasses[type] || 'bg-secondary';
    
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header text-white ${headerClass}">
                <strong class="me-auto">${type === 'error' ? 'خطأ' : 'إشعار'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        </div>`;
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }
    
    container.insertAdjacentHTML('beforeend', toastHTML);
    const newToast = container.lastElementChild;
    const bsToast = new bootstrap.Toast(newToast, { delay: type === 'error' ? 6000 : 4000 });
    bsToast.show();
    newToast.addEventListener('hidden.bs.toast', () => newToast.remove());
}
