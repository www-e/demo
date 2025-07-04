-- security.sql
-- This file contains all Row Level Security policies.

-- Step 1: Enable RLS on both tables. This is a master switch for security.
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations_2025_2026 ENABLE ROW LEVEL SECURITY;

-- Step 2: Purge any existing old policies to ensure a clean state.
DROP POLICY IF EXISTS "Allow public read access to active schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow anonymous full access to manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Allow public insert access" ON public.registrations_2025_2026;
DROP POLICY IF EXISTS "Enable read access for authenticated users only" ON public.registrations_2025_2026; -- Dropping the old, incorrect policy
DROP POLICY IF EXISTS "Allow public read access" ON public.registrations_2025_2026; -- Dropping any potential conflicts
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.registrations_2025_2026; -- Dropping any potential conflicts

-- Step 3: Create fresh, correct policies for the 'schedules' table.
-- These are unchanged and correct for your project setup.
CREATE POLICY "Allow public read access to active schedules" ON public.schedules
    FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Allow anonymous full access to manage schedules" ON public.schedules
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Step 4: Create fresh, correct policies for the 'registrations_2025_2026' table.
-- These policies are now correct for an admin panel that uses the 'anon' key.

-- Policy to allow anyone to register (INSERT)
CREATE POLICY "Allow public insert access" ON public.registrations_2025_2026
    FOR INSERT TO anon WITH CHECK (true);

-- FIX: This policy allows the public 'anon' key to READ all student records. This is what was missing.
CREATE POLICY "Allow public read access" ON public.registrations_2025_2026
    FOR SELECT TO anon USING (true);

-- NEW: This policy allows the public 'anon' key to DELETE student records. This makes the delete button work.
CREATE POLICY "Allow anonymous delete access" ON public.registrations_2025_2026
    FOR DELETE TO anon USING (true);

-- Confirmation message
SELECT 'RLS policies have been set correctly.' AS status;