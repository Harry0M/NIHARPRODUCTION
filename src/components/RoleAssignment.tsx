import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { UserRole, roleLabels } from '@/types/permissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const RoleAssignment: React.FC = () => {
  const { user, userRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });

      if (error) throw error;

      toast.success(`Role updated to ${roleLabels[selectedRole]}! Please refresh the page.`);
      
      // Refresh the page to reload with new permissions
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set Your Role</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Current role: <strong>{roleLabels[userRole]}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Select your role to get appropriate permissions:
          </p>
        </div>
        
        <div className="space-y-3">
          <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex flex-col">
                  <span>Admin</span>
                  <span className="text-xs text-muted-foreground">Full access to all features</span>
                </div>
              </SelectItem>
              <SelectItem value="printer">
                <div className="flex flex-col">
                  <span>Printer</span>
                  <span className="text-xs text-muted-foreground">Job cards + printing jobs</span>
                </div>
              </SelectItem>
              <SelectItem value="cutting">
                <div className="flex flex-col">
                  <span>Cutting</span>
                  <span className="text-xs text-muted-foreground">Job cards + cutting jobs</span>
                </div>
              </SelectItem>
              <SelectItem value="stitching">
                <div className="flex flex-col">
                  <span>Stitching</span>
                  <span className="text-xs text-muted-foreground">Job cards + stitching jobs</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleUpdateRole}
            disabled={isUpdating || selectedRole === userRole}
            className="w-full"
          >
            {isUpdating ? 'Updating...' : `Set Role to ${roleLabels[selectedRole]}`}
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded text-sm">
          <strong>Note:</strong> Choose "Admin" to get full access including user management features.
        </div>
      </CardContent>
    </Card>
  );
};
