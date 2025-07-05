-- security.sql
-- This file contains all Row Level Security policies.

-- Step 1: Enable RLS on all tables.
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations_2025_2026 ENABLE ROW LEVEL SECURITY;

-- Step 2: Purge any existing old policies to ensure a clean state.
DROP POLICY IF EXISTS "Allow public read access to active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow anonymous full access to manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow public insert access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Allow public read access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.registrations_2025_2026;

-- Step 3: Create policies for the 'teachers' table.
CREATE POLICY "Allow public read access to active teachers" ON public.teachers
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow anonymous full access to manage teachers" ON public.teachers
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Step 4: Create policies for the 'schedules' table.
CREATE POLICY "Allow public read access to active schedules" ON public.schedules
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow anonymous full access to manage schedules" ON public.schedules
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Step 5: Create policies for the 'registrations_2025_2026' table.
CREATE POLICY "Allow public insert access" ON public.registrations_2025_2026
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow public read access" ON public.registrations_2025_2026
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous delete access" ON public.registrations_2025_2026
    FOR DELETE TO anon USING (true);

-- Confirmation message
SELECT 'RLS policies have been set correctly with teacher support.' AS status;
