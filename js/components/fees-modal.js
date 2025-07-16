// js/components/fees-modal.js

const MODAL_SESSION_KEY = 'feesModalShown';

export class FeesModal {
    constructor() {
        this.modalElement = null;
        this.createModal();
        this.showOncePerSession();
        this.setupScrollIndicator();
    }

    createModal() {
        const modalHTML = `
        <div class="fees-modal-overlay" id="fees-modal-overlay">
            <div class="fees-modal-content" id="fees-modal-content">
                <div class="fees-modal-header">
                    <h3><i class="fas fa-file-invoice-dollar"></i> تفاصيل رسوم الحجز للعام الدراسي 2025-2026</h3>
                    <button class="fees-modal-close" id="fees-modal-close-btn">×</button>
                </div>
                <div class="fees-modal-body">
                    <div class="fee-card universal-fee">
                        <div class="fee-card-header">
                            <span class="fee-icon"><i class="fas fa-ticket-alt"></i></span>
                            <h4>رسوم أساسية (لجميع الصفوف)</h4>
                        </div>
                        <div class="fee-details">
                            <div class="fee-item">
                                <span>كرت السنتر</span>
                                <span class="fee-price">30 جنيه</span>
                            </div>
                        </div>
                    </div>

                    <div class="fee-card grade-first">
                        <div class="fee-card-header">
                            <span class="fee-icon"><i class="fas fa-child"></i></span>
                            <h4>الصف الأول الثانوي</h4>
                        </div>
                        <div class="fee-details">
                            <div class="fee-item">
                                <span>رسوم المادة</span>
                                <span class="fee-price">25 جنيه</span>
                            </div>
                        </div>
                        <div class="fee-total">
                            <span>الإجمالي</span>
                            <span class="fee-price-total">55 جنيه</span>
                        </div>
                    </div>

                    <div class="fee-card grade-second">
                        <div class="fee-card-header">
                            <span class="fee-icon"><i class="fas fa-user-graduate"></i></span>
                            <h4>الصف الثاني الثانوي</h4>
                        </div>
                        <div class="fee-details">
                             <div class="fee-item">
                                <span>مادة البحتة</span>
                                <span class="fee-price">25 جنيه</span>
                            </div>
                            <div class="fee-item">
                                <span>مادة التطبيقية</span>
                                <span class="fee-price">50 جنيه</span>
                            </div>
                        </div>
                         <div class="fee-note">
                            <i class="fas fa-exclamation-circle"></i>
                            يجب حجز المادتين معًا (بحتة وتطبيقية).
                        </div>
                        <div class="fee-total">
                            <span>الإجمالي</span>
                            <span class="fee-price-total">105 جنيه</span>
                        </div>
                    </div>

                    <div class="fee-card grade-third">
                        <div class="fee-card-header">
                             <span class="fee-icon"><i class="fas fa-crown"></i></span>
                            <h4>الصف الثالث الثانوي</h4>
                        </div>
                        <div class="fee-details">
                           <div class="fee-item">
                                <span>مادة البحتة</span>
                                <span class="fee-price">30 جنيه</span>
                            </div>
                            <div class="fee-item">
                                <span>مادة التطبيقية</span>
                                <span class="fee-price">55 جنيه</span>
                            </div>
                        </div>
                         <div class="fee-note">
                            <i class="fas fa-exclamation-circle"></i>
                            يجب حجز المادتين معًا (بحتة وتطبيقية).
                        </div>
                        <div class="fee-total">
                            <span>الإجمالي</span>
                            <span class="fee-price-total">115 جنيه</span>
                        </div>
                    </div>
                </div>
                <div class="scroll-indicator" id="fees-modal-scroll-indicator">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById('fees-modal-overlay');

        // Add event listeners
        document.getElementById('fees-modal-close-btn').addEventListener('click', () => this.hide());
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        });
    }

    show() {
        if (this.modalElement) {
            this.modalElement.classList.add('active');
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
    }

    hide() {
        if (this.modalElement) {
            this.modalElement.classList.remove('active');
            // Restore body scroll
            document.body.style.overflow = '';
        }
    }

    showOncePerSession() {
        if (!sessionStorage.getItem(MODAL_SESSION_KEY)) {
            // Use a small delay to allow the page to render before showing the modal
            setTimeout(() => {
                this.show();
                sessionStorage.setItem(MODAL_SESSION_KEY, 'true');
            }, 500);
        }
    }
    setupScrollIndicator() {
    const modalBody = this.modalElement.querySelector('.fees-modal-body');
    const scrollIndicator = this.modalElement.querySelector('#fees-modal-scroll-indicator');

    if (!modalBody || !scrollIndicator) return;

    const checkScroll = () => {
        // isContentScrollable: checks if the content height is greater than the visible area
        const isContentScrollable = modalBody.scrollHeight > modalBody.clientHeight;
        // isScrolledToBottom: checks if the user has scrolled to the end (with a 5px buffer)
        const isScrolledToBottom = modalBody.scrollHeight - modalBody.scrollTop <= modalBody.clientHeight + 5;

        if (isContentScrollable && !isScrolledToBottom) {
            scrollIndicator.classList.add('visible');
        } else {
            scrollIndicator.classList.remove('visible');
        }
    };

    // Check scroll on modal open
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.attributeName === 'class' && this.modalElement.classList.contains('active')) {
                // Use a timeout to ensure content is fully rendered before checking scroll height
                setTimeout(checkScroll, 100);
            }
        }
    });
    
    observer.observe(this.modalElement, { attributes: true });

    // Check scroll while the user is scrolling inside the modal
    modalBody.addEventListener('scroll', checkScroll);
}
}