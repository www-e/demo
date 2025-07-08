-- schema.sql
-- This single file sets up your entire database structure from scratch.

-- Step 1: Drop old objects if they exist to ensure a clean slate.
DROP TABLE IF EXISTS public.registrations_2025_2026 CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE; -- ADDED
DROP TABLE IF EXISTS public.centers CASCADE;   -- ADDED
DROP TYPE IF EXISTS public.grade_level;
DROP FUNCTION IF EXISTS delete_teacher_and_reassign(uuid);
DROP FUNCTION IF EXISTS delete_center_and_reassign(uuid);    -- ADDED
DROP FUNCTION IF EXISTS delete_material_and_reassign(uuid); -- ADDED

-- Step 2: Create necessary types.
CREATE TYPE grade_level AS ENUM ('first', 'second', 'third');

-- Step 3: Create the new `centers` table.
CREATE TABLE public.centers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 4: Create the new `materials` table.
CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 5: Create the `teachers` table, now linked to a center.
CREATE TABLE public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX unique_active_teacher_name ON public.teachers (name) WHERE (is_active = true);

-- Step 6: Create the `schedules` table, now linked to a material AND a center.
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade grade_level NOT NULL,
    group_name TEXT NOT NULL,
    time_slot TIME NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL, -- ADDED
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- MODIFIED: Added center_id to the unique constraint to allow same group/time in different centers
    CONSTRAINT unique_schedule_time_with_teacher_material_center UNIQUE(grade, group_name, time_slot, teacher_id, material_id, center_id)
);

-- Step 7: Create the `registrations_2025_2026` table, now with all links.
CREATE TABLE public.registrations_2025_2026 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    grade grade_level NOT NULL,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,       -- ADDED
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL, -- ADDED
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,   -- MODIFIED (was RESTRICT)
    days_group TEXT NOT NULL,
    time_slot TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, now()) NOT NULL,
    CONSTRAINT idx_unique_student_per_grade_material_center UNIQUE(student_phone, grade, material_id, center_id) -- MODIFIED
);

-- Step 8: Grant permissions for the public 'anon' role.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.centers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teachers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.schedules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.registrations_2025_2026 TO anon;

-- Step 9: Insert default "General" records for fallbacks.
INSERT INTO public.centers (name) VALUES ('عام');
INSERT INTO public.materials (name) VALUES ('عامة');
INSERT INTO public.teachers (name) VALUES ('عام');

-- Step 10: Create RPC functions for safe deletions.

-- Function to safely delete a center
CREATE OR REPLACE FUNCTION delete_center_and_reassign(center_id_to_delete uuid)
RETURNS void AS $$
DECLARE
    general_center_id uuid;
BEGIN
    SELECT id INTO general_center_id FROM public.centers WHERE name = 'عام' LIMIT 1;
    IF general_center_id IS NULL THEN RAISE EXCEPTION 'Critical error: General center not found.'; END IF;
    IF center_id_to_delete = general_center_id THEN RAISE EXCEPTION 'Cannot delete the main "General" center.'; END IF;

    -- Reassign schedules of the deleted center to the general center
    UPDATE public.schedules SET center_id = general_center_id WHERE center_id = center_id_to_delete;
    -- Reassign student registrations
    UPDATE public.registrations_2025_2026 SET center_id = general_center_id WHERE center_id = center_id_to_delete;

    UPDATE public.centers SET is_active = false WHERE id = center_id_to_delete;
END;
$$ LANGUAGE plpgsql;

-- Function to safely delete a material
CREATE OR REPLACE FUNCTION delete_material_and_reassign(material_id_to_delete uuid)
RETURNS void AS $$
DECLARE
    general_material_id uuid;
BEGIN
    SELECT id INTO general_material_id FROM public.materials WHERE name = 'عامة' LIMIT 1;
    IF general_material_id IS NULL THEN RAISE EXCEPTION 'Critical error: General material not found.'; END IF;
    IF material_id_to_delete = general_material_id THEN RAISE EXCEPTION 'Cannot delete the main "General" material.'; END IF;

    -- Reassign schedules and student registrations
    UPDATE public.schedules SET material_id = general_material_id WHERE material_id = material_id_to_delete;
    UPDATE public.registrations_2025_2026 SET material_id = general_material_id WHERE material_id = material_id_to_delete;

    UPDATE public.materials SET is_active = false WHERE id = material_id_to_delete;
END;
$$ LANGUAGE plpgsql;

-- Function to safely delete a teacher
CREATE OR REPLACE FUNCTION delete_teacher_and_reassign(teacher_id_to_delete uuid)
RETURNS void AS $$
DECLARE
    general_teacher_id uuid;
BEGIN
    SELECT id INTO general_teacher_id FROM public.teachers WHERE name = 'عام' LIMIT 1;
    IF general_teacher_id IS NULL THEN RAISE EXCEPTION 'Critical error: General teacher not found.'; END IF;
    IF teacher_id_to_delete = general_teacher_id THEN RAISE EXCEPTION 'Cannot delete the main "General" teacher.'; END IF;

    UPDATE public.registrations_2025_2026 SET teacher_id = general_teacher_id WHERE teacher_id = teacher_id_to_delete;
    UPDATE public.schedules SET teacher_id = general_teacher_id WHERE teacher_id = teacher_id_to_delete;
    UPDATE public.teachers SET is_active = false WHERE id = teacher_id_to_delete;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Grant execute permissions on the functions.
GRANT EXECUTE ON FUNCTION public.delete_center_and_reassign(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_material_and_reassign(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_teacher_and_reassign(uuid) TO anon;

SELECT 'Schema setup and RPC functions are complete.' AS status;
-- Step 12: Create an RPC function for efficient, combined student fetching.
CREATE OR REPLACE FUNCTION get_filtered_students_with_counts(
    p_grade text,
    p_teacher_id uuid,
    p_material_id uuid,
    p_center_id uuid,
    p_search_query text,
    p_page integer,
    p_page_size integer
)
RETURNS json AS $$
DECLARE
    v_offset integer;
    v_total_count integer;
    v_first_grade_count integer;
    v_second_grade_count integer;
    v_third_grade_count integer;
    v_page_data json;
BEGIN
    v_offset := (p_page - 1) * p_page_size;

    -- Create a temporary table to hold the results of the initial filtered query
    CREATE TEMP TABLE filtered_students AS
    SELECT * FROM public.registrations_2025_2026
    WHERE
        (p_grade = 'all' OR grade = p_grade::grade_level)
    AND (p_teacher_id IS NULL OR teacher_id = p_teacher_id)
    AND (p_material_id IS NULL OR material_id = p_material_id)
    AND (p_center_id IS NULL OR center_id = p_center_id)
    AND (
        p_search_query IS NULL OR p_search_query = '' OR
        student_name ILIKE '%' || p_search_query || '%' OR
        student_phone ILIKE '%' || p_search_query || '%' OR
        parent_phone ILIKE '%' || p_search_query || '%'
    );

    -- Get all counts from the temporary table in one go
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE grade = 'first'),
        COUNT(*) FILTER (WHERE grade = 'second'),
        COUNT(*) FILTER (WHERE grade = 'third')
    INTO
        v_total_count,
        v_first_grade_count,
        v_second_grade_count,
        v_third_grade_count
    FROM filtered_students;

    -- Get the paginated data
    SELECT json_agg(t) INTO v_page_data FROM (
        SELECT r.*,
               json_build_object('id', c.id, 'name', c.name) as center,
               json_build_object('id', m.id, 'name', m.name) as material,
               json_build_object('id', t.id, 'name', t.name, 'is_active', t.is_active) as teacher
        FROM filtered_students r
        LEFT JOIN public.centers c ON r.center_id = c.id
        LEFT JOIN public.materials m ON r.material_id = m.id
        LEFT JOIN public.teachers t ON r.teacher_id = t.id
        ORDER BY r.created_at DESC
        LIMIT p_page_size
        OFFSET v_offset
    ) t;

    -- Drop the temporary table
    DROP TABLE filtered_students;

    -- Return everything in a single JSON object
    RETURN json_build_object(
        'page_data', COALESCE(v_page_data, '[]'::json),
        'total_count', v_total_count,
        'grade_counts', json_build_object(
            'all', v_total_count,
            'first', v_first_grade_count,
            'second', v_second_grade_count,
            'third', v_third_grade_count
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION public.get_filtered_students_with_counts(text, uuid, uuid, uuid, text, integer, integer) TO anon;