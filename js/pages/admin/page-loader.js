// js/page-loader.js
export function initializePageLoader() {
    const pageLoader = document.getElementById('page-loader');
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hostname === window.location.hostname) {
                pageLoader?.classList.remove('hidden');
            }
        });
    });
}
