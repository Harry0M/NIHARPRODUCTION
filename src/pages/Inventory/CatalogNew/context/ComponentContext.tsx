
import React, { createContext, useContext } from 'react';

interface ComponentContextType {
  components: Record<string, any>;
  customComponents: any[];
  materialPrices: Record<string, number>;
  fetchMaterialPrice: (materialId: string) => Promise<number | null>;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity: string;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

export const ComponentProvider: React.FC<{ children: React.ReactNode; value: ComponentContextType }> = ({ 
  children, 
  value 
}) => {
  return <ComponentContext.Provider value={value}>{children}</ComponentContext.Provider>;
};

export const useComponentContext = (): ComponentContextType => {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('useComponentContext must be used within a ComponentProvider');
  }
  return context;
};
