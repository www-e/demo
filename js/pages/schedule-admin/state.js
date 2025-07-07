// js/pages/schedule-admin/state.js
let allSchedules = [];
let allMaterials = [];
let isEditingGroup = null;

export const state = {
    getSchedules: () => allSchedules,
    setSchedules: (schedules) => { allSchedules = schedules; },

    getMaterials: () => allMaterials,
    setMaterials: (materials) => { allMaterials = materials; },

    getEditingGroup: () => isEditingGroup,
    setEditingGroup: (group) => { isEditingGroup = group; },
    setTeachers(teachers) {
        this.teachers = teachers;
    },
    
    setMaterials(materials) {
        this.materials = materials;
    },
    
    getTeachers() {
        return this.teachers || [];
    },
    
    getMaterials() {
        return this.materials || [];
    }
    
};