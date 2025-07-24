import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you need to expose from main process to renderer
  // For example:
  // getVersion: () => ipcRenderer.invoke('app:getVersion'),
  // onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  
  // For now, we'll keep it minimal since your app is mostly web-based
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  }
});
