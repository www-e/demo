// js/pages/schedule-admin/main-admin.js
import { initializeUpdateModal } from '../../components/update-modal.js';
import { TeacherModal } from '../../components/teacher-modal.js'; // Re-added
import { MaterialModal } from '../../components/material-modal.js';
import { elements } from './dom-elements.js';
import { showToast, showLoader } from './ui-helpers.js';
import { createTimeBuilder } from './time-builder.js';
import { createTableHandler } from './table-handler.js';
import { fetchTeachers } from '../../services/teacher-service.js';
import { fetchMaterials } from '../../services/material-service.js'; // ADDED
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
    const teacherModal = new TeacherModal(); // Re-instantiated
    const materialModal = new MaterialModal();
    const formManager = createFormManager(elements, timeBuilder);
    
    let tableHandler; 
    let eventHandlers;

    // --- Core Data Loading and Rendering Workflow ---
    async function loadAndRenderAllData() {
        showLoader(elements.loader, elements.schedulesTableContainer, true);

        try {
            // Step 1: Fetch all data concurrently and wait for both to complete.
            const [schedules, teachers, materials] = await Promise.all([
                ScheduleService.fetchSchedulesWithTeachers(),
                fetchTeachers(),
                fetchMaterials() // ADDED
            ]);

            // Step 2: Update the application's internal state.
            state.setSchedules(schedules);
            state.setTeachers(teachers);
            state.setMaterials(materials); // ADDED

            // Step 3: Populate UI dropdowns with the new data.
            formManager.populateTeacherSelects(teachers);
            formManager.populateMaterialSelect(materials); // ADDED
            tableHandler.populateGroupFilter(schedules);
            
            // THE FIX: The order is now correct. Reset filters AFTER dropdowns are populated.
            // This ensures the .value = "all" sticks and doesn't get reset.
            tableHandler.resetFilters();

            // Step 4: Now, with correct filters, render the table and other UI.
            tableHandler.render(schedules);
            teacherModal.renderTeachersList(teachers);
            materialModal.renderMaterialsList(materials); // ADDED

        } catch (error) {
            showToast('خطأ في تحميل البيانات: ' + error.message, 'error');
            elements.tableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-danger">فشل تحميل البيانات. يرجى تحديث الصفحة.</td></tr>';
        } finally {
            showLoader(elements.loader, elements.schedulesTableContainer, false);
        }
    }

    // --- Create Event Handlers (dependencies are injected) ---
    eventHandlers = createEventHandlers({
        elements,
        state,
        timeBuilder,
        teacherModal,
        materialModal, // ADDED
        formManager,
        loadAndRenderAllData // Pass the refresh function
    });

    // --- Create Table Handler ---
    tableHandler = createTableHandler(elements, eventHandlers.handleEditGroup, eventHandlers.handleDelete);

    // --- Setup Event Listeners ---
    function setupEventListeners() {
        formManager.initializeBaseUIDropdowns();
        timeBuilder.setup();
        eventHandlers.setupTeacherModalListeners();
        eventHandlers.setupMaterialModalListeners(); // ADDED

        elements.form.addEventListener('submit', eventHandlers.handleSave);
        elements.cancelBtn.addEventListener('click', () => formManager.resetForm(state.setEditingGroup));
        elements.addTeacherBtn.addEventListener('click', eventHandlers.handleAddTeacher); // Re-added
        elements.addMaterialBtn.addEventListener('click', eventHandlers.handleAddMaterial);
        
        elements.groupNameSelect.addEventListener('change', () => { 
            elements.groupNameCustomInput.style.display = (elements.groupNameSelect.value === 'custom') ? 'block' : 'none'; 
        });
        
        // Filter event listeners
        elements.gradeFiltersContainer.addEventListener('click', (e) => tableHandler.handleGradeFilterClick(e, state.getSchedules()));
        elements.groupFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules()));
        if (elements.teacherFilterSelect) {
            elements.teacherFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules()));
        }
        if (elements.materialFilterSelect) { // ADDED
            elements.materialFilterSelect.addEventListener('change', () => tableHandler.render(state.getSchedules())); // ADDED
        } // ADDED
    }

    // --- Application Start ---
    setupEventListeners();
    loadAndRenderAllData(); // Initial data load
});