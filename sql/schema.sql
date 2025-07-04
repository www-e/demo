-- schema.sql
-- This single file sets up your entire database structure from scratch.

-- Step 1: Drop old objects if they exist to ensure a clean slate.
DROP TABLE IF EXISTS public.registrations_2025_2026 CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TYPE IF EXISTS public.grade_level;

-- Step 2: Create necessary types.
CREATE TYPE grade_level AS ENUM ('first', 'second', 'third');

-- Step 3: Create the 'schedules' table.
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade grade_level NOT NULL,
    group_name TEXT NOT NULL,
    time_slot TIME NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensures a time slot is unique for a given group and grade
    CONSTRAINT unique_schedule_time_simplified UNIQUE(grade, group_name, time_slot)
);

-- Step 4: Create the 'registrations_2025_2026' table.
CREATE TABLE public.registrations_2025_2026 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_phone TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    grade grade_level NOT NULL,
    days_group TEXT NOT NULL,
    time_slot TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, now()) NOT NULL,
    -- Ensures a student can only register once per grade
    CONSTRAINT idx_unique_student_per_grade UNIQUE(student_phone, grade)
);

-- Step 5: Grant permissions for the public 'anon' role.
-- These GRANTs are the base-level permissions before RLS policies are checked.

-- Permissions for the schedules table (no changes needed here)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.schedules TO anon;

-- Permissions for the student registrations table
-- FIX: Added DELETE permission to allow the admin page to delete students.
GRANT SELECT, INSERT, DELETE ON TABLE public.registrations_2025_2026 TO anon;

-- Confirmation message
SELECT 'Schema setup is complete.' AS status;