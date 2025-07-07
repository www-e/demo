// js/pages/admin/supabase-client.js
import { supabase as client } from '../../supabase-client.js';

export const supabase = client;

// Server-side data fetching with all filters
export async function fetchStudents(page = 1, pageSize = 20, filters) {
    const { grade, group, teacher, material, center, searchQuery } = filters;
    const offset = (page - 1) * pageSize;
    
    let query = supabase
        .from('registrations_2025_2026')
        .select(`*, teacher:teachers(id, name), material:materials(id, name), center:centers(id, name)`);

    if (grade !== 'all') query = query.eq('grade', grade);
    if (teacher !== 'all') query = query.eq('teacher_id', teacher);
    if (material !== 'all') query = query.eq('material_id', material);
    if (center !== 'all') query = query.eq('center_id', center);
    
    if (group !== 'all') {
        const [filterGroup, filterTime] = group.split('|');
        query = query.eq('days_group', filterGroup).eq('time_slot', filterTime);
    }
    if (searchQuery.trim()) {
        query = query.or(`student_name.ilike.%${searchQuery}%,student_phone.ilike.%${searchQuery}%,parent_phone.ilike.%${searchQuery}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Get total count for pagination with all filters
export async function getStudentsCount(filters) {
    const { grade, group, teacher, material, center, searchQuery } = filters;
    let query = supabase.from('registrations_2025_2026').select('*', { count: 'exact', head: true });

    if (grade !== 'all') query = query.eq('grade', grade);
    if (teacher !== 'all') query = query.eq('teacher_id', teacher);
    if (material !== 'all') query = query.eq('material_id', material);
    if (center !== 'all') query = query.eq('center_id', center);

    if (group !== 'all') {
        const [filterGroup, filterTime] = group.split('|');
        query = query.eq('days_group', filterGroup).eq('time_slot', filterTime);
    }
    if (searchQuery.trim()) {
        query = query.or(`student_name.ilike.%${searchQuery}%,student_phone.ilike.%${searchQuery}%,parent_phone.ilike.%${searchQuery}%`);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count;
}

// Get counts for filter cards with all filters
export async function getGradeCounts(filters) {
    const { teacher, material, center } = filters;
    let query = supabase.from('registrations_2025_2026').select('grade');
    
    if (teacher !== 'all') query = query.eq('teacher_id', teacher);
    if (material !== 'all') query = query.eq('material_id', material);
    if (center !== 'all') query = query.eq('center_id', center);
    
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