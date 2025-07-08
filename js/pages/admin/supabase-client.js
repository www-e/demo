// js/pages/admin/supabase-client.js
import { supabase as client } from '../../supabase-client.js';

export const supabase = client;

// This single function replaces fetchStudents, getStudentsCount, AND getGradeCounts.
export async function fetchFilteredStudents(page = 1, pageSize = 20, filters) {
    const { grade, teacher, material, center, searchQuery } = filters;

    const { data, error } = await supabase.rpc('get_filtered_students_with_counts', {
        p_grade: grade,
        p_teacher_id: teacher === 'all' ? null : teacher,
        p_material_id: material === 'all' ? null : material,
        p_center_id: center === 'all' ? null : center,
        p_search_query: searchQuery,
        p_page: page,
        p_page_size: pageSize
    });

    if (error) {
        console.error("RPC Error:", error);
        throw error;
    }

    // The function returns a single JSON object with all our data.
    return data;
}