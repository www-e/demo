// js/pages/schedule-admin/state.js
let allSchedules = [];
let allTeachers = [];
let isEditingGroup = null;

export const state = {
    getSchedules: () => allSchedules,
    setSchedules: (schedules) => { allSchedules = schedules; },

    getTeachers: () => allTeachers,
    setTeachers: (teachers) => { allTeachers = teachers; },

    getEditingGroup: () => isEditingGroup,
    setEditingGroup: (group) => { isEditingGroup = group; }
};