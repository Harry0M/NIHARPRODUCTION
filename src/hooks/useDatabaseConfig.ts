import { useContext } from 'react';
import { DatabaseContext } from '@/context/DatabaseContext';

export const useDatabaseConfig = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseConfig must be used within a DatabaseProvider');
  }
  return context;
};
