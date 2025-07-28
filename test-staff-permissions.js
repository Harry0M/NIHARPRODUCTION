// Test script to verify staff role permissions
import { getPermissionsForRole, roleLabels } from '../src/types/permissions';

console.log('Testing Staff Role Permissions\n');

const staffPermissions = getPermissionsForRole('staff');
const adminPermissions = getPermissionsForRole('admin');

console.log('Staff Role Label:', roleLabels.staff);
console.log('\nStaff Permissions:');
Object.entries(staffPermissions).forEach(([permission, hasAccess]) => {
  console.log(`  ${permission}: ${hasAccess ? '✅' : '❌'}`);
});

console.log('\nComparison with Admin:');
Object.entries(staffPermissions).forEach(([permission, staffHasAccess]) => {
  const adminHasAccess = adminPermissions[permission];
  if (staffHasAccess !== adminHasAccess) {
    console.log(`  ${permission}: Staff ${staffHasAccess ? '✅' : '❌'} | Admin ${adminHasAccess ? '✅' : '❌'}`);
  }
});

console.log('\nKey differences:');
console.log('- Staff CANNOT access Analysis (canAccessAnalysis: false)');
console.log('- Staff CANNOT create/manage users (canCreateUsers: false, canManageUsers: false)');
console.log('- Staff CAN access all other features like Admin');
