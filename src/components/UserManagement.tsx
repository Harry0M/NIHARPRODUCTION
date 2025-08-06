import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole, roleLabels } from '@/types/permissions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initializeUserProfiles } from '@/utils/userProfileUtils';

interface UserInfo {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string;
}

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('staff');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const initializeAndLoadUsers = async () => {
      await initializeUserProfiles();
      await loadUsers();
    };
    
    initializeAndLoadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only admin can access this component
  if (!isAdmin()) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Access denied. Only administrators can manage users.</p>
        </CardContent>
      </Card>
    );
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users from profiles table...');
      
      // Try to get all user profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        toast.error(`Database error: ${error.message}`);
        
        // Fallback: show only current user
        if (user) {
          setUsers([{
            id: user.id,
            email: user.email || 'No email',
            role: 'admin',
            created_at: user.created_at || new Date().toISOString(),
            last_sign_in_at: user.last_sign_in_at || new Date().toISOString()
          }]);
        }
        return;
      }

      console.log('Profiles loaded:', profiles);

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found, adding current user...');
        
        // If no profiles exist, create one for current user
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
            console.error('Error creating profile:', insertError);
          } else {
            console.log('Created profile for current user');
            // Reload after creating profile
            return loadUsers();
          }
        }
      } else {
        // Map the profiles to our UserInfo interface
        const userList: UserInfo[] = profiles.map(profile => ({
          id: profile.id,
          email: profile.email || 'No email',
          role: profile.role || 'admin',
          created_at: profile.created_at,
          last_sign_in_at: profile.updated_at || profile.created_at
        }));
        
        console.log('Mapped user list:', userList);
        setUsers(userList);
        toast.success(`Loaded ${userList.length} users`);
      }
    } catch (error) {
      console.error('Error in loadUsers:', error);
      toast.error('Failed to load users');
      
      // Fallback to showing current user
      if (user) {
        setUsers([{
          id: user.id,
          email: user.email || 'No email',
          role: 'admin',
          created_at: user.created_at || new Date().toISOString(),
          last_sign_in_at: user.last_sign_in_at || new Date().toISOString()
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error('Please enter email and select role');
      return;
    }

    setIsInviting(true);
    try {
      // Create a simple invitation link that includes the role information
      // Always use production domain for invitation links so they work from anywhere
      const inviteLink = `https://niharbag.fusenet.me/#/auth?invite=true&role=${inviteRole}&email=${encodeURIComponent(inviteEmail)}`;
      
      // Copy to clipboard for now (in a real app, you'd send via email)
      await navigator.clipboard.writeText(inviteLink);
      
      toast.success(`Invitation link copied to clipboard! Share this with ${inviteEmail}`);
      toast.info(`Role: ${roleLabels[inviteRole]}`, { duration: 5000 });
      
      setInviteEmail('');
      setInviteRole('staff');
    } catch (error: unknown) {
      console.error('Error creating invitation:', error);
      toast.error('Failed to create invitation link');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Update the user's role in the profiles table
      const { error } = await supabase
        .rpc('update_user_role', {
          target_user_id: userId,
          new_role: newRole
        });

      if (error) {
        console.error('Error updating user role:', error);
        toast.error(`Failed to update role: ${error.message}`);
        return;
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ));

      toast.success(`Role updated to ${roleLabels[newRole]} successfully!`);
      
    } catch (error: unknown) {
      console.error('Error updating user role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update user role: ${errorMessage}`);
      
      // Revert the local change if database update failed
      await loadUsers();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite New User */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Invite New User</h3>
            <p className="text-sm text-gray-600">
              Create an invitation link for a new team member. The link will be copied to your clipboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="inviteRole">Role</Label>
                <Select value={inviteRole} onValueChange={(value: UserRole) => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="cutting">Cutting</SelectItem>
                    <SelectItem value="stitching">Stitching</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleInviteUser} 
                  disabled={isInviting}
                  className="w-full"
                >
                  {isInviting ? 'Creating...' : 'Create Invite Link'}
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The invitation link will be copied to your clipboard. 
                Share it with the new user via email or messaging app.
              </p>
            </div>
          </div>

          {/* Current Users */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Current Users</h3>
            <div className="space-y-2">
              {/* Current logged-in user */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded border">
                <div className="flex-1">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-blue-600">Current User (You)</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Admin</Badge>
                </div>
              </div>
              
              {/* Other users from database */}
              {users.filter(u => u.id !== user?.id).map((userInfo) => (
                <div key={userInfo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{userInfo.email}</p>
                    <p className="text-sm text-gray-500">
                      Joined: {new Date(userInfo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={userInfo.role} 
                      onValueChange={(newRole: UserRole) => handleRoleChange(userInfo.id, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="printer">Printer</SelectItem>
                        <SelectItem value="cutting">Cutting</SelectItem>
                        <SelectItem value="stitching">Stitching</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <p className="text-gray-500 italic p-4 text-center">
                  No other users found. Use the invitation form above to add team members.
                </p>
              )}
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Role Descriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="default">Admin</Badge>
                  <span className="text-sm">Full access to all features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Printer</Badge>
                  <span className="text-sm">Job cards + printing operations</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Cutting</Badge>
                  <span className="text-sm">Job cards + cutting operations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Stitching</Badge>
                  <span className="text-sm">Job cards + stitching operations</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
