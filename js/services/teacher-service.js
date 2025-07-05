// js/services/teacher-service.js
import { supabase } from '../supabase-client.js';

export async function fetchTeachers() {
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name'); // We fetch all teachers, active or not, for the management modal
    
    if (error) throw error;
    return data.filter(t => t.is_active); // But only return active ones for dropdowns
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

// NEW: Calls the RPC to safely delete a teacher and reassign relations
export async function deleteAndReassignStudents(teacherId) {
    const { error } = await supabase.rpc('delete_teacher_and_reassign_students', { 
        teacher_id_to_delete: teacherId 
    });

    if (error) throw error;
}