// js/services/schedule-service.js
import { supabase } from '../supabase-client.js';

export async function fetchSchedules() {
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

// ADDED: New function to fetch schedules with teacher and material information
export async function fetchSchedulesWithTeachers() {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
            *,
            teacher:teachers(id, name),
            material:materials(id, name)
        `)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function deleteScheduleById(id) {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
}

export async function saveSchedule(records, isEditing, oldGroupData) {
    // If editing, first delete all old entries for that group to avoid conflicts.
    if (isEditing && oldGroupData) {
        // The 'section' property is no longer part of oldGroupData.
        const { grade, group } = oldGroupData;

        // The delete query is now simpler. It matches only by group name and grade.
        let deleteQuery = supabase
            .from('schedules')
            .delete()
            .eq('group_name', group)
            .eq('grade', grade);

        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
    }
    
    // Insert the new or updated set of records.
    const { error: insertError } = await supabase.from('schedules').insert(records);
    if (insertError) throw insertError;
}

// ADDED: New function to save schedules with teacher and material support
export async function saveScheduleWithTeacherAndMaterial(records, isEditing, oldGroupData) {
    if (isEditing && oldGroupData) {
        const { grade, group, teacher, material } = oldGroupData;
        
        let deleteQuery = supabase
            .from('schedules')
            .delete()
            .eq('group_name', group)
            .eq('grade', grade);
            
        if (teacher) {
            deleteQuery = deleteQuery.eq('teacher_id', teacher);
        } else {
            deleteQuery = deleteQuery.is('teacher_id', null);
        }
        if (material) {
            deleteQuery = deleteQuery.eq('material_id', material);
        } else {
            deleteQuery = deleteQuery.is('material_id', null);
        }

        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
    }
    
    const { error: insertError } = await supabase.from('schedules').insert(records);
    if (insertError) throw insertError;
}