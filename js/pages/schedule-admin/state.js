// js/pages/schedule-admin/state.js
let allSchedules = [];
let allMaterials = [];
let allTeachers = [];
let allCenters = []; // ADDED
let isEditingGroup = null;

export const state = {
    getSchedules: () => allSchedules,
    setSchedules: (schedules) => { allSchedules = schedules; },

    getMaterials: () => allMaterials,
    setMaterials: (materials) => { allMaterials = materials; },

    getTeachers: () => allTeachers,
    setTeachers: (teachers) => { allTeachers = teachers; },

    getCenters: () => allCenters, // ADDED
    setCenters: (centers) => { allCenters = centers; }, // ADDED

    getEditingGroup: () => isEditingGroup,
    setEditingGroup: (group) => { isEditingGroup = group; },
};