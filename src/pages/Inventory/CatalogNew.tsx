import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { useProductForm } from "./CatalogNew/hooks/useProductForm";
import { v4 as uuidv4 } from "uuid";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  // GSM has been completely removed
};

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
  formula?: 'standard' | 'linear' | 'manual';
  is_manual_consumption?: boolean;
}

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    border_dimension: "", 
    default_quantity: "",
    default_rate: "",
    selling_rate: "",
    margin: "",
    // Cost fields
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0",
    material_cost: "0", // This will be calculated based on components
    total_cost: "0"     // This will be the sum of all costs
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<ComponentType[]>([]);
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});
  
  // Function to handle product form field changes without linking margin and selling rate
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Unlinked handling for all fields - no automatic calculations between selling_rate and margin
    setProductData(prev => {
      const updatedData = {
        ...prev,
        [name]: value
      };
      
      // Calculate total cost whenever cost-related fields change
      if (['cutting_charge', 'printing_charge', 'stitching_charge', 'transport_charge', 'material_cost'].includes(name)) {
        const totalCost = calculateTotalCost(updatedData);
        updatedData.total_cost = totalCost.toString();
        
        // No longer automatically updating margin or selling_rate when costs change
        // This allows the user to set them independently
      }
      
      // No automatic recalculation between margin and selling_rate
      // They will be calculated only on form submission
      
      return updatedData;
    });
  };
  
  // Function to fetch material price by ID
  const fetchMaterialPrice = async (materialId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('purchase_rate, rate')
        .eq('id', materialId)
        .single();
      
      if (error) {
        console.error("Error fetching material price:", error);
        return null;
      }
      
      // Use purchase_rate if available, otherwise fall back to rate
      const materialRate = data.purchase_rate || data.rate || 0;
      console.log(`Material ${materialId} price:`, materialRate);
      
      // Add to materialPrices state
      setMaterialPrices(prev => ({
        ...prev,
        [materialId]: materialRate
      }));
      
      return materialRate;
    } catch (error) {
      console.error("Error in fetchMaterialPrice:", error);
      return null;
    }
  };
  
  // Function to calculate consumption based on dimensions
  const calculateConsumption = (
    length?: string, 
    width?: string, 
    rollWidth?: string, 
    formula: 'standard' | 'linear' = 'standard'
  ): string | undefined => {
    if (!length) return undefined;
    
    const lengthVal = parseFloat(length);
    
    if (isNaN(lengthVal)) {
      return undefined;
    }
    
    if (formula === 'standard') {
      // Standard formula: (length * width) / (roll_width * 39.39)
      if (!width || !rollWidth) return undefined;
      
      const widthVal = parseFloat(width);
      const rollWidthVal = parseFloat(rollWidth);
      
      if (isNaN(widthVal) || isNaN(rollWidthVal) || rollWidthVal <= 0) {
        return undefined;
      }
      
      const consumption = (lengthVal * widthVal) / (rollWidthVal * 39.39);
      return consumption.toFixed(4);
    } else {
      // Linear formula: (quantity * length) / 39.39
      // Note: in this context, we don't have quantity yet, so we calculate base consumption
      // The quantity will be applied later
      const consumption = lengthVal / 39.39;
      return consumption.toFixed(4);
    }
  };
  
  // Calculate material cost for a component
  const calculateComponentMaterialCost = (component: any): number => {
    if (!component.material_id || !component.consumption) return 0;
    
    const materialId = component.material_id;
    const consumption = parseFloat(component.consumption);
    const rate = materialPrices[materialId] || 0;
    
    if (isNaN(consumption) || isNaN(rate)) return 0;
    
    const cost = consumption * rate;
    return cost;
  };
  
  // Calculate total material cost from all components
  const calculateTotalMaterialCost = (): number => {
    let totalCost = 0;
    
    // Add costs from standard components
    Object.values(components).forEach((component: any) => {
      if (component.materialCost) {
        const componentCost = parseFloat(String(component.materialCost));
        if (!isNaN(componentCost)) {
          totalCost += componentCost;
        }
      } else if (component.material_id && component.consumption) {
        const componentCost = calculateComponentMaterialCost(component);
        totalCost += componentCost;
      }
    });
    
    // Add costs from custom components
    customComponents.forEach((component) => {
      if (component.materialCost) {
        const componentCost = parseFloat(String(component.materialCost));
        if (!isNaN(componentCost)) {
          totalCost += componentCost;
        }
      } else if (component.material_id && component.consumption) {
        const componentCost = calculateComponentMaterialCost(component);
        totalCost += componentCost;
      }
    });
    
    return totalCost;
  };
  
  // Update material costs whenever components or material prices change
  useEffect(() => {
    const totalMaterialCost = calculateTotalMaterialCost();
    
    setProductData(prev => {
      const updatedData = {
        ...prev,
        material_cost: totalMaterialCost.toFixed(2)
      };
      
      // Also update total cost
      const totalCost = calculateTotalCost({
        ...updatedData
      });
      
      updatedData.total_cost = totalCost.toString();
      
      // If selling_rate exists, update margin
      if (updatedData.selling_rate && parseFloat(updatedData.selling_rate) > 0 && totalCost > 0) {
        const calculatedMargin = ((parseFloat(updatedData.selling_rate) - totalCost) / totalCost) * 100;
        updatedData.margin = calculatedMargin.toFixed(2);
      }
      
      return updatedData;
    });
  }, [components, customComponents, materialPrices]);
  
  // Function to update consumption values based on dimensions and default quantity
  const updateConsumptionValues = () => {
    // Update standard components
    const updatedComponents = { ...components };
    let hasUpdates = false;
    
    Object.keys(updatedComponents).forEach(type => {
      const component = updatedComponents[type];
      const formula = component.formula || 'standard';
      
      // Check if we have the required fields based on formula
      const hasRequiredFields = formula === 'standard' 
        ? component.length && component.width && component.roll_width
        : component.length;
      
      if (hasRequiredFields) {
        const baseConsumption = calculateConsumption(
          component.length,
          component.width,
          component.roll_width,
          formula
        );
        
        if (baseConsumption) {
          const consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          updatedComponents[type] = {
            ...component,
            baseConsumption,
            consumption
          };
          
          // Also calculate material cost if material_id is present
          if (component.material_id && materialPrices[component.material_id]) {
            const materialRate = materialPrices[component.material_id];
            const materialCost = parseFloat(consumption) * materialRate;
            updatedComponents[type].materialCost = materialCost;
          }
          
          hasUpdates = true;
        }
      } else if (formula === 'linear' && component.length) {
        // Special case for linear formula with just length
        const baseConsumption = calculateConsumption(
          component.length,
          undefined,
          undefined,
          'linear'
        );
        
        if (baseConsumption) {
          const consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          updatedComponents[type] = {
            ...component,
            baseConsumption,
            consumption
          };
          
          // Also calculate material cost if material_id is present
          if (component.material_id && materialPrices[component.material_id]) {
            const materialRate = materialPrices[component.material_id];
            const materialCost = parseFloat(consumption) * materialRate;
            updatedComponents[type].materialCost = materialCost;
          }
          
          hasUpdates = true;
        }
      }
    });
    
    if (hasUpdates) {
      setComponents(updatedComponents);
    }
    
    // Update custom components
    const updatedCustomComponents = customComponents.map(component => {
      const formula = component.formula || 'standard';
      
      // Check if we have the required fields based on formula
      const hasRequiredFields = formula === 'standard' 
        ? component.length && component.width && component.roll_width
        : component.length;
      
      if (hasRequiredFields) {
        const baseConsumption = calculateConsumption(
          component.length,
          component.width,
          component.roll_width,
          formula
        );
        
        if (baseConsumption) {
          const consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          const updatedComponent = {
            ...component,
            baseConsumption,
            consumption
          };
          
          // Also calculate material cost if material_id and rate are present
          if (component.material_id && materialPrices[component.material_id]) {
            const materialRate = materialPrices[component.material_id];
            const materialCost = parseFloat(consumption) * materialRate;
            updatedComponent.materialCost = materialCost;
          }
          
          return updatedComponent;
        }
      } else if (formula === 'linear' && component.length) {
        // Special case for linear formula with just length
        const baseConsumption = calculateConsumption(
          component.length,
          undefined,
          undefined,
          'linear'
        );
        
        if (baseConsumption) {
          const consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          const updatedComponent = {
            ...component,
            baseConsumption,
            consumption
          };
          
          // Also calculate material cost if material_id and rate are present
          if (component.material_id && materialPrices[component.material_id]) {
            const materialRate = materialPrices[component.material_id];
            const materialCost = parseFloat(consumption) * materialRate;
            updatedComponent.materialCost = materialCost;
          }
          
          return updatedComponent;
        }
      }
      return component;
    });
    
    setCustomComponents(updatedCustomComponents);
  };

  
  // Function to calculate total cost
  const calculateTotalCost = (data: typeof productData) => {
    const cuttingCharge = parseFloat(data.cutting_charge) || 0;
    const printingCharge = parseFloat(data.printing_charge) || 0;
    const stitchingCharge = parseFloat(data.stitching_charge) || 0;
    const transportCharge = parseFloat(data.transport_charge) || 0;
    const materialCost = parseFloat(data.material_cost) || 0;
    
    return cuttingCharge + printingCharge + stitchingCharge + transportCharge + materialCost;
  };

  const handleComponentChange = async (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // If material_id changed, fetch the material price
      if (field === 'material_id' && value) {
        fetchMaterialPrice(value).then(rate => {
          if (rate !== null) {
            setComponents(current => {
              const componentToUpdate = current[type] || {};
              const updatedComponent = {
                ...componentToUpdate,
                materialRate: rate
              };
              
              // Only calculate material cost if we have consumption and it's not manual
              if (updatedComponent.consumption && updatedComponent.formula !== 'manual') {
                const consumption = parseFloat(updatedComponent.consumption);
                if (!isNaN(consumption)) {
                  updatedComponent.materialCost = consumption * rate;
                }
              }
              
              return {
                ...current,
                [type]: updatedComponent
              };
            });
          }
        });
      }
      
      // If consumption is changed manually, only set the manual flag if explicitly intended
      // Don't automatically change formula to 'manual' - preserve the original formula
      if (field === 'consumption') {
        // Only set manual consumption flag if this is an explicit manual entry
        // The formula should be preserved and only changed via the toggle/formula selector
      }
      
      // If dimensions are changed, reset manual flag and recalculate
      if (['length', 'width', 'roll_width'].includes(field)) {
        updatedComponent.is_manual_consumption = false;
        // Preserve the original formula - only reset if it was manual
        if (updatedComponent.formula === 'manual') {
          updatedComponent.formula = 'standard';
        }
        const formula = updatedComponent.formula || 'standard';
        const shouldRecalculate = 
          (formula === 'standard' && updatedComponent.length && updatedComponent.width && updatedComponent.roll_width) ||
          (formula === 'linear' && updatedComponent.length);
        
        if (shouldRecalculate) {
          const baseConsumption = calculateConsumption(
            updatedComponent.length,
            updatedComponent.width,
            updatedComponent.roll_width,
            formula
          );
          
          if (baseConsumption) {
            updatedComponent.baseConsumption = baseConsumption;
            updatedComponent.consumption = productData.default_quantity 
              ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
              : baseConsumption;
            
            // Also calculate material cost if material_id and rate are present
            if (updatedComponent.material_id && materialPrices[updatedComponent.material_id]) {
              const materialRate = materialPrices[updatedComponent.material_id];
              const consumptionValue = parseFloat(updatedComponent.consumption);
              const materialCost = consumptionValue * materialRate;
              updatedComponent.materialCost = materialCost;
              updatedComponent.materialRate = materialRate;
            }
          }
        }
      }
      
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };

  const handleCustomComponentChange = async (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      const updatedComponent = { ...updated[index], [field]: value };
      
      // If material_id changed, fetch the material price
      if (field === 'material_id' && value) {
        fetchMaterialPrice(value).then(rate => {
          if (rate !== null) {
            setCustomComponents(current => {
              const newComponents = [...current];
              const componentToUpdate = newComponents[index];
              componentToUpdate.materialRate = rate;
              
              // Only calculate material cost if we have consumption and it's not manual
              if (componentToUpdate.consumption && componentToUpdate.formula !== 'manual') {
                const consumption = parseFloat(componentToUpdate.consumption);
                if (!isNaN(consumption)) {
                  componentToUpdate.materialCost = consumption * rate;
                }
              }
              
              return newComponents;
            });
          }
        });
      }
      
      // If consumption is changed manually, only set the manual flag if explicitly intended
      // Don't automatically change formula to 'manual' - preserve the original formula
      if (field === 'consumption') {
        // Only set manual consumption flag if this is an explicit manual entry
        // The formula should be preserved and only changed via the toggle/formula selector
      }
      
      // If dimensions are changed, reset manual flag and recalculate
      if (['length', 'width', 'roll_width'].includes(field)) {
        updatedComponent.is_manual_consumption = false;
        // Preserve the original formula - only reset if it was manual
        if (updatedComponent.formula === 'manual') {
          updatedComponent.formula = 'standard';
        }
        const formula = updatedComponent.formula || 'standard';
        const shouldRecalculate = 
          (formula === 'standard' && updatedComponent.length && updatedComponent.width && updatedComponent.roll_width) ||
          (formula === 'linear' && updatedComponent.length);
        
        if (shouldRecalculate) {
          const baseConsumption = calculateConsumption(
            updatedComponent.length,
            updatedComponent.width,
            updatedComponent.roll_width,
            formula
          );
          
          if (baseConsumption) {
            updatedComponent.baseConsumption = baseConsumption;
            updatedComponent.consumption = productData.default_quantity 
              ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
              : baseConsumption;
            
            // Also calculate material cost if material_id and rate are present
            if (updatedComponent.material_id && materialPrices[updatedComponent.material_id]) {
              const materialRate = materialPrices[updatedComponent.material_id];
              const consumptionValue = parseFloat(updatedComponent.consumption);
              const materialCost = consumptionValue * materialRate;
              updatedComponent.materialCost = materialCost;
              updatedComponent.materialRate = materialRate;
            }
          }
        }
      }
      
      updated[index] = updatedComponent;
      return updated;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "" 
      }
    ]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total consumption for all components
  const totalConsumption = [...Object.values(components), ...customComponents]
    .reduce((total, comp) => {
      const consumption = comp.consumption ? parseFloat(comp.consumption) : 0;
      return isNaN(consumption) ? total : total + consumption;
    }, 0);

  // Calculate total component costs for display
  const componentCosts = [...Object.values(components), ...customComponents]
    .filter(comp => comp.materialCost || (comp.material_id && comp.consumption))
    .map(comp => {
      const consumption = parseFloat(comp.consumption || '0');
      const rate = comp.materialRate || materialPrices[comp.material_id || ''] || 0;
      const cost = comp.materialCost ? parseFloat(String(comp.materialCost)) : (consumption * rate);
      
      return {
        name: comp.type === 'custom' ? comp.customName || 'Custom component' : comp.type,
        consumption,
        rate,
        cost: !isNaN(cost) ? cost : 0,
        materialId: comp.material_id
      };
    });

  const validateForm = () => {
    if (!productData.name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (!productData.bag_length || parseFloat(productData.bag_length) <= 0) {
      toast({
        title: "Validation Error",
        description: "Valid bag length is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (!productData.bag_width || parseFloat(productData.bag_width) <= 0) {
      toast({
        title: "Validation Error",
        description: "Valid bag width is required",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  // Using the calculateTotalCost function defined earlier in the component

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format the name to include quantity if default_quantity is provided
      let formattedName = productData.name;
      if (productData.default_quantity) {
        formattedName = `${productData.name}*${productData.default_quantity}`;
      }
      
      // Calculate the final total cost
      const totalCost = calculateTotalCost(productData);
      
      // Create local variables for selling rate and margin to use in calculations
      let sellingRate = productData.selling_rate ? parseFloat(productData.selling_rate) : null;
      let margin = productData.margin ? parseFloat(productData.margin) : null;
      
      // Now calculate the missing value if one is provided but the other is not
      if (totalCost > 0) {
        // If selling_rate has a value but margin doesn't, calculate margin
        if (sellingRate !== null && sellingRate > 0 && (margin === null || margin <= 0)) {
          margin = ((sellingRate - totalCost) / totalCost) * 100;
        }
        // If margin has a value but selling_rate doesn't, calculate selling_rate
        else if (margin !== null && margin > 0 && (sellingRate === null || sellingRate <= 0)) {
          sellingRate = totalCost * (1 + (margin / 100));
        }
      }
      
      // Prepare product data with formatted name and all cost fields
      const productDbData = {
        name: formattedName,
        description: productData.description || null,
        bag_length: parseFloat(productData.bag_length),
        bag_width: parseFloat(productData.bag_width),
        border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : 0,
        default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
        default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
        selling_rate: sellingRate,
        margin: margin,
        // Add all the new cost fields
        cutting_charge: parseFloat(productData.cutting_charge) || 0,
        printing_charge: parseFloat(productData.printing_charge) || 0,
        stitching_charge: parseFloat(productData.stitching_charge) || 0,
        transport_charge: parseFloat(productData.transport_charge) || 0,
        material_cost: parseFloat(productData.material_cost) || 0,
        total_cost: totalCost
      };
      
      // Insert the product
      const { data: productResult, error: productError } = await supabase
        .from("catalog")
        .insert(productDbData)
        .select('id')
        .single();
      
      if (productError) {
        throw productError;
      }
      
      // Process components
      console.log('Raw custom components before filtering:', customComponents);
      
      const filteredCustomComponents = customComponents.filter(comp => {
        const hasData = comp.id || comp.customName || comp.color || comp.length || comp.width || comp.roll_width || comp.material_id || comp.consumption;
        console.log('Component validation:', {
          component: comp,
          hasData,
          reasons: {
            hasId: !!comp.id,
            hasCustomName: !!comp.customName,
            hasColor: !!comp.color,
            hasLength: !!comp.length,
            hasWidth: !!comp.width,
            hasRollWidth: !!comp.roll_width,
            hasMaterialId: !!comp.material_id,
            hasConsumption: !!comp.consumption
          }
        });
        return hasData;
      });
      
      console.log('Filtered custom components:', filteredCustomComponents);
      
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...filteredCustomComponents
      ];
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          catalog_id: productResult.id,
          component_type: comp.type === 'custom' ? comp.customName || 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: null, // Always set GSM to null as we don't need it
          roll_width: comp.roll_width || null,
          length: comp.length || null,
          width: comp.width || null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id || null,
          material_linked: comp.material_id ? true : false,
          consumption: comp.consumption || null,  // Save the calculated consumption
          formula: comp.formula || 'standard',  // Save the formula used for consumption calculation
          is_manual_consumption: comp.is_manual_consumption || false,
          updated_at: new Date().toISOString()
        }));
        
        // Insert components
        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          throw componentsError;
        }
      }
      
      // Show success toast
      toast({
        title: "Product created successfully",
        description: `${formattedName} has been added to the catalog`,
        variant: "default"
      });

      // Navigate to the newly created catalog detail page
      navigate(`/inventory/catalog/${productResult.id}`);
      
    } catch (error: any) {
      // Show error toast
      toast({
        title: "Error creating product",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      
      console.error("Product creation error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/inventory/catalog")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">Create a new catalog product template</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Enter the basic information for this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="name" 
                name="name"
                value={productData.name}
                onChange={handleProductChange}
                placeholder="Enter product name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Product name without quantity (e.g., "Test Bag"). Quantity will be automatically appended if provided below.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description"
                value={productData.description}
                onChange={handleProductChange}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bag_length">
                  Bag Length (inches) <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="bag_length" 
                  name="bag_length"
                  type="number"
                  step="0.01"
                  value={productData.bag_length}
                  onChange={handleProductChange}
                  placeholder="Length in inches"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bag_width">
                  Bag Width (inches) <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="bag_width" 
                  name="bag_width"
                  type="number"
                  step="0.01"
                  value={productData.bag_width}
                  onChange={handleProductChange}
                  placeholder="Width in inches"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="border_dimension">
                  Border Dimension / Height (inches)
                </Label>
                <Input 
                  id="border_dimension" 
                  name="border_dimension"
                  type="number"
                  step="0.01"
                  value={productData.border_dimension}
                  onChange={handleProductChange}
                  placeholder="Height/Border dimension in inches"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_quantity">Default Quantity</Label>
                <Input 
                  id="default_quantity" 
                  name="default_quantity"
                  type="number"
                  value={productData.default_quantity}
                  onChange={handleProductChange}
                  placeholder="Default order quantity"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Will be shown in product name as "Product Name*Quantity"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Bag Components Card */}
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
              <StandardComponents 
                components={components}
                componentOptions={componentOptions as any} // Type cast to fix TypeScript error
                onChange={handleComponentChange}
                defaultQuantity={productData.default_quantity}
                showConsumption={true}
              />
              
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
                
                <CustomComponentSection 
                  customComponents={customComponents}
                  componentOptions={componentOptions as any} // Type cast to fix TypeScript error
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                  defaultQuantity={productData.default_quantity}
                  showConsumption={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cost Calculation Card - New section for detailed costs */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Calculation</CardTitle>
            <CardDescription>Specify all costs associated with this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Material cost breakdown section */}
              {componentCosts.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-md border mb-4">
                  <h3 className="text-sm font-medium mb-2">Material Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                      <div>Component</div>
                      <div>Consumption (m)</div>
                      <div>Rate (₹/m)</div>
                      <div>Cost (₹)</div>
                    </div>
                    {componentCosts.map((item, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 text-sm">
                        <div>{item.name}</div>
                        <div>{item.consumption.toFixed(2)}</div>
                        <div>₹{item.rate.toFixed(2)}</div>
                        <div className="font-medium">₹{item.cost.toFixed(2)}</div>
                      </div>
                    ))}
                    <div className="border-t pt-2 grid grid-cols-4 gap-2 text-sm">
                      <div className="col-span-3 text-right font-medium">Total Material Cost:</div>
                      <div className="font-bold">₹{parseFloat(productData.material_cost).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cutting_charge">Cutting Charge</Label>
                  <Input 
                    id="cutting_charge" 
                    name="cutting_charge"
                    type="number"
                    step="0.01"
                    value={productData.cutting_charge}
                    onChange={handleProductChange}
                    placeholder="Cutting charge"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printing_charge">Printing Charge</Label>
                  <Input 
                    id="printing_charge" 
                    name="printing_charge"
                    type="number"
                    step="0.01"
                    value={productData.printing_charge}
                    onChange={handleProductChange}
                    placeholder="Printing charge"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stitching_charge">Stitching Charge</Label>
                  <Input 
                    id="stitching_charge" 
                    name="stitching_charge"
                    type="number"
                    step="0.01"
                    value={productData.stitching_charge}
                    onChange={handleProductChange}
                    placeholder="Stitching charge"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport_charge">Transport Charge</Label>
                  <Input 
                    id="transport_charge" 
                    name="transport_charge"
                    type="number"
                    step="0.01"
                    value={productData.transport_charge}
                    onChange={handleProductChange}
                    placeholder="Transport charge"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material_cost">Material Cost</Label>
                  <Input 
                    id="material_cost" 
                    name="material_cost"
                    type="number"
                    step="0.01"
                    value={productData.material_cost}
                    onChange={handleProductChange}
                    placeholder="Material cost"
                    min="0"
                    className="bg-slate-50 font-medium"
                    readOnly={componentCosts.length > 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    {componentCosts.length > 0 
                      ? "Auto-calculated from component materials and consumption"
                      : "Edit this value directly or link materials to components"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_cost">Total Cost</Label>
                  <Input 
                    id="total_cost" 
                    name="total_cost"
                    type="number"
                    step="0.01"
                    value={productData.total_cost}
                    readOnly
                    className="bg-muted font-medium"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated from all cost components
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="margin">Margin (%)</Label>
                    <Input 
                      id="margin" 
                      name="margin"
                      type="number"
                      step="0.01"
                      value={productData.margin}
                      onChange={handleProductChange}
                      placeholder="Profit margin percentage"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Margin is calculated as ((Selling Rate - Total Cost) / Total Cost) × 100
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory/catalog")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogNew;
