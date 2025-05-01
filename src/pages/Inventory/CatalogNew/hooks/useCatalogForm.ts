
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { CustomComponent, Material, MaterialUsage } from "../types";

export const useCatalogForm = (materials: Material[]) => {
  // Product details state
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    bag_length: 0,
    bag_width: 0,
    height: 0,
    default_quantity: 1,
    default_rate: 0,
    cutting_charge: 0,
    printing_charge: 0,
    stitching_charge: 0,
    transport_charge: 0
  });

  // Standard components state
  const [components, setComponents] = useState<Record<string, any>>({});

  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);

  // Calculate total material cost
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (materials.length > 0) {
      calculateMaterialCost();
    }
  }, [components, customComponents, materials, productDetails.default_quantity]);

  useEffect(() => {
    // Calculate total cost whenever any cost component changes
    setTotalCost(
      materialCost +
      productDetails.cutting_charge +
      productDetails.printing_charge +
      productDetails.stitching_charge +
      productDetails.transport_charge
    );
  }, [
    materialCost,
    productDetails.cutting_charge,
    productDetails.printing_charge,
    productDetails.stitching_charge,
    productDetails.transport_charge
  ]);

  const calculateMaterialCost = () => {
    if (materials.length === 0) return;

    let cost = 0;
    const defaultQuantity = productDetails.default_quantity || 1;

    // Calculate cost for standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) * defaultQuantity;
        }
      }
    });

    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) * defaultQuantity;
        }
      }
    });

    setMaterialCost(cost);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: name === 'description' ? value : value === '' ? '' : Number(value)
    }));
  };

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

      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) &&
        updatedComponent.roll_width && updatedComponent.length && updatedComponent.width) {
        const length = parseFloat(updatedComponent.length);
        const width = parseFloat(updatedComponent.width);
        const rollWidth = parseFloat(String(updatedComponent.roll_width));

        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4);
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
      const component = { ...updated[index], [field]: value };

      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) &&
        component.roll_width && component.length && component.width) {
        const length = parseFloat(String(component.length));
        const width = parseFloat(String(component.width));
        const rollWidth = parseFloat(String(component.roll_width));

        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          component.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4);
        }
      }

      updated[index] = component;
      return updated;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents,
      {
        id: uuidv4(),
        type: "custom",
        component_type: "custom",
        custom_name: "",
        color: "",
        gsm: "",
        size: ""
      }
    ]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

  // Used materials list
  const usedMaterials = (): MaterialUsage[] => {
    if (materials.length === 0) return [];

    const materialUsage: Record<string, MaterialUsage> = {};
    const defaultQuantity = productDetails.default_quantity || 1;

    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumptionValue = parseFloat(String(comp.consumption)) * defaultQuantity;
          const costValue = material.purchase_price ? consumptionValue * parseFloat(String(material.purchase_price)) : 0;

          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              material_id: comp.material_id,
              material_name: material.material_type,
              component_type: comp.type,
              consumption: consumptionValue,
              unit_cost: parseFloat(String(material.purchase_price)) || 0,
              total_cost: costValue,
              quantity: consumptionValue,
              unit: material.unit,
              cost: costValue,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : '')
            };
          } else {
            materialUsage[comp.material_id].quantity += consumptionValue;
            materialUsage[comp.material_id].cost += costValue;
            materialUsage[comp.material_id].total_cost += costValue;
          }
        }
      }
    });

    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumptionValue = parseFloat(String(comp.consumption)) * defaultQuantity;
          const costValue = material.purchase_price ? consumptionValue * parseFloat(String(material.purchase_price)) : 0;

          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              material_id: comp.material_id,
              material_name: material.material_type,
              component_type: comp.component_type,
              consumption: consumptionValue,
              unit_cost: parseFloat(String(material.purchase_price)) || 0,
              total_cost: costValue,
              quantity: consumptionValue,
              unit: material.unit,
              cost: costValue,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : '')
            };
          } else {
            materialUsage[comp.material_id].quantity += consumptionValue;
            materialUsage[comp.material_id].cost += costValue;
            materialUsage[comp.material_id].total_cost += costValue;
          }
        }
      }
    });

    return Object.values(materialUsage);
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
