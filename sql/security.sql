-- security.sql
-- This file contains all Row Level Security policies.
-- This version is idempotent and safe to re-run.

-- Step 1: Enable RLS on all tables (if not already enabled).
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations_2025_2026 ENABLE ROW LEVEL SECURITY;

-- Step 2: Purge ALL existing policies defined in this file to ensure a clean state.
-- This is the corrected section that now includes drops for ALL policies, preventing the error.
DROP POLICY IF EXISTS "Allow public read access to active teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow anonymous full access to manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Allow public read access to active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow anonymous full access to manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow public insert access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Allow public read access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.registrations_2025_2026;


-- Step 3: Re-create policies for the 'teachers' table.
CREATE POLICY "Allow public read access to active teachers" ON public.teachers
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow anonymous full access to manage teachers" ON public.teachers
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Step 4: Re-create policies for the 'schedules' table.
CREATE POLICY "Allow public read access to active schedules" ON public.schedules
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow anonymous full access to manage schedules" ON public.schedules
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Step 5: Re-create policies for the 'registrations_2025_2026' table, including the fix.
CREATE POLICY "Allow public insert access" ON public.registrations_2025_2026
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public read access" ON public.registrations_2025_2026
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous delete access" ON public.registrations_2025_2026
    FOR DELETE TO anon USING (true);

-- THE FIX: This is the missing policy that allows the student re-assignment to work.
CREATE POLICY "Allow anonymous update access" ON public.registrations_2025_2026
    FOR UPDATE TO anon USING (true) WITH CHECK (true);


-- Confirmation message
SELECT 'RLS policies have been set correctly. The UPDATE permission is now in place.' AS status;