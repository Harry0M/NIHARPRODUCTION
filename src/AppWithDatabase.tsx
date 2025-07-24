import React, { useState, useEffect } from 'react';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { useDatabaseConfig } from '@/hooks/useDatabaseConfig';
import DatabaseSelector from '@/components/database/DatabaseSelector';
import { DatabaseConfig } from '@/types/database';

// Import your existing App component
import OriginalApp from '@/App';

const AppWithDatabase: React.FC = () => {
  return (
    <DatabaseProvider>
      <DatabaseManager />
    </DatabaseProvider>
  );
};

const DatabaseManager: React.FC = () => {
  const { isDatabaseConfigured, setCurrentDatabase } = useDatabaseConfig();
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(!isDatabaseConfigured);

  useEffect(() => {
    setShowDatabaseSelector(!isDatabaseConfigured);
  }, [isDatabaseConfigured]);

  const handleDatabaseSelected = (config: DatabaseConfig) => {
    setCurrentDatabase(config);
    setShowDatabaseSelector(false);
  };

  if (showDatabaseSelector) {
    return <DatabaseSelector onDatabaseSelected={handleDatabaseSelected} />;
  }

  return <OriginalApp />;
};

export default AppWithDatabase;
