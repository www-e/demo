// js/pages/schedule-admin/table-handler.js
import { translateGrade, convertTo12HourArabic } from './ui-helpers.js';

export function createTableHandler(elements, onEdit, onDelete) {
    let currentGradeFilter = 'all';

    // NEW: Function to reset all filters to their default 'all' state.
    function resetFilters() {
        currentGradeFilter = 'all'; // 1. Reset the internal grade filter state
        
        // 2. Reset the grade filter buttons in the UI
        elements.gradeFiltersContainer.querySelector('.active')?.classList.remove('active');
        elements.gradeFiltersContainer.querySelector('[data-grade="all"]').classList.add('active');
        
        // 3. Reset the dropdown filters in the UI
        elements.teacherFilterSelect.value = 'all';
        elements.materialFilterSelect.value = 'all'; // ADDED
        elements.groupFilterSelect.value = 'all';
    }

    function render(allSchedules = []) {
        let dataToRender = [...allSchedules];

        // Apply Grade Filter
        if (currentGradeFilter !== 'all') {
            dataToRender = dataToRender.filter(s => s.grade === currentGradeFilter);
        }

        // Apply Teacher Filter
        const teacherFilterValue = elements.teacherFilterSelect.value;
        if (teacherFilterValue !== 'all') {
            if (teacherFilterValue) { // Handles specific teachers
                dataToRender = dataToRender.filter(s => s.teacher_id === teacherFilterValue);
            } else { // Handles "عام" which has a null teacher_id
                dataToRender = dataToRender.filter(s => s.teacher_id === null);
            }
        }

        // Apply Material Filter
        if (elements.materialFilterSelect.value !== 'all') {
            dataToRender = dataToRender.filter(s => s.material_id === elements.materialFilterSelect.value);
        }

        // Apply Group Filter
        if (elements.groupFilterSelect.value !== 'all') {
            dataToRender = dataToRender.filter(s => s.group_name === elements.groupFilterSelect.value);
        }

        elements.tableBody.innerHTML = '';
        elements.mobileCardView.innerHTML = '';
        if (dataToRender.length === 0) {
            const emptyHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد بيانات تطابق الفلتر.</td></tr>';
            elements.tableBody.innerHTML = emptyHTML;
            elements.mobileCardView.innerHTML = `<div class="text-center p-4 text-muted">لا توجد بيانات.</div>`;
            return;
        }

        const gradeColors = { first: 'grade-first', second: 'grade-second', third: 'grade-third' };
        dataToRender.forEach((s, index) => {
            if (!s.is_active) return;
            const colorClass = gradeColors[s.grade] || '';
            const actionButtonsHTML = `<button class="btn-action edit" data-group="${s.group_name}" data-grade="${s.grade}" data-teacher="${s.teacher_id || ''}" data-material="${s.material_id || ''}" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn-action delete" data-id="${s.id}" title="حذف"><i class="fas fa-trash-alt"></i></button>`;
            
            const groupTimeHTML = `<strong>${s.group_name}</strong><br><span class="time-tag">${convertTo12HourArabic(s.time_slot)}</span>`;
            const teacherName = s.teacher?.name || 'عام (متاح للجميع)';
            const materialName = s.material?.name || 'عامة';
            const desktopRowHTML = `<tr class="${colorClass}"><td class="text-center">${index + 1}</td><td><span class="badge ${colorClass}">${translateGrade(s.grade)}</span></td><td>${groupTimeHTML}</td><td>${teacherName}</td><td>${materialName}</td><td>${new Date(s.created_at).toLocaleDateString('ar-EG')}</td><td><div class="action-buttons">${actionButtonsHTML}</div></td></tr>`;
            elements.tableBody.insertAdjacentHTML('beforeend', desktopRowHTML);

            const mobileCardHTML = `<div class="mobile-card ${colorClass}"><div class="card-header"><span class="group-name">${s.group_name} - ${convertTo12HourArabic(s.time_slot)}</span><span class="badge ${colorClass}">${translateGrade(s.grade)}</span></div><div class="card-body-grid"><div class="card-row"><span class="card-label">المدرس:</span><span class="card-value">${teacherName}</span></div><div class="card-row"><span class="card-label">المادة:</span><span class="card-value">${materialName}</span></div></div><div class="card-footer action-buttons">${actionButtonsHTML}</div></div>`;
            elements.mobileCardView.insertAdjacentHTML('beforeend', mobileCardHTML);
        });
    }

    function populateGroupFilter(allSchedules = []) {
        const relevantSchedules = (currentGradeFilter === 'all') ? allSchedules : allSchedules.filter(s => s.grade === currentGradeFilter);
        const uniqueGroups = [...new Map(relevantSchedules.map(s => [s.group_name, s])).values()];
        elements.groupFilterSelect.innerHTML = '<option value="all">كل المجموعات</option>';
        uniqueGroups.forEach(s => elements.groupFilterSelect.innerHTML += `<option value="${s.group_name}">${s.group_name}</option>`);
    }

    function handleGradeFilterClick(e, allSchedules) {
        if (e.target.tagName !== 'BUTTON') return;
        elements.gradeFiltersContainer.querySelector('.active')?.classList.remove('active');
        e.target.classList.add('active');
        currentGradeFilter = e.target.dataset.grade;
        
        elements.teacherFilterSelect.value = 'all';
        elements.materialFilterSelect.value = 'all'; // ADDED
        elements.groupFilterSelect.value = 'all';

        populateGroupFilter(allSchedules);
        render(allSchedules);
    }
    
    elements.schedulesTableContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit');
        const deleteBtn = e.target.closest('.delete');
        if (editBtn) onEdit(editBtn.dataset);
        if (deleteBtn) onDelete(deleteBtn.dataset.id);
    });

    // MODIFIED: Expose the new resetFilters function
    return { render, populateGroupFilter, handleGradeFilterClick, resetFilters };
}