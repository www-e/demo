// js/pages/admin/supabase-client.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Server-side data fetching with pagination and teacher filtering
export async function fetchStudents(page = 1, pageSize = 20, grade = 'all', group = 'all', teacherId = 'all', materialId = 'all', searchQuery = '') {
    const offset = (page - 1) * pageSize;
    let query = supabase
        .from('registrations_2025_2026')
        .select(`
            *,
            teacher:teachers(id, name),
            material:materials(id, name)
        `); // ADDED: Include teacher and material information

    // Apply filters on server-side
    if (grade !== 'all') {
        query = query.eq('grade', grade);
    }
    // ADDED: Teacher filtering
    if (teacherId !== 'all') {
        query = query.eq('teacher_id', teacherId);
    }
    // ADDED: Material filtering
    if (materialId !== 'all') {
        query = query.eq('material_id', materialId);
    }
    if (group !== 'all') {
        const [filterGroup, filterTime] = group.split('|');
        query = query.eq('days_group', filterGroup).eq('time_slot', filterTime);
    }
    if (searchQuery.trim() !== '') {
        query = query.or(
            `student_name.ilike.%${searchQuery}%,student_phone.ilike.%${searchQuery}%,parent_phone.ilike.%${searchQuery}%`
        );
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Get total count for pagination with teacher filtering
export async function getStudentsCount(grade = 'all', group = 'all', teacherId = 'all', materialId = 'all', searchQuery = '') {
    let query = supabase.from('registrations_2025_2026').select('*', { count: 'exact', head: true });

    if (grade !== 'all') {
        query = query.eq('grade', grade);
    }
    // ADDED: Teacher filtering in count
    if (teacherId !== 'all') {
        query = query.eq('teacher_id', teacherId);
    }
    // ADDED: Material filtering in count
    if (materialId !== 'all') {
        query = query.eq('material_id', materialId);
    }
    if (group !== 'all') {
        const [filterGroup, filterTime] = group.split('|');
        query = query.eq('days_group', filterGroup).eq('time_slot', filterTime);
    }
    if (searchQuery.trim() !== '') {
        query = query.or(
            `student_name.ilike.%${searchQuery}%,student_phone.ilike.%${searchQuery}%,parent_phone.ilike.%${searchQuery}%`
        );
    }

    const { count, error } = await query;
    if (error) throw error;
    return count;
}

// Get counts for filter cards with teacher filtering
export async function getGradeCounts(teacherId = 'all', materialId = 'all') {
    let query = supabase
        .from('registrations_2025_2026')
        .select('grade');
    
    // ADDED: Teacher filtering in grade counts
    if (teacherId !== 'all') {
        query = query.eq('teacher_id', teacherId);
    }
    // ADDED: Material filtering in grade counts
    if (materialId !== 'all') {
        query = query.eq('material_id', materialId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const counts = { all: data.length, first: 0, second: 0, third: 0 };
    data.forEach(student => {
        if (counts.hasOwnProperty(student.grade)) {
            counts[student.grade]++;
        }
    });
    
    return counts;
}

export async function deleteStudent(id) {
    const { error } = await supabase.from('registrations_2025_2026').delete().eq('id', id);
    if (error) throw error;
}