import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { roleLabels } from '@/types/permissions';

export const RoleDisplay: React.FC = () => {
  const { userRole } = usePermissions();

  return (
    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {roleLabels[userRole]}
    </div>
  );
};

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const getVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'printer':
        return 'bg-green-100 text-green-800';
      case 'cutting':
        return 'bg-blue-100 text-blue-800';
      case 'stitching':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVariant(role)}`}>
      {roleLabels[role as keyof typeof roleLabels] || role}
    </div>
  );
};
