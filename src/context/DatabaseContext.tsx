import React, { createContext, useState, useEffect } from 'react';
import { DatabaseConfig, DatabaseContextType } from '@/types/database';

export const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [currentDatabase, setCurrentDatabase] = useState<DatabaseConfig | null>(null);
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if there's a saved database configuration
    const lastUsedDatabase = localStorage.getItem('lastUsedDatabase');
    const savedDatabases = localStorage.getItem('savedDatabases');
    const usingDefault = localStorage.getItem('usingDefaultDatabase');
    
    if (usingDefault === 'true') {
      // Set up default configuration
      const defaultConfig: DatabaseConfig = {
        id: 'default',
        name: 'Default (Demo)',
        host: 'localhost',
        port: 5432,
        database: 'nihar_demo',
        username: 'demo_user',
        password: '',
        type: 'postgresql'
      };
      
      setCurrentDatabase(defaultConfig);
      setIsDatabaseConfigured(true);
      updateSupabaseConfig(defaultConfig);
    } else if (lastUsedDatabase && savedDatabases) {
      const databases: DatabaseConfig[] = JSON.parse(savedDatabases);
      const lastUsed = databases.find(db => db.id === lastUsedDatabase);
      
      if (lastUsed) {
        setCurrentDatabase(lastUsed);
        setIsDatabaseConfigured(true);
        updateSupabaseConfig(lastUsed);
      }
    }
  }, []);

  const handleSetCurrentDatabase = (config: DatabaseConfig) => {
    setCurrentDatabase(config);
    setIsDatabaseConfigured(true);
    localStorage.setItem('lastUsedDatabase', config.id);
    updateSupabaseConfig(config);
  };

  const clearDatabase = () => {
    setCurrentDatabase(null);
    setIsDatabaseConfigured(false);
    localStorage.removeItem('lastUsedDatabase');
    localStorage.removeItem('usingDefaultDatabase');
  };

  const updateSupabaseConfig = (config: DatabaseConfig) => {
    // Update environment variables or global config for database connection
    // This would be used to dynamically configure your database connection
    
    // For Supabase, you might want to create a new client instance
    // or update the connection string based on the selected database
    
    // Store the config in a way that can be accessed by your data layer
    window.databaseConfig = config;
    
    // You could also emit an event to notify other parts of the app
    window.dispatchEvent(new CustomEvent('database-config-changed', { 
      detail: config 
    }));
    
    console.log('Database configuration updated:', {
      name: config.name,
      host: config.host,
      database: config.database,
      type: config.type
    });
  };

  const value: DatabaseContextType = {
    currentDatabase,
    setCurrentDatabase: handleSetCurrentDatabase,
    isDatabaseConfigured,
    clearDatabase,
    updateSupabaseConfig
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
