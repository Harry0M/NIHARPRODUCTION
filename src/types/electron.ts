export interface ElectronAPI {
  testDatabaseConnection: (config: DatabaseConfig) => Promise<{ success: boolean; message: string }>;
  getDatabaseList: (config: DatabaseConfig) => Promise<string[]>;
  validateDatabaseSchema: (config: DatabaseConfig) => Promise<{ valid: boolean; message: string }>;
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
