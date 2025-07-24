const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  testDatabaseConnection: (config) => ipcRenderer.invoke('test-database-connection', config),
  getDatabaseList: (config) => ipcRenderer.invoke('get-database-list', config),
  validateDatabaseSchema: (config) => ipcRenderer.invoke('validate-database-schema', config),
  
  // System information
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }
});
