-- Enhanced User Role Update Function
-- Copy and paste this entire block into Supabase SQL Editor and run it

CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_role TEXT;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Map frontend roles to database enum values
  CASE new_role
    WHEN 'admin' THEN db_role := 'admin';
    WHEN 'staff' THEN db_role := 'manager';
    WHEN 'printer' THEN db_role := 'production';
    WHEN 'cutting' THEN db_role := 'production';
    WHEN 'stitching' THEN db_role := 'production';
    ELSE 
      RAISE EXCEPTION 'Invalid role: %', new_role;
  END CASE;

  -- Update the profiles table with mapped role
  UPDATE public.profiles 
  SET role = db_role, updated_at = NOW()
  WHERE id = target_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in profiles table';
  END IF;

  -- Update the user metadata to match the frontend role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    to_jsonb(new_role)
  )
  WHERE id = target_user_id;

  -- Check if metadata update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in auth.users table';
  END IF;

  RETURN TRUE;
END;
$$;
