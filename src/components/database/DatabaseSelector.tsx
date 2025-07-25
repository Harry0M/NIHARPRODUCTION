import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Database, Trash2, Eye, EyeOff, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatabaseConfig } from '@/types/database';

interface DatabaseSelectorProps {
  onDatabaseSelected: (config: DatabaseConfig) => void;
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({ onDatabaseSelected }) => {
  const [databases, setDatabases] = useState<DatabaseConfig[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [showNewDatabaseDialog, setShowNewDatabaseDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [newDatabase, setNewDatabase] = useState<Omit<DatabaseConfig, 'id'>>({
    name: '',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
    type: 'postgresql'
  });

  // Load saved databases from localStorage on component mount
  useEffect(() => {
    const savedDatabases = localStorage.getItem('savedDatabases');
    if (savedDatabases) {
      setDatabases(JSON.parse(savedDatabases));
    }
    
    // Check if there's a last used database
    const lastUsed = localStorage.getItem('lastUsedDatabase');
    if (lastUsed) {
      setSelectedDatabase(lastUsed);
    }
  }, []);

  const saveDatabases = (dbList: DatabaseConfig[]) => {
    localStorage.setItem('savedDatabases', JSON.stringify(dbList));
    setDatabases(dbList);
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      // Simulate connection test for web version
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation
      if (!newDatabase.host || !newDatabase.database || !newDatabase.username) {
        throw new Error('Missing required fields');
      }
      
      setTestResult({ success: true, message: 'Connection successful! (Web simulation)' });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const addNewDatabase = () => {
    if (!newDatabase.name || !newDatabase.host || !newDatabase.database) {
      alert('Please fill in all required fields');
      return;
    }

    const newConfig: DatabaseConfig = {
      ...newDatabase,
      id: Date.now().toString()
    };

    const updatedDatabases = [...databases, newConfig];
    saveDatabases(updatedDatabases);
    setSelectedDatabase(newConfig.id);
    setShowNewDatabaseDialog(false);
    
    // Reset form
    setNewDatabase({
      name: '',
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      type: 'postgresql'
    });
    setTestResult(null);
  };

  const deleteDatabase = (id: string) => {
    const updatedDatabases = databases.filter(db => db.id !== id);
    saveDatabases(updatedDatabases);
    if (selectedDatabase === id) {
      setSelectedDatabase('');
    }
  };

  const connectToDatabase = () => {
    const selected = databases.find(db => db.id === selectedDatabase);
    if (selected) {
      localStorage.setItem('lastUsedDatabase', selected.id);
      onDatabaseSelected(selected);
    }
  };

  const continueWithDefault = () => {
    // Create a default database configuration
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
    
    // Mark as using default
    localStorage.setItem('usingDefaultDatabase', 'true');
    onDatabaseSelected(defaultConfig);
  };

  const getDefaultPort = (type: string) => {
    switch (type) {
      case 'postgresql': return 5432;
      case 'mysql': return 3306;
      case 'sqlite': return 0;
      default: return 5432;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Database className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Database Configuration</CardTitle>
          <CardDescription>
            Select an existing database connection or configure a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {databases.length > 0 && (
            <div className="space-y-4">
              <Label htmlFor="database-select">Select Database Connection</Label>
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger id="database-select">
                  <SelectValue placeholder="Choose a database..." />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{db.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {db.type} - {db.host}:{db.port}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {databases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {databases.map((db) => (
                    <div key={db.id} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md">
                      <span className="text-sm">{db.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => deleteDatabase(db.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => setShowNewDatabaseDialog(true)}
              variant="outline"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Database
            </Button>
            
            {selectedDatabase && (
              <Button onClick={connectToDatabase} className="flex-1">
                Connect to Database
              </Button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            onClick={continueWithDefault} 
            variant="secondary" 
            className="w-full"
          >
            <Database className="h-4 w-4 mr-2" />
            Continue with Default Configuration
          </Button>

          {databases.length === 0 && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>No database connections configured.</strong><br />
                You can add a new database connection or continue with the default configuration for demo purposes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewDatabaseDialog} onOpenChange={setShowNewDatabaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Database Connection</DialogTitle>
            <DialogDescription>
              Configure a new database connection for your application
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="db-name">Connection Name *</Label>
              <Input
                id="db-name"
                value={newDatabase.name}
                onChange={(e) => setNewDatabase({...newDatabase, name: e.target.value})}
                placeholder="Production DB, Development DB, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="db-type">Database Type</Label>
              <Select 
                value={newDatabase.type} 
                onValueChange={(value: 'postgresql' | 'mysql' | 'sqlite') => 
                  setNewDatabase({...newDatabase, type: value, port: getDefaultPort(value)})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="sqlite">SQLite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="db-host">Host *</Label>
                <Input
                  id="db-host"
                  value={newDatabase.host}
                  onChange={(e) => setNewDatabase({...newDatabase, host: e.target.value})}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label htmlFor="db-port">Port</Label>
                <Input
                  id="db-port"
                  type="number"
                  value={newDatabase.port}
                  onChange={(e) => setNewDatabase({...newDatabase, port: parseInt(e.target.value) || 5432})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="db-database">Database Name *</Label>
              <Input
                id="db-database"
                value={newDatabase.database}
                onChange={(e) => setNewDatabase({...newDatabase, database: e.target.value})}
                placeholder="nihar_business"
              />
            </div>
            
            <div>
              <Label htmlFor="db-username">Username *</Label>
              <Input
                id="db-username"
                value={newDatabase.username}
                onChange={(e) => setNewDatabase({...newDatabase, username: e.target.value})}
                placeholder="database_user"
              />
            </div>
            
            <div>
              <Label htmlFor="db-password">Password</Label>
              <div className="relative">
                <Input
                  id="db-password"
                  type={showPassword ? "text" : "password"}
                  value={newDatabase.password}
                  onChange={(e) => setNewDatabase({...newDatabase, password: e.target.value})}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {testResult && (
              <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                  {testResult.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <>
                  <TestTube className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button onClick={addNewDatabase} disabled={testingConnection}>
              Add Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseSelector;
