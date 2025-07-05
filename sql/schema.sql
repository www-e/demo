-- schema.sql
-- This single file sets up your entire database structure from scratch.

-- Step 1: Drop old objects if they exist to ensure a clean slate.
DROP TABLE IF EXISTS public.registrations_2025_2026 CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TYPE IF EXISTS public.grade_level;

-- Step 2: Create necessary types.
CREATE TYPE grade_level AS ENUM ('first', 'second', 'third');

-- Step 3: Create the 'teachers' table.
CREATE TABLE public.teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    -- REMOVED: The old unique constraint was here. It is replaced by a conditional index below.
);

-- ADDED: Create a conditional unique index for soft deletes.
-- This ensures that a teacher's name is unique ONLY if they are active.
-- This allows you to "delete" a teacher and later re-add one with the same name.
CREATE UNIQUE INDEX unique_active_teacher_name
ON public.teachers (name)
WHERE (is_active = true);

-- Step 4: Create the 'schedules' table with teacher support.
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade grade_level NOT NULL,
    group_name TEXT NOT NULL,
    time_slot TIME NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensures a time slot is unique for a given group, grade, and teacher
    CONSTRAINT unique_schedule_time_with_teacher UNIQUE(grade, group_name, time_slot, teacher_id)
);

-- Step 5: Create the 'registrations_2025_2026' table with teacher support.
CREATE TABLE public.registrations_2025_2026 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    grade grade_level NOT NULL,
    days_group TEXT NOT NULL,
    time_slot TIME NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, now()) NOT NULL,
    -- Ensures a student can only register once per grade
    CONSTRAINT idx_unique_student_per_grade UNIQUE(student_phone, grade)
);

-- Step 6: Grant permissions for the public 'anon' role.
-- Permissions for the teachers table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.teachers TO anon;

-- Permissions for the schedules table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.schedules TO anon;

-- Permissions for the student registrations table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.registrations_2025_2026 TO anon;

-- Step 7: Insert default "General" teacher for backward compatibility
INSERT INTO public.teachers (name) VALUES ('عام (متاح للجميع)');

-- Step 8: Create the RPC function for safe teacher deletion
CREATE OR REPLACE FUNCTION delete_teacher_and_reassign_students(teacher_id_to_delete uuid)
RETURNS void AS $$
DECLARE
    general_teacher_id uuid;
BEGIN
    -- 1. Find the ID of the 'عام (متاح للجميع)' teacher.
    -- This makes the function robust even if the ID changes.
    SELECT id INTO general_teacher_id FROM public.teachers WHERE name = 'عام (متاح للجميع)' LIMIT 1;

    -- 2. If the general teacher cannot be found, abort the operation.
    IF general_teacher_id IS NULL THEN
        RAISE EXCEPTION 'Critical error: General teacher "عام (متاح للجميع)" not found. Aborting operation.';
    END IF;

    -- 3. Prevent deleting the general teacher itself.
    IF teacher_id_to_delete = general_teacher_id THEN
        RAISE EXCEPTION 'Cannot delete the main "General" teacher.';
    END IF;

    -- 4. Reassign students from the deleted teacher to the general teacher.
    UPDATE public.registrations_2025_2026
    SET teacher_id = general_teacher_id
    WHERE teacher_id = teacher_id_to_delete;

    -- 5. Reassign schedules from the deleted teacher to the general teacher.
    UPDATE public.schedules
    SET teacher_id = general_teacher_id
    WHERE teacher_id = teacher_id_to_delete;

    -- 6. Soft-delete the teacher by marking them as inactive.
    -- This preserves their record but removes them from active use.
    UPDATE public.teachers
    SET is_active = false
    WHERE id = teacher_id_to_delete;

END;
$$ LANGUAGE plpgsql;

-- Step 9: Grant execute permission on the function to the anon role
GRANT EXECUTE ON FUNCTION public.delete_teacher_and_reassign_students(uuid) TO anon;

-- Confirmation message
SELECT 'Schema setup and RPC function creation are complete.' AS status;