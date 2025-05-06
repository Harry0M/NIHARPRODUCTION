
import { createContext, useContext, ReactNode } from 'react';

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
  consumption?: string;
  baseConsumption?: string;
  materialRate?: number;
  materialCost?: number;
}

interface ComponentContextType {
  components: Record<string, any>;
  customComponents: ComponentType[];
  materialPrices: Record<string, number>;
  fetchMaterialPrice: (materialId: string) => Promise<number | null>;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity?: string;
}

const ComponentContext = createContext<ComponentContextType | undefined>(undefined);

export const ComponentProvider = ({ 
  children, 
  value 
}: { 
  children: ReactNode, 
  value: ComponentContextType 
}) => {
  return (
    <ComponentContext.Provider value={value}>
      {children}
    </ComponentContext.Provider>
  );
};

export const useComponentContext = () => {
  const context = useContext(ComponentContext);
  if (context === undefined) {
    throw new Error('useComponentContext must be used within a ComponentProvider');
  }
  return context;
};
