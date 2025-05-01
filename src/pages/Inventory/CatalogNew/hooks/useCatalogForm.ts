import { useState } from "react";
import { ProductDetails, Component, Material, MaterialUsage } from "../types";

export const useCatalogForm = (materials: Material[]) => {
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    name: "",
    bag_length: 0,
    bag_width: 0,
    height: 0,
  });
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updatedComponents = [...prev];
      updatedComponents[index] = {
        ...updatedComponents[index],
        [field]: value
      };
      return updatedComponents;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'custom',
        component_type: 'custom',
        custom_name: '',
        color: '',
        gsm: '',
        length: '',
        width: '',
        material_id: '',
        roll_width: '',
        consumption: ''
      }
    ]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => {
      const updatedComponents = [...prev];
      updatedComponents.splice(index, 1);
      return updatedComponents;
    });
  };

  const usedMaterials = (): MaterialUsage[] => {
    const used: MaterialUsage[] = [];

    Object.values(components).forEach(comp => {
      if (comp && comp.material_id && comp.material_id !== 'not_applicable') {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && comp.consumption) {
          const consumption = parseFloat(comp.consumption);
          const unit_cost = material.purchase_price || 0;
          const total_cost = unit_cost * consumption;

          used.push({
            id: crypto.randomUUID(),
            material_id: comp.material_id,
            material_name: material.material_type,
            component_type: comp.type || comp.component_type || '',
            consumption: consumption,
            unit_cost: unit_cost,
            total_cost: total_cost,
            quantity: consumption,
            unit: material.unit,
            cost: total_cost,
            name: `${material.material_type} ${material.color ? `(${material.color})` : ''}`
          });
        }
      }
    });

    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable') {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && comp.consumption) {
          const consumption = parseFloat(comp.consumption);
          const unit_cost = material.purchase_price || 0;
          const total_cost = unit_cost * consumption;

          used.push({
            id: crypto.randomUUID(),
            material_id: comp.material_id,
            material_name: material.material_type,
            component_type: comp.custom_name || 'custom',
            consumption: consumption,
            unit_cost: unit_cost,
            total_cost: total_cost,
            quantity: consumption,
            unit: material.unit,
            cost: total_cost,
            name: `${material.material_type} ${material.color ? `(${material.color})` : ''}`
          });
        }
      }
    });

    return used;
  };

  return {
    productDetails,
    setProductDetails,
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    materialCost,
    totalCost,
    handleProductChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    usedMaterials
  };
};
