// js/pages/schedule-admin/dom-elements.js
export const elements = {
    form: document.getElementById('scheduleForm'),
    formTitle: document.getElementById('formTitle'),
    gradeSelect: document.getElementById('grade'),
    materialSelect: document.getElementById('material'),
    centerSelect: document.getElementById('center'), // ADDED
    teacherSelect: document.getElementById('teacher'), // ADDED
    addMaterialBtn: document.getElementById('addMaterialBtn'),
    addTeacherBtn: document.getElementById('addTeacherBtn'), // ADDED
    groupNameSelect: document.getElementById('group_name_select'),
    groupNameCustomInput: document.getElementById('group_name_custom'),
    saveBtn: document.getElementById('saveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    tableBody: document.querySelector('#schedulesTable tbody') || document.getElementById('tableBody'),
    mobileCardView: document.getElementById('mobileCardView'),
    loader: document.getElementById('loader'),
    schedulesTableContainer: document.getElementById('schedulesTableContainer'),
    timeHourSelect: document.getElementById('time_hour'),
    timeMinuteSelect: document.getElementById('time_minute'),
    timePeriodSelect: document.getElementById('time_period'),
    timePreview: document.getElementById('timePreview'),
    addTimeBtn: document.getElementById('addTimeBtn'),
    timePillsContainer: document.getElementById('timePillsContainer'),
    gradeFiltersContainer: document.getElementById('gradeFilters'),
    groupFilterSelect: document.getElementById('groupFilter'),
    teacherFilterSelect: document.getElementById('teacherFilter'),
    materialFilterSelect: document.getElementById('materialFilter'),
    centerFilterSelect: document.getElementById('centerFilter'), // ADDED
    confirmationModal: new bootstrap.Modal(document.getElementById('confirmationModal')),
    confirmationModalTitle: document.getElementById('confirmationModalTitle'),
    confirmationModalBody: document.getElementById('confirmationModalBody'),
    confirmActionBtn: document.getElementById('confirmActionBtn'),
};