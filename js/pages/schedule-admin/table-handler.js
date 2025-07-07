// js/pages/schedule-admin/table-handler.js
import { translateGrade, convertTo12HourArabic, populateSelect } from './ui-helpers.js';

export function createTableHandler(elements, onEdit, onDelete) {
    let currentGradeFilter = 'all';

    function resetFilters() {
        currentGradeFilter = 'all';
        elements.gradeFiltersContainer.querySelector('.active')?.classList.remove('active');
        elements.gradeFiltersContainer.querySelector('[data-grade="all"]').classList.add('active');
        
        elements.teacherFilterSelect.value = 'all';
        elements.materialFilterSelect.value = 'all';
        elements.centerFilterSelect.value = 'all';
        elements.groupFilterSelect.value = 'all';
    }

    function render(allSchedules = []) {
        let dataToRender = [...allSchedules];

        if (currentGradeFilter !== 'all') dataToRender = dataToRender.filter(s => s.grade === currentGradeFilter);
        
        const centerFilterValue = elements.centerFilterSelect.value;
        if (centerFilterValue !== 'all') dataToRender = dataToRender.filter(s => s.center_id === centerFilterValue);

        const teacherFilterValue = elements.teacherFilterSelect.value;
        if (teacherFilterValue !== 'all') dataToRender = dataToRender.filter(s => s.teacher_id === teacherFilterValue);
        
        const materialFilterValue = elements.materialFilterSelect.value;
        if (materialFilterValue !== 'all') dataToRender = dataToRender.filter(s => s.material_id === materialFilterValue);

        if (elements.groupFilterSelect.value !== 'all') dataToRender = dataToRender.filter(s => s.group_name === elements.groupFilterSelect.value);

        elements.tableBody.innerHTML = '';
        elements.mobileCardView.innerHTML = '';
        if (dataToRender.length === 0) {
            const emptyHTML = `<tr><td colspan="8" class="text-center p-4">لا توجد بيانات تطابق الفلتر.</td></tr>`;
            elements.tableBody.innerHTML = emptyHTML;
            elements.mobileCardView.innerHTML = `<div class="text-center p-4 text-muted">لا توجد بيانات.</div>`;
            return;
        }

        const gradeColors = { first: 'grade-first', second: 'grade-second', third: 'grade-third' };
        dataToRender.forEach((s, index) => {
            if (!s.is_active) return;
            const colorClass = gradeColors[s.grade] || '';
            const actionButtonsHTML = `<button class="btn-action edit" data-group="${s.group_name}" data-grade="${s.grade}" data-teacher="${s.teacher_id || ''}" data-material="${s.material_id || ''}" data-center="${s.center_id || ''}" title="تعديل"><i class="fas fa-edit"></i></button><button class="btn-action delete" data-id="${s.id}" title="حذف"><i class="fas fa-trash-alt"></i></button>`;
            
            const groupTimeHTML = `<strong>${s.group_name}</strong><br><span class="time-tag">${convertTo12HourArabic(s.time_slot)}</span>`;
            const teacherName = s.teacher?.name || 'عام';
            const materialName = s.material?.name || 'عامة';
            const centerName = s.center?.name || 'عام';

            const desktopRowHTML = `<tr class="${colorClass}"><td class="text-center">${index + 1}</td><td>${centerName}</td><td><span class="badge ${colorClass}">${translateGrade(s.grade)}</span></td><td>${groupTimeHTML}</td><td>${teacherName}</td><td>${materialName}</td><td>${new Date(s.created_at).toLocaleDateString('ar-EG')}</td><td><div class="action-buttons">${actionButtonsHTML}</div></td></tr>`;
            elements.tableBody.insertAdjacentHTML('beforeend', desktopRowHTML);

            const mobileCardHTML = `<div class="mobile-card ${colorClass}"><div class="card-header"><span class="group-name">${s.group_name} - ${convertTo12HourArabic(s.time_slot)}</span><span class="badge ${colorClass}">${translateGrade(s.grade)}</span></div><div class="card-body-grid"><div class="card-row"><span class="card-label">المركز:</span><span class="card-value">${centerName}</span></div><div class="card-row"><span class="card-label">المدرس:</span><span class="card-value">${teacherName}</span></div><div class="card-row"><span class="card-label">المادة:</span><span class="card-value">${materialName}</span></div></div><div class="card-footer action-buttons">${actionButtonsHTML}</div></div>`;
            elements.mobileCardView.insertAdjacentHTML('beforeend', mobileCardHTML);
        });
    }

    // FIXED: This function now exists and populates all necessary filters.
    function populateFilterDropdowns(schedules, teachers, materials, centers) {
        populateSelect(elements.centerFilterSelect, [{v:'all', t:'كل المراكز'}, ...centers.map(c => ({v: c.id, t: c.name}))]);
        populateSelect(elements.teacherFilterSelect, [{v:'all', t:'كل المدرسين'}, ...teachers.map(t => ({v: t.id, t: t.name}))]);
        populateSelect(elements.materialFilterSelect, [{v:'all', t:'كل المواد'}, ...materials.map(m => ({v: m.id, t: m.name}))]);
        populateGroupFilter(schedules);
    }
    
    function populateGroupFilter(allSchedules = []) {
        const uniqueGroups = [...new Map(allSchedules.map(s => [s.group_name, s])).values()];
        elements.groupFilterSelect.innerHTML = '<option value="all">كل المجموعات</option>';
        uniqueGroups.forEach(s => elements.groupFilterSelect.innerHTML += `<option value="${s.group_name}">${s.group_name}</option>`);
    }

    function handleGradeFilterClick(e, allSchedules) {
        if (!e.target.matches('.filter-btn')) return;
        elements.gradeFiltersContainer.querySelector('.active')?.classList.remove('active');
        e.target.classList.add('active');
        currentGradeFilter = e.target.dataset.grade;
        render(allSchedules);
    }
    
    elements.schedulesTableContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit');
        const deleteBtn = e.target.closest('.delete');
        if (editBtn) onEdit(editBtn.dataset);
        if (deleteBtn) onDelete(deleteBtn.dataset.id);
    });

    // FIXED: Exporting the newly created function
    return { render, populateFilterDropdowns, handleGradeFilterClick, resetFilters };
}