-- Update user role enum to match application roles
-- Run this SQL in your Supabase SQL Editor

-- First, let's update the enum to include the new role types
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'printer';  
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cutting';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'stitching';

-- Alternative approach if the above doesn't work:
-- Drop and recreate the enum (this will require updating the table)

-- Step 1: Add a temporary column
ALTER TABLE public.profiles ADD COLUMN role_temp TEXT;

-- Step 2: Copy existing role values to temp column
UPDATE public.profiles SET role_temp = role::TEXT;

-- Step 3: Drop the old role column
ALTER TABLE public.profiles DROP COLUMN role;

-- Step 4: Add new role column as TEXT (more flexible than enum)
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'admin';

-- Step 5: Copy values back
UPDATE public.profiles SET role = role_temp;

-- Step 6: Drop temp column
ALTER TABLE public.profiles DROP COLUMN role_temp;

-- Step 7: Add check constraint for valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles 
CHECK (role IN ('admin', 'staff', 'printer', 'cutting', 'stitching'));
