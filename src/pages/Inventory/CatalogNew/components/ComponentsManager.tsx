
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StandardComponentsSection } from './StandardComponentsSection';
import { CustomComponentsSection } from './CustomComponentsSection';
import { useComponentContext } from '../context/ComponentContext';

interface ComponentsManagerProps {
  totalConsumption: number;
}

const ComponentsManager: React.FC<ComponentsManagerProps> = ({ totalConsumption }) => {
  const { addCustomComponent } = useComponentContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bag Components</CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>Specify the details for each component of the bag</span>
          {totalConsumption > 0 && (
            <span className="font-medium text-sm bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
              Total Consumption: {totalConsumption.toFixed(2)} meters
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <StandardComponentsSection />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Custom Components</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={addCustomComponent}
              >
                + Add Custom Component
              </Button>
            </div>
            
            <CustomComponentsSection />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComponentsManager;
