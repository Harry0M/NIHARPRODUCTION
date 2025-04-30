
import { v4 as uuidv4 } from "uuid";
import { Component } from "@/types/order";
import { OrderFormData } from "@/types/order";

export function useComponentHandlers(
  components: Record<string, any>,
  setComponents: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  customComponents: Component[],
  setCustomComponents: React.Dispatch<React.SetStateAction<Component[]>>,
  orderDetails: OrderFormData
) {
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // Recalculate consumption if length, width or roll_width changes
      if ((field === 'length' || field === 'width' || field === 'roll_width') && 
          updatedComponent.length && updatedComponent.width && updatedComponent.roll_width) {
        const length = parseFloat(updatedComponent.length);
        const width = parseFloat(updatedComponent.width);
        const rollWidth = parseFloat(String(updatedComponent.roll_width));
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          const orderQuantity = parseInt(orderDetails.quantity) || 1;
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39) * orderQuantity).toFixed(2);
        }
      }
      
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      
      // Update the specified field
      updated[index] = { 
        ...updated[index], 
        [field]: value 
      };
      
      // Recalculate consumption if needed
      if ((field === 'length' || field === 'width' || field === 'roll_width') && 
          updated[index].length && updated[index].width && updated[index].roll_width) {
        const length = parseFloat(updated[index].length as string);
        const width = parseFloat(updated[index].width as string);
        const rollWidth = parseFloat(String(updated[index].roll_width));
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          const orderQuantity = parseInt(orderDetails.quantity) || 1;
          updated[index].consumption = ((length * width) / (rollWidth * 39.39) * orderQuantity).toFixed(2);
        }
      }
      
      return updated;
    });
  };

  return {
    handleComponentChange,
    handleCustomComponentChange
  };
}
