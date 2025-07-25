# Database Configuration Setup Guide

## Overview

Your Nihar Business Manager now supports multiple database connections! When you start the application, you'll see a database configuration screen where you can:

1. **Add new database connections**
2. **Switch between existing databases**
3. **Test connections before using them**
4. **Manage saved database credentials**

## Supported Database Types

- **PostgreSQL** (Default port: 5432)
- **MySQL** (Default port: 3306)
- **SQLite** (File-based database)

## How to Configure

### First Time Setup
1. When you open the application, you'll see the database configuration screen
2. Click "Add New Database" to configure your first connection
3. Fill in the required information:
   - **Connection Name**: A friendly name (e.g., "Production DB", "Development DB")
   - **Database Type**: Choose from PostgreSQL, MySQL, or SQLite
   - **Host**: Database server address (e.g., "localhost", "192.168.1.100")
   - **Port**: Database port (auto-filled based on database type)
   - **Database Name**: The specific database name
   - **Username**: Database user
   - **Password**: Database password (optional, stored locally)

4. Click "Test Connection" to verify the settings
5. Click "Add Database" to save the configuration
6. Select your database and click "Connect to Database"

### Switching Databases
- Once connected, you can switch databases using the database icon in the header
- Click the database icon → "Switch Database" to choose a different connection
- Your connection history is saved for quick access

### Managing Connections
- **Delete**: Remove saved connections you no longer need
- **Disconnect**: Log out of the current database (shows the selector again)
- **Test**: Verify connection settings work correctly

## Security Features

- Database credentials are stored locally in your browser
- Connection testing is handled securely in the browser environment
- Passwords are not visible by default (click the eye icon to show/hide)
- No database credentials are sent to external servers

## Troubleshooting

### Connection Issues
1. **Check network connectivity** to your database server
2. **Verify credentials** - username, password, database name
3. **Check firewall settings** - ensure the database port is accessible
4. **Database server status** - make sure the database service is running

### Common Error Messages
- **"Missing required fields"**: Fill in all required connection details
- **"Connection failed"**: Check host, port, and network connectivity
- **"Authentication failed"**: Verify username and password
- **"Database not found"**: Check if the database name exists

## Example Configurations

### Local PostgreSQL
- **Type**: PostgreSQL  
- **Host**: localhost
- **Port**: 5432
- **Database**: nihar_business
- **Username**: postgres

### Remote MySQL
- **Type**: MySQL
- **Host**: your-server.com
- **Port**: 3306
- **Database**: nihar_production
- **Username**: nihar_user

### SQLite File
- **Type**: SQLite
- **Host**: (not used)
- **Port**: 0
- **Database**: /path/to/database.db
- **Username**: (not required)

## Next Steps

After configuring your database:
1. The application will load with your selected database
2. All data operations will use the configured connection
3. You can switch databases anytime using the header menu
4. Your connection preferences are remembered between sessions

## Support

If you encounter issues:
1. Check the console/developer tools for detailed error messages
2. Verify your database server is accessible
3. Test with a simple database client first
4. Ensure your database has the required schema/tables
