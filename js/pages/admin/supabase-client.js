// js/pages/admin/supabase-client.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config.js';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// NEW: Server-side data fetching with pagination
export async function fetchStudents(page = 1, pageSize = 20, grade = 'all', group = 'all', searchQuery = '') {
    const offset = (page - 1) * pageSize;
    let query = supabase.from('registrations_2025_2026').select('*');

    // Apply filters on server-side
    if (grade !== 'all') {
        query = query.eq('grade', grade);
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

// NEW: Get total count for pagination
export async function getStudentsCount(grade = 'all', group = 'all', searchQuery = '') {
    let query = supabase.from('registrations_2025_2026').select('*', { count: 'exact', head: true });

    if (grade !== 'all') {
        query = query.eq('grade', grade);
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

// NEW: Get counts for filter cards
export async function getGradeCounts() {
    const { data, error } = await supabase
        .from('registrations_2025_2026')
        .select('grade');
    
    if (error) throw error;
    
    const counts = { all: data.length, first: 0, second: 0, third: 0 };
    data.forEach(student => {
        if (counts.hasOwnProperty(student.grade)) {
            counts[student.grade]++;
        }
    });
    
    return counts;
}
