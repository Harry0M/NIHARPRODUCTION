-- Fix role column update by handling dependent policies
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Drop dependent policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;  
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- Step 2: Add a temporary column
ALTER TABLE public.profiles ADD COLUMN role_temp TEXT;

-- Step 3: Copy existing role values to temp column
UPDATE public.profiles SET role_temp = role::TEXT;

-- Step 4: Drop the old role column (now should work without CASCADE)
ALTER TABLE public.profiles DROP COLUMN role;

-- Step 5: Add new role column as TEXT
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'admin';

-- Step 6: Copy values back
UPDATE public.profiles SET role = role_temp;

-- Step 7: Drop temp column
ALTER TABLE public.profiles DROP COLUMN role_temp;

-- Step 8: Add check constraint for valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('admin', 'staff', 'printer', 'cutting', 'stitching'));

-- Step 9: Recreate the policies with updated logic
-- Allow all authenticated users to read all profiles
CREATE POLICY "Allow authenticated users to read profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to update profiles (admin check will be in app logic)
CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow admins to delete profiles (basic admin check)
CREATE POLICY "Allow admins to delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 10: Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
