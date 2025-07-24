-- Create profiles table for user management - FIXED VERSION
-- Run this SQL in your Supabase SQL Editor

-- Drop existing table and policies to start fresh
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows authenticated users to read all profiles
-- This avoids the circular dependency issue
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to update any profile (admin functionality)
-- We'll handle role checking in the application layer
CREATE POLICY "Authenticated users can update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'admin'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert current users into profiles table (run this once)
INSERT INTO public.profiles (id, email, role, created_at)
SELECT 
    id, 
    email, 
    'admin' as role,  -- Set all existing users as admin initially
    created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
