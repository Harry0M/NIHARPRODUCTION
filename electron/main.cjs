const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

console.log('isDev:', isDev);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('app.isPackaged:', app.isPackaged);

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Add your app icon here
    show: false, // Don't show until ready-to-show
    titleBarStyle: 'default'
  });

  // Load the app
  console.log('Loading app, isDev:', isDev);
  if (isDev) {
    console.log('Loading development URL: http://localhost:8080');
    mainWindow.loadURL('http://localhost:8080').catch(err => {
      console.error('Failed to load development URL:', err);
    });
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    console.log('Loading production file:', filePath);
    mainWindow.loadFile(filePath).catch(err => {
      console.error('Failed to load production file:', err);
    });
  }

  // Add error handling for failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, 'Error:', errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    app.quit();
  });

  return mainWindow;
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  
  // Set up IPC handlers for database operations
  setupDatabaseIPC();

  // Set application menu (optional - you can customize this)
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

// Database IPC handlers
function setupDatabaseIPC() {
  // Test database connection
  ipcMain.handle('test-database-connection', async (event, config) => {
    try {
      console.log('Testing database connection:', {
        host: config.host,
        port: config.port,
        database: config.database,
        type: config.type
      });
      
      // Here you would implement actual database connection testing
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!config.host || !config.database || !config.username) {
        throw new Error('Missing required connection parameters');
      }
      
      // In a real implementation, you would:
      // 1. Use appropriate database drivers (pg, mysql2, sqlite3, etc.)
      // 2. Actually test the connection
      // 3. Return detailed error messages
      
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return { 
        success: false, 
        message: error.message || 'Connection failed' 
      };
    }
  });
  
  // Get database list (for future use)
  ipcMain.handle('get-database-list', async (event, config) => {
    try {
      // This would query the database server for available databases
      // Return mock data for now
      return ['nihar_production', 'nihar_staging', 'nihar_development'];
    } catch (error) {
      console.error('Failed to get database list:', error);
      return [];
    }
  });
  
  // Validate database schema (for future use)
  ipcMain.handle('validate-database-schema', async (event, config) => {
    try {
      // This would check if the database has the required tables and structure
      return { valid: true, message: 'Schema is valid' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  });
}
