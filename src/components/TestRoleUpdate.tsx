import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, roleLabels } from '@/types/permissions';

export const TestRoleUpdate: React.FC = () => {
  const [testing, setTesting] = useState(false);

  const testRoleUpdate = async () => {
    setTesting(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No user logged in');
        return;
      }

      // Try to update role using our admin function
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: user.id,
        new_role: 'staff'
      });

      if (error) {
        console.error('Role update error:', error);
        toast.error(`Role update failed: ${error.message}`);
      } else {
        toast.success('Role updated successfully! The role update function is working.');
        
        // Verify the update
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          toast.info(`Current role in database: ${profile.role}`);
        }
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test Role Update Function</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Click the button below to test if the role update function is working correctly.
          This will temporarily change your role to 'staff' to test the functionality.
        </p>
        <Button 
          onClick={testRoleUpdate}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Role Update'}
        </Button>
      </CardContent>
    </Card>
  );
};
