// js/services/registration-service.js
import { supabase } from '../supabase-client.js';

let allSchedules = []; // Cache for fetched schedules

export async function loadSchedulesFromDB() {
    try {
        // ADDED: Include teacher information in the query
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                teacher:teachers(id, name)
            `)
            .eq('is_active', true);
        if (error) throw error;
        allSchedules = data;
        return allSchedules;
    } catch (error) {
        console.error("Failed to load schedules:", error.message);
        return [];
    }
}

// MODIFIED: Added teacherId parameter to filter schedules by teacher
export function getAvailableGroupTimes(grade, teacherId = null) {
    if (!grade) return [];
    let relevantSchedules = allSchedules.filter(s => s.grade === grade);
    
    // ADDED: Filter by teacher if specified
    if (teacherId && teacherId !== 'all') {
        relevantSchedules = relevantSchedules.filter(schedule => 
            schedule.teacher_id === teacherId || schedule.teacher_id === null
        );
    }

    relevantSchedules.sort((a, b) => {
        if (a.group_name < b.group_name) return -1;
        if (a.group_name > b.group_name) return 1;
        if (a.time_slot < b.time_slot) return -1;
        if (a.time_slot > b.time_slot) return 1;
        return 0;
    });
    
    return relevantSchedules.map(schedule => {
        const time12hr = new Date(`1970-01-01T${schedule.time_slot}Z`).toLocaleTimeString('ar-EG', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'
        });
        return {
            value: `${schedule.group_name}|${schedule.time_slot}`,
            text: `${schedule.group_name} - ${time12hr}`
        };
    });
}

async function checkExistingRegistration(phone, grade) {
    const { error, count } = await supabase.from('registrations_2025_2026')
        .select('id', { count: 'exact' })
        .eq('student_phone', phone)
        .eq('grade', grade);
        
    if (error) throw error;
    return count > 0;
}

// UNCHANGED: Keeping your existing submitRegistration function exactly as is
export async function submitRegistration(registrationData) {
    const exists = await checkExistingRegistration(registrationData.student_phone, registrationData.grade);
    if (exists) {
        return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
    }

    const { error } = await supabase.from('registrations_2025_2026').insert([registrationData]);

    if (error) {
        // Log the detailed error from Supabase for better debugging
        console.error("Supabase insert error:", error);
        if (error.code === '23505') { 
            return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
        }
        throw error;
    }

    return { success: true };
}