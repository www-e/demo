// js/components/update-modal.js

// IMPORTANT: Update the modal ID to force it to show for all users again
const MODAL_ID = 'whatsNewModal_v2'; // Changed from v1 to v2
const MODAL_COOLDOWN_HOURS = 4; // Cooldown period in hours before showing the modal again

const MODAL_HTML = `
<div class="modal fade" id="whatsNewModal" tabindex="-1" aria-labelledby="whatsNewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="whatsNewModalLabel">
                    <i class="fas fa-sparkles"></i> تحديثات جديدة في لوحة التحكم!
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p class="intro-text">تمت إضافة تحسينات جديدة لتسهيل عملك:</p>
                <div class="feature-list">
                    <!-- NEW FEATURE ANNOUNCEMENT ADDED HERE -->
                    <div class="feature-item">
                        <div class="feature-icon"><i class="fas fa-file-pdf"></i></div>
                        <div class="feature-text">
                            <h6>تقارير PDF احترافية</h6>
                            <p>يمكنك الآن طباعة قوائم الطلاب في ملفات PDF منظمة، مع خيارات لاختيار الاتجاه (أفقي/عمودي) والأعمدة التي تريد عرضها.</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon"><i class="fas fa-hand-pointer"></i></div>
                        <div class="feature-text">
                            <h6>عرض سريع لبيانات الطلاب</h6>
                            <p>اضغط على أي صف في جدول الطلاب لعرض جميع بياناته في نافذة منبثقة ومنظمة.</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon"><i class="fab fa-whatsapp"></i></div>
                        <div class="feature-text">
                            <h6>تواصل أسرع عبر واتساب</h6>
                            <p>أصبحت أرقام الهواتف (للطالب وولي الأمر) قابلة للضغط لفتح محادثة واتساب مباشرة.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">فهمت، شكرًا!</button>
            </div>
        </div>
    </div>
</div>
`;

const MODAL_CSS = `
    #whatsNewModal .modal-content { border-radius: var(--radius-xl); border: none; box-shadow: var(--shadow-xl); }
    #whatsNewModal .modal-header { background-color: var(--primary); color: white; border-bottom: none; }
    #whatsNewModal .modal-header .btn-close { filter: brightness(0) invert(1); }
    #whatsNewModal .modal-title { font-weight: var(--font-weight-bold); }
    #whatsNewModal .modal-body { padding: 2rem; }
    #whatsNewModal .intro-text { font-size: 1.1rem; color: var(--text-secondary); text-align: center; margin-bottom: 2rem; }
    #whatsNewModal .feature-list { display: flex; flex-direction: column; gap: 1.5rem; }
    #whatsNewModal .feature-item { display: flex; align-items: flex-start; gap: 1.5rem; }
    #whatsNewModal .feature-icon { font-size: 1.5rem; color: white; background: var(--gradient-primary); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    #whatsNewModal .feature-text h6 { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem; }
    #whatsNewModal .feature-text p { color: var(--text-secondary); margin-bottom: 0; }
    #whatsNewModal .modal-footer { border-top: 1px solid var(--border-color); }
`;

export function initializeUpdateModal() {
    // Check if we should show the modal
    const lastShown = localStorage.getItem(MODAL_ID);
    const now = new Date().getTime();

    if (lastShown) {
        const hoursSinceShown = (now - parseInt(lastShown)) / (1000 * 60 * 60);
        if (hoursSinceShown < MODAL_COOLDOWN_HOURS) {
            console.log("Update modal is on cooldown. Will not show.");
            return;
        }
    }

    // Inject CSS and HTML
    const styleSheet = document.createElement("style");
    styleSheet.innerText = MODAL_CSS;
    document.head.appendChild(styleSheet);
    document.body.insertAdjacentHTML('beforeend', MODAL_HTML);

    // Show the modal
    const modalElement = document.getElementById('whatsNewModal');
    const updateModal = new bootstrap.Modal(modalElement);
    updateModal.show();

    // Set the timestamp in localStorage after showing it
    localStorage.setItem(MODAL_ID, now.toString());
}