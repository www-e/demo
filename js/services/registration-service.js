// js/services/registration-service.js
import { supabase } from '../supabase-client.js';

let allSchedules = []; // Cache for fetched schedules

export async function loadSchedulesFromDB() {
    try {
        const { data, error } = await supabase
            .from('schedules')
            // FIXED: Added 'is_active' to the teacher selection
            .select('*,teacher:teachers(id, name, is_active),material:materials(id,name),center:centers(id,name)')
            .eq('is_active', true);
        if (error) throw error;
        allSchedules = data;
        return allSchedules;
    } catch (error) {
        console.error("Failed to load schedules:", error.message);
        return [];
    }
}

// This function is now correct because it will receive the right data. No changes needed here.
export function getAvailableGroupTimes(grade, teacherId, materialId, centerId) {
    if (!grade || !teacherId || !materialId || !centerId) {
        return [];
    }
    
    const relevantSchedules = allSchedules.filter(schedule => {
        return schedule.grade === grade &&
               schedule.teacher_id === teacherId &&
               schedule.material_id === materialId &&
               schedule.center_id === centerId;
    });

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

async function checkExistingRegistration(phone, grade, materialId, centerId) {
    const { error, count } = await supabase.from('registrations_2025_2026')
        .select('id', { count: 'exact' })
        .eq('student_phone', phone)
        .eq('grade', grade)
        .eq('material_id', materialId)
        .eq('center_id', centerId);
        
    if (error) throw error;
    return count > 0;
}

export async function submitRegistration(registrationData) {
    try {
        const { error } = await supabase.rpc('register_student_with_capacity_check', registrationData);

        if (error) {
            console.error("Registration failed:", error);
            switch (error.code) {
                case 'P0001':
                    return { success: false, error: 'الطالب مسجل بالفعل.', errorCode: 'DUPLICATE_STUDENT' };
                case 'P0002':
                    return { success: false, error: 'عذرًا، هذه المجموعة ممتلئة.', errorCode: 'GROUP_FULL' };
                case 'P0003':
                    return { success: false, error: 'المجموعة المختارة غير متاحة.', errorCode: 'SCHEDULE_NOT_FOUND' };
                default:
                    return { success: false, error: 'حدث خطأ غير متوقع.', errorCode: 'UNKNOWN' };
            }
        }

        return { success: true };

    } catch (error) {
        console.error("Registration failed (general error):", error);
        return { success: false, error: 'حدث خطأ أثناء التسجيل.', errorCode: 'UNKNOWN' };
    }
}