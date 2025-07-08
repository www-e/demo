// js/pages/schedule-admin/main-admin.js
import { initializeUpdateModal } from '../../components/update-modal.js';
import { TeacherModal } from '../../components/teacher-modal.js';
import { MaterialModal } from '../../components/material-modal.js';
import { elements } from './dom-elements.js';
import { showToast, showLoader } from './ui-helpers.js';
import { createTimeBuilder } from './time-builder.js';
import { createTableHandler } from './table-handler.js';
import { fetchTeachers } from '../../services/teacher-service.js';
import { fetchMaterials } from '../../services/material-service.js';
import { fetchCenters } from '../../services/center-service.js'; // ADDED
import * as ScheduleService from '../../services/schedule-service.js';
import { state } from './state.js';
import { createFormManager } from './ui-manager.js';
import { createEventHandlers } from './event-handlers.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Page Setup ---
    initializeUpdateModal();
    const pageLoader = document.getElementById('page-loader');
    if (pageLoader) pageLoader.classList.add('hidden');

    // --- Module & Component Initialization ---
    const timeBuilder = createTimeBuilder(elements);
    const teacherModal = new TeacherModal();
    const materialModal = new MaterialModal();
    const formManager = createFormManager(elements, timeBuilder);
    
    let tableHandler; 
    let eventHandlers;

    // --- Core Data Loading and Rendering Workflow ---
    async function loadAndRenderAllData() {
        showLoader(elements.loader, elements.schedulesTableContainer, true);

        try {
            const [schedules, teachers, materials, centers] = await Promise.all([ // ADDED centers
                ScheduleService.fetchSchedulesWithDetails(), // MODIFIED
                fetchTeachers(),
                fetchMaterials(),
                fetchCenters() // ADDED
            ]);

            state.setSchedules(schedules);
            state.setTeachers(teachers);
            state.setMaterials(materials);
            state.setCenters(centers); // ADDED

            formManager.populateTeacherSelects(teachers);
            formManager.populateMaterialSelects(materials);
            formManager.populateCenterSelects(centers); // ADDED
            
            tableHandler.populateFilterDropdowns(schedules, teachers, materials, centers);
            tableHandler.resetFilters();

            tableHandler.render(schedules);
            
        } catch (error) {
            console.error('Error loading data:', error);
            showToast('خطأ في تحميل البيانات: ' + error.message, 'error');
            const tableBody = document.querySelector('#schedulesTable tbody') || document.getElementById('tableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-danger">فشل تحميل البيانات. يرجى تحديث الصفحة.</td></tr>';
            }
        } finally {
            showLoader(elements.loader, elements.schedulesTableContainer, false);
        }
    }
    // 1. Create the tableHandler first, as eventHandlers will depend on it.
    // We pass temporary stubs for the onEdit/onDelete callbacks for now.
    tableHandler = createTableHandler(elements, 
        (dataset) => eventHandlers.handleEditGroup(dataset),
        (id) => eventHandlers.handleDelete(id)
    );
    // --- Create Event Handlers (dependencies are injected) ---
    eventHandlers = createEventHandlers({
        elements,
        state,
        timeBuilder,
        teacherModal,
        materialModal,
        formManager,
        tableHandler,
        loadAndRenderAllData // Pass the refresh function
    });

    // --- Create Table Handler ---
    tableHandler = createTableHandler(elements, eventHandlers.handleEditGroup, eventHandlers.handleDelete);

    // --- Setup Event Listeners ---
    function setupEventListeners() {
        formManager.initializeBaseUIDropdowns();
        timeBuilder.setup();
        eventHandlers.setupTeacherModalListeners();
        eventHandlers.setupMaterialModalListeners();

        if (elements.form) elements.form.addEventListener('submit', eventHandlers.handleSave);
        if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', () => formManager.resetForm(state.setEditingGroup));
        if (elements.addTeacherBtn) elements.addTeacherBtn.addEventListener('click', eventHandlers.handleAddTeacher);
        if (elements.addMaterialBtn) elements.addMaterialBtn.addEventListener('click', eventHandlers.handleAddMaterial);
        
        if (elements.groupNameSelect) {
            elements.groupNameSelect.addEventListener('change', () => { 
                elements.groupNameCustomInput.style.display = (elements.groupNameSelect.value === 'custom') ? 'block' : 'none'; 
            });
        }
        
        // Filter event listeners
        if (elements.gradeFiltersContainer) elements.gradeFiltersContainer.addEventListener('click', (e) => tableHandler.handleGradeFilterClick(e, state.getSchedules()));
        if (elements.groupFilterSelect) elements.groupFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules()));
        if (elements.teacherFilterSelect) elements.teacherFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules()));
        if (elements.materialFilterSelect) elements.materialFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules()));
        if (elements.centerFilterSelect) elements.centerFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules())); // ADDED
    }

    // --- Application Start ---
    setupEventListeners();
    loadAndRenderAllData(); // Initial data load
});