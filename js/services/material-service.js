// js/services/material-service.js
import { supabase } from '../supabase-client.js';

export async function fetchMaterials() {
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name');
    if (error) throw error;
    return data;
}

export async function createMaterial(materialData) {
    const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateMaterial(id, materialData) {
    const { data, error } = await supabase
        .from('materials')
        .update(materialData)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteAndReassignMaterial(materialId) {
    const { error } = await supabase.rpc('delete_material_and_reassign', { 
        material_id_to_delete: materialId 
    });
    if (error) throw error;
}
