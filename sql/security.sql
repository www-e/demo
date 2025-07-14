-- security.sql
-- This file contains all Row Level Security policies.
-- This version is idempotent and safe to re-run.

-- Step 1: Enable RLS on all tables (if not already enabled).
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations_2025_2026 ENABLE ROW LEVEL SECURITY;

-- Step 2: Purge ALL existing policies to ensure a clean state.
DROP POLICY IF EXISTS "Allow anonymous full access to manage centers" ON public.centers;
DROP POLICY IF EXISTS "Allow anonymous full access to manage materials" ON public.materials;
DROP POLICY IF EXISTS "Allow anonymous full access to manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow anonymous full access to manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow anonymous full access to registrations" ON public.registrations_2025_2026;

-- Step 3: Re-create policies for all tables with full anonymous access.
CREATE POLICY "Allow anonymous full access to manage centers" ON public.centers
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous full access to manage materials" ON public.materials
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous full access to manage teachers" ON public.teachers
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous full access to manage schedules" ON public.schedules
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous full access to registrations" ON public.registrations_2025_2026
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Step 4: Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.register_student_with_capacity_check(text, text, text, text, grade_level, uuid, uuid, uuid, text, time) TO anon;

-- Confirmation message
SELECT 'RLS policies and function grants are set.' AS status;