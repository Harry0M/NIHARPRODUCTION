
import React from 'react';
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { useComponentContext } from '../context/ComponentContext';

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
};

export const CustomComponentsSection: React.FC = () => {
  const { 
    customComponents, 
    handleCustomComponentChange, 
    removeCustomComponent, 
    defaultQuantity 
  } = useComponentContext();

  return (
    <CustomComponentSection 
      customComponents={customComponents}
      componentOptions={componentOptions}
      handleCustomComponentChange={handleCustomComponentChange}
      removeCustomComponent={removeCustomComponent}
      defaultQuantity={defaultQuantity}
      showConsumption={true}
    />
  );
};
