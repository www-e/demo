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

// MODIFIED: Renamed and updated to fetch all related data
export async function fetchSchedulesWithDetails() {
    const { data, error } = await supabase
        .from('schedules')
        .select(`
            *,
            teacher:teachers(id, name),
            material:materials(id, name),
            center:centers(id, name)
        `)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function deleteScheduleById(id) {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
}

// MODIFIED: Updated to handle all new fields correctly on edit
export async function saveSchedule(records, isEditing, oldGroupData) {
    if (isEditing && oldGroupData) {
        const { grade, group, teacher, material, center } = oldGroupData;
        
        let deleteQuery = supabase
            .from('schedules')
            .delete()
            .eq('group_name', group)
            .eq('grade', grade);
            
        // Match null or a specific ID for each field
        deleteQuery = teacher ? deleteQuery.eq('teacher_id', teacher) : deleteQuery.is('teacher_id', null);
        deleteQuery = material ? deleteQuery.eq('material_id', material) : deleteQuery.is('material_id', null);
        deleteQuery = center ? deleteQuery.eq('center_id', center) : deleteQuery.is('center_id', null);

        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
    }
    
    const { error: insertError } = await supabase.from('schedules').insert(records);
    if (insertError) throw insertError;
}