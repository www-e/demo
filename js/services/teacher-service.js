// js/services/teacher-service.js
import { supabase } from '../supabase-client.js';

export async function fetchTeachers() {
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name'); 
    
    if (error) throw error;
    // Return all teachers for management, filtering happens in the UI manager
    return data; 
}

export async function createTeacher(teacherData) {
    const { data, error } = await supabase
        .from('teachers')
        .insert([teacherData])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

export async function updateTeacher(id, teacherData) {
    const { data, error } = await supabase
        .from('teachers')
        .update(teacherData)
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// RENAMED for consistency
export async function deleteAndReassign(teacherId) {
    const { error } = await supabase.rpc('delete_teacher_and_reassign', { 
        teacher_id_to_delete: teacherId 
    });

    if (error) throw error;
}