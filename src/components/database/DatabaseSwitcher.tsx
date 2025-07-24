import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Database, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useDatabaseConfig } from '@/hooks/useDatabaseConfig';
import DatabaseSelector from './DatabaseSelector';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DatabaseConfig } from '@/types/database';

const DatabaseSwitcher: React.FC = () => {
  const { currentDatabase, clearDatabase } = useDatabaseConfig();
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(false);

  const handleDatabaseSwitch = () => {
    setShowDatabaseSelector(true);
  };

  const handleDisconnect = () => {
    clearDatabase();
    // This will trigger the app to show the database selector again
    window.location.reload();
  };

  const handleDatabaseSelected = (config: DatabaseConfig) => {
    setShowDatabaseSelector(false);
    // The context will handle updating the current database
  };

  if (!currentDatabase) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Database className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Database Connection</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{currentDatabase.name}</p>
            <p className="text-xs text-muted-foreground">
              {currentDatabase.type} - {currentDatabase.host}:{currentDatabase.port}
            </p>
            <p className="text-xs text-muted-foreground">
              Database: {currentDatabase.database}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDatabaseSwitch}>
            <Settings className="h-4 w-4 mr-2" />
            Switch Database
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDatabaseSelector} onOpenChange={setShowDatabaseSelector}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DatabaseSelector onDatabaseSelected={handleDatabaseSelected} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DatabaseSwitcher;
