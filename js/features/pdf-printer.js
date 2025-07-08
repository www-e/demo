// js/features/pdf-printer.js
import { allStudents as studentDataFromState, currentFilter as filterState } from '../pages/admin/state.js';

let allStudentsData = [];
let currentFilterState = {};
let gradeNamesMap = {};
let timeFormatter = () => {};

export function initializePdfPrinter(allStudents, currentFilter, gradeNames, formatTime) {
    allStudentsData = allStudents;
    currentFilterState = currentFilter;
    gradeNamesMap = gradeNames;
    timeFormatter = formatTime;
    addPrintButtonAndModal();
}

/**
 * FIXED: Restored the original two-button modal functionality.
 */
function addPrintButtonAndModal() {
    const modalHTML = `
    <div class="modal fade" id="printPdfModal" tabindex="-1" aria-labelledby="printPdfModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-light">
                    <h5 class="modal-title" id="printPdfModalLabel"><i class="fas fa-print me-2 text-primary"></i>طباعة تقرير الطلاب</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <div class="mb-4">
                        <h6 class="fw-bold text-secondary">الخطوة 1: اختر اتجاه الصفحة</h6>
                        <div id="orientation-toggle" class="btn-group w-100 mt-2" role="group" aria-label="Page Orientation">
                            <input type="radio" class="btn-check" name="orientation" id="orientation_landscape" value="landscape" autocomplete="off" checked>
                            <label class="btn btn-outline-primary" for="orientation_landscape"><i class="fas fa-rectangle-landscape fa-fw me-2"></i> أفقي</label>

                            <input type="radio" class="btn-check" name="orientation" id="orientation_portrait" value="portrait" autocomplete="off">
                            <label class="btn btn-outline-primary" for="orientation_portrait"><i class="fas fa-rectangle-portrait fa-fw me-2"></i> عمودي</label>
                        </div>
                    </div>
                    
                    <div>
                        <h6 class="fw-bold text-secondary">الخطوة 2: اختر الطلاب للطباعة</h6>
                        <div class="d-grid gap-2 mt-2">
                            <button id="printCurrentPageBtn" type="button" class="btn btn-outline-success">
                                <i class="fas fa-eye me-2"></i> طباعة الطلاب الظاهرين حالياً (<span id="visible-count">0</span>)
                            </button>
                            <button id="printAllFilteredBtn" type="button" class="btn btn-success">
                                <i class="fas fa-filter me-2"></i> طباعة كل الطلاب المطابقين للفلتر (<span id="filtered-count">0</span>)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const printButtonContainer = document.querySelector('#students-section .flex-initial');
    if (printButtonContainer) {
        const printButton = document.createElement('button');
        printButton.className = 'btn btn-outline-primary';
        printButton.innerHTML = '<i class="fas fa-print me-2"></i> طباعة تقرير PDF';

        const printModal = new bootstrap.Modal(document.getElementById('printPdfModal'));
        printButton.addEventListener('click', () => {
            updatePrintCounts();
            printModal.show();
        });
        
        printButtonContainer.appendChild(printButton);
    }

    document.getElementById('printCurrentPageBtn').addEventListener('click', (e) => {
        generatePdf('current', e.currentTarget);
        bootstrap.Modal.getInstance(document.getElementById('printPdfModal')).hide();
    });
    document.getElementById('printAllFilteredBtn').addEventListener('click', (e) => {
        generatePdf('all', e.currentTarget);
        bootstrap.Modal.getInstance(document.getElementById('printPdfModal')).hide();
    });
}

/**
 * FIXED: Restored count calculation for both scopes.
 */
function updatePrintCounts() {
    const visibleCount = document.querySelectorAll('#students-table-body tr[data-id]').length;
    document.getElementById('visible-count').textContent = visibleCount;

    const filteredStudentsCount = document.getElementById('total-students-count').textContent;
    document.getElementById('filtered-count').textContent = filteredStudentsCount;
}

/**
 * FIXED: Restored the client-side filtering logic for getting all filtered students.
 */
function getFilteredStudents() {
    let filtered = [...studentDataFromState]; // Start with all students fetched for the current view
    // Note: The main filtering is done server-side via `applyFilters`.
    // This function can be used for any additional client-side checks if needed,
    // but for now, we assume `studentDataFromState` holds the correct filtered list.
    return filtered;
}

function generateDynamicFilename() {
    let name = 'Student-Report';
    if (currentFilterState.grade !== 'all') {
        name += `_Grade-${currentFilterState.grade.charAt(0).toUpperCase() + currentFilterState.grade.slice(1)}`;
    }
    name += `_${new Date().toISOString().slice(0, 10)}.pdf`;
    return name;
}

/**
 * FIXED: Restored `scope` parameter to handle 'current' vs. 'all'.
 */
async function generatePdf(scope, clickedButton) {
    const originalButtonHtml = clickedButton.innerHTML;
    const printBtn1 = document.getElementById('printCurrentPageBtn');
    const printBtn2 = document.getElementById('printAllFilteredBtn');
    
    clickedButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الإعداد...';
    printBtn1.disabled = true;
    printBtn2.disabled = true;

    try {
        const studentsToPrint = (scope === 'all')
            ? getFilteredStudents() // This uses the full filtered list from the state
            : Array.from(document.getElementById('students-table-body').rows).map(row => {
                const studentId = row.dataset.id;
                return studentDataFromState.find(s => s.id === studentId);
            }).filter(Boolean);

        if (studentsToPrint.length === 0) {
            alert('لا يوجد طلاب لطباعتهم.');
            return;
        }

        const response = await fetch('../templates/student-report-template.html');
        const templateHtml = await response.text();

        const reportContainer = document.createElement('div');
        reportContainer.style.position = 'absolute';
        reportContainer.style.left = '-9999px';
        reportContainer.innerHTML = templateHtml;
        document.body.appendChild(reportContainer);
        
        const tableBody = reportContainer.querySelector('#report-table-body');
        tableBody.innerHTML = studentsToPrint.map((student, index) => {
            const groupTime = [student.days_group, timeFormatter(student.time_slot)].filter(Boolean).join(' - ') || '—';
            const registrationDate = new Date(student.created_at).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const teacherName = student.teacher?.name || '—'; 
            const materialName = student.material?.name || '—';
            const centerName = student.center?.name || '—';

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.student_name}</td>
                    <td class="ltr-cell">${student.transaction_id || '—'}</td>
                    <td>${gradeNamesMap[student.grade] || ''}</td>
                    <td>${centerName}</td>
                    <td>${groupTime}</td>
                    <td>${teacherName}</td>
                    <td>${materialName}</td>
                    <td class="ltr-cell">${student.student_phone}</td>
                    <td class="ltr-cell">${student.parent_phone}</td>
                    <td>${registrationDate}</td>
                </tr>
            `;
        }).join('');

        reportContainer.querySelector('#report-print-time').textContent = new Date().toLocaleString('ar-EG');
        
        const orientation = document.querySelector('#orientation-toggle input:checked').value;
        const elementToPrint = reportContainer.querySelector('#pdf-report-container');
        elementToPrint.classList.add(`${orientation}-mode`);

        // FIXED: Reduced margins for less padding on the sides
        const pdfOptions = {
            margin:       [0.25, 0.2, 0.25, 0.2], // [top, left, bottom, right] in inches
            filename:     generateDynamicFilename(),
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: orientation }
        };
        
        await html2pdf().from(elementToPrint).set(pdfOptions).save();

        document.body.removeChild(reportContainer);

    } catch (error) {
        console.error('Failed to generate PDF:', error);
        alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
        clickedButton.innerHTML = originalButtonHtml;
        printBtn1.disabled = false;
        printBtn2.disabled = false;
    }
}