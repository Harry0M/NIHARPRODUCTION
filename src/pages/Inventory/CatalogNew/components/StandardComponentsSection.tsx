
import React from 'react';
import { StandardComponents } from "@/components/orders/StandardComponents";
import { useComponentContext } from '../context/ComponentContext';

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
};

export const StandardComponentsSection: React.FC = () => {
  const { 
    components, 
    handleComponentChange, 
    defaultQuantity 
  } = useComponentContext();

  return (
    <StandardComponents 
      components={components}
      componentOptions={componentOptions}
      onChange={handleComponentChange}
      defaultQuantity={defaultQuantity}
      showConsumption={true}
    />
  );
};
