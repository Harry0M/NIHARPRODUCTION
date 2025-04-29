
import { v4 as uuidv4 } from "uuid";
import { ComponentData } from "@/types/order";

export const handleComponentChange = (
  components: Record<string, ComponentData>,
  type: string,
  field: string,
  value: string,
  orderQuantity: number
): Record<string, ComponentData> => {
  const component = components[type] || { 
    id: uuidv4(),
    type 
  };
  
  let updatedComponent = {
    ...component,
    [field]: value
  };
  
  // If quantity changes, recalculate consumption
  if (field === 'length' || field === 'width' || field === 'roll_width') {
    const length = parseFloat(field === 'length' ? value : component.length || '0');
    const width = parseFloat(field === 'width' ? value : component.width || '0');
    const roll_width = parseFloat(field === 'roll_width' ? value : component.roll_width || '0');
    
    if (length && width && roll_width && type !== 'chain' && type !== 'runner') {
      updatedComponent.consumption = ((length * width) / (roll_width * 39.39)) * orderQuantity;
    }
  }
  
  return {
    ...components,
    [type]: updatedComponent
  };
};

export const handleCustomComponentChange = (
  customComponents: ComponentData[],
  index: number,
  field: string,
  value: string,
  orderQuantity: number
): ComponentData[] => {
  const updated = [...customComponents];
  
  let updatedComponent = {
    ...updated[index],
    [field]: value
  };
  
  // If dimensions or roll width changes, recalculate consumption
  if (field === 'length' || field === 'width' || field === 'roll_width') {
    const length = parseFloat(field === 'length' ? value : updated[index].length || '0');
    const width = parseFloat(field === 'width' ? value : updated[index].width || '0');
    const roll_width = parseFloat(field === 'roll_width' ? value : updated[index].roll_width || '0');
    
    if (length && width && roll_width) {
      updatedComponent.consumption = ((length * width) / (roll_width * 39.39)) * orderQuantity;
    }
  }
  
  updated[index] = updatedComponent;
  return updated;
};

export const addCustomComponent = (customComponents: ComponentData[]): ComponentData[] => {
  return [
    ...customComponents, 
    { 
      id: uuidv4(),
      type: "custom",
      customName: "" 
    }
  ];
};

export const removeCustomComponent = (
  customComponents: ComponentData[], 
  index: number
): ComponentData[] => {
  return customComponents.filter((_, i) => i !== index);
};

export const handleProductSelect = (
  catalogComponents: any[],
  orderQuantity: number
): { 
  standardComponents: Record<string, ComponentData>,
  customItems: ComponentData[] 
} => {
  const standardComponents: Record<string, ComponentData> = {};
  const customItems: ComponentData[] = [];
  
  catalogComponents.forEach(comp => {
    // Determine if this is a standard or custom component
    const standardTypes = ["part", "border", "handle", "chain", "runner"];
    const isStandard = standardTypes.includes(comp.component_type);
    
    // Calculate consumption based on order quantity
    const consumption = comp.consumption ? comp.consumption * orderQuantity : undefined;
    
    const componentData: ComponentData = {
      id: uuidv4(),
      type: comp.component_type,
      length: comp.length?.toString() || '',
      width: comp.width?.toString() || '',
      color: comp.color || '',
      customName: comp.custom_name || '',
      material_id: comp.material_id || null,
      roll_width: comp.roll_width?.toString() || '',
      consumption: consumption,
      gsm: comp.gsm?.toString() || ''
    };
    
    if (isStandard) {
      standardComponents[comp.component_type] = componentData;
    } else {
      customItems.push(componentData);
    }
  });
  
  return { standardComponents, customItems };
};
