// js/services/center-service.js
import { supabase } from '../supabase-client.js';

export async function fetchCenters() {
    const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('is_active', true)
        .order('name');
    if (error) throw error;
    return data;
}

export async function createCenter(centerData) {
    const { data, error } = await supabase
        .from('centers')
        .insert([centerData])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateCenter(id, centerData) {
    const { data, error } = await supabase
        .from('centers')
        .update(centerData)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteAndReassignCenter(centerId) {
    const { error } = await supabase.rpc('delete_center_and_reassign', { 
        center_id_to_delete: centerId 
    });
    if (error) throw error;
}
