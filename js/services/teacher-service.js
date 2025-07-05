// js/services/teacher-service.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchTeachers() {
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('name');
    
    if (error) throw error;
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

export async function deleteTeacher(id) {
    const { error } = await supabase
        .from('teachers')
        .update({ is_active: false })
        .eq('id', id);
    
    if (error) throw error;
}

export async function getTeacherById(id) {
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
    
    if (error) throw error;
    return data;
}
