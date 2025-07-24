import { supabase } from '@/integrations/supabase/client';

export const initializeUserProfiles = async () => {
  try {
    // First, check if profiles table exists by trying to fetch from it
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    // If table doesn't exist, we need to create it
    if (fetchError && fetchError.code === '42P01') { // Table doesn't exist
      console.log('Creating profiles table...');
      
      // Create the profiles table via SQL
      const { error: createError } = await supabase.rpc('create_profiles_table', {});
      
      if (createError) {
        console.log('Profiles table creation via RPC failed, trying direct creation...');
        
        // Fallback: Insert current user into profiles table manually
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Failed to insert user profile:', insertError);
          }
        }
      }
    }

    // Ensure current user has a profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Create profile for current user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Failed to create user profile:', insertError);
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing user profiles:', error);
    return { success: false, error };
  }
};

export const syncUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert user profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Error syncing user profile:', error);
    }
  } catch (error) {
    console.error('Error in syncUserProfile:', error);
  }
};
