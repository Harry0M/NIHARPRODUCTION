export interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  type: 'postgresql' | 'mysql' | 'sqlite';
}

export interface DatabaseContextType {
  currentDatabase: DatabaseConfig | null;
  setCurrentDatabase: (config: DatabaseConfig) => void;
  isDatabaseConfigured: boolean;
  clearDatabase: () => void;
  updateSupabaseConfig: (config: DatabaseConfig) => void;
}

// Global declaration for TypeScript
declare global {
  interface Window {
    databaseConfig?: DatabaseConfig;
  }
}
