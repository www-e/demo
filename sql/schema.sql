-- schema.sql
-- This single file sets up your entire database structure from scratch.

-- Step 1: Drop old objects if they exist to ensure a clean slate.
DROP TABLE IF EXISTS public.registrations_2025_2026 CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.centers CASCADE;
DROP TYPE IF EXISTS public.grade_level;
DROP FUNCTION IF EXISTS delete_teacher_and_reassign(uuid);
DROP FUNCTION IF EXISTS delete_center_and_reassign(uuid);
DROP FUNCTION IF EXISTS delete_material_and_reassign(uuid);
DROP FUNCTION IF EXISTS public.register_student_with_capacity_check(text, text, text, text, grade_level, uuid, uuid, uuid, text, time);
DROP FUNCTION IF EXISTS public.get_filtered_students_with_counts(text, uuid, uuid, uuid, text, integer, integer);

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

-- Step 5: Create the `teachers` table.
CREATE TABLE public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX unique_active_teacher_name ON public.teachers (name) WHERE (is_active = true);

-- Step 6: Create the `schedules` table with the new `capacity` column.
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade grade_level NOT NULL,
    group_name TEXT NOT NULL,
    time_slot TIME NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    capacity INT NOT NULL DEFAULT 3, -- <<< NEW: Capacity for the group
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_schedule_time_with_teacher_material_center UNIQUE(grade, group_name, time_slot, teacher_id, material_id, center_id)
);

-- Step 7: Create the `registrations_2025_2026` table.
CREATE TABLE public.registrations_2025_2026 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    grade grade_level NOT NULL,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    days_group TEXT NOT NULL,
    time_slot TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, now()) NOT NULL,
    CONSTRAINT idx_unique_student_per_grade_material_center UNIQUE(student_phone, grade, material_id, center_id)
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

-- Step 10: Create RPC functions.

-- Function to safely delete a center
CREATE OR REPLACE FUNCTION delete_center_and_reassign(center_id_to_delete uuid)
RETURNS void AS $$
DECLARE
    general_center_id uuid;
BEGIN
    SELECT id INTO general_center_id FROM public.centers WHERE name = 'عام' LIMIT 1;
    IF general_center_id IS NULL THEN RAISE EXCEPTION 'Critical error: General center not found.'; END IF;
    IF center_id_to_delete = general_center_id THEN RAISE EXCEPTION 'Cannot delete the main "General" center.'; END IF;
    UPDATE public.schedules SET center_id = general_center_id WHERE center_id = center_id_to_delete;
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

-- <<< NEW: RPC function for handling registrations with all necessary checks.
CREATE OR REPLACE FUNCTION register_student_with_capacity_check(
    p_student_name text,
    p_student_phone text,
    p_parent_phone text,
    p_transaction_id text,
    p_grade grade_level,
    p_center_id uuid,
    p_material_id uuid,
    p_teacher_id uuid,
    p_days_group text,
    p_time_slot time
) RETURNS void AS $$
DECLARE
    v_schedule_capacity int;
    v_current_registrations int;
    v_is_duplicate boolean;
BEGIN
    -- Check 1: Prevent duplicate registrations for the same student, grade, material, and center.
    SELECT EXISTS (
        SELECT 1 FROM public.registrations_2025_2026
        WHERE student_phone = p_student_phone
          AND grade = p_grade
          AND material_id = p_material_id
          AND center_id = p_center_id
    ) INTO v_is_duplicate;

    IF v_is_duplicate THEN
        RAISE EXCEPTION 'DUPLICATE_STUDENT' USING ERRCODE = 'P0001';
    END IF;

    -- Check 2: Get the capacity of the target schedule.
    SELECT capacity INTO v_schedule_capacity FROM public.schedules
    WHERE grade = p_grade
      AND group_name = p_days_group
      AND time_slot = p_time_slot
      AND teacher_id = p_teacher_id
      AND material_id = p_material_id
      AND center_id = p_center_id
      AND is_active = true;

    -- If no matching active schedule found, we can't register.
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SCHEDULE_NOT_FOUND' USING ERRCODE = 'P0003';
    END IF;

    -- Check 3: Count how many students are already in that exact group.
    SELECT COUNT(*) INTO v_current_registrations FROM public.registrations_2025_2026
    WHERE grade = p_grade
      AND days_group = p_days_group
      AND time_slot = p_time_slot
      AND teacher_id = p_teacher_id
      AND material_id = p_material_id
      AND center_id = p_center_id;

    -- Check 4: Compare current count with capacity.
    IF v_current_registrations >= v_schedule_capacity THEN
        RAISE EXCEPTION 'GROUP_IS_FULL' USING ERRCODE = 'P0002';
    END IF;

    -- All checks passed, insert the new registration.
    INSERT INTO public.registrations_2025_2026 (
        student_name, student_phone, parent_phone, transaction_id, grade,
        center_id, material_id, teacher_id, days_group, time_slot
    ) VALUES (
        p_student_name, p_student_phone, p_parent_phone, p_transaction_id, p_grade,
        p_center_id, p_material_id, p_teacher_id, p_days_group, p_time_slot
    );
END;
$$ LANGUAGE plpgsql;

-- PRESERVED: RPC function for efficient, combined student fetching.
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

    DROP TABLE filtered_students;

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

-- Step 11: Grant execute permissions on all functions.
GRANT EXECUTE ON FUNCTION public.delete_center_and_reassign(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_material_and_reassign(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_teacher_and_reassign(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.register_student_with_capacity_check(text, text, text, text, grade_level, uuid, uuid, uuid, text, time) TO anon;
GRANT EXECUTE ON FUNCTION public.get_filtered_students_with_counts(text, uuid, uuid, uuid, text, integer, integer) TO anon;

SELECT 'Schema setup and all RPC functions are complete.' AS status;