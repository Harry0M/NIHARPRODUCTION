
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponent, CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Product details state
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    default_quantity: "1", // Default to 1
    default_rate: "",
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0"
  });
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, any>>({});
  
  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  // Materials data
  const { data: materials } = useQuery({
    queryKey: ['inventory-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate total material cost
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
  useEffect(() => {
    if (materials) {
      calculateMaterialCost();
    }
  }, [components, customComponents, materials]);

  useEffect(() => {
    // Calculate total cost whenever any cost component changes
    const cutting = parseFloat(productDetails.cutting_charge) || 0;
    const printing = parseFloat(productDetails.printing_charge) || 0;
    const stitching = parseFloat(productDetails.stitching_charge) || 0;
    const transport = parseFloat(productDetails.transport_charge) || 0;
    
    setTotalCost(materialCost + cutting + printing + stitching + transport);
  }, [materialCost, productDetails.cutting_charge, productDetails.printing_charge, 
      productDetails.stitching_charge, productDetails.transport_charge]);
  
  const calculateMaterialCost = () => {
    if (!materials || materials.length === 0) return;
    
    let cost = 0;
    
    // Calculate cost for standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(comp.consumption) * parseFloat(material.purchase_price);
        }
      }
    });
    
    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(comp.consumption) * parseFloat(material.purchase_price);
        }
      }
    });
    
    setMaterialCost(cost);
  };
  
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
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
        const rollWidth = parseFloat(updatedComponent.roll_width);
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          // Convert result to string since the component expects a string value
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4).toString();
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
        const length = parseFloat(component.length);
        const width = parseFloat(component.width);
        const rollWidth = parseFloat(component.roll_width);
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          // Convert result to string since the component expects a string value
          component.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4).toString();
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
        customName: "" 
      }
    ]);
  };
  
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  // Server-side validation function
  const validateProductData = () => {
    const errors: string[] = [];
    
    // Required product details
    if (!productDetails.name.trim()) {
      errors.push("Product name is required");
    }
    
    if (!productDetails.bag_length) {
      errors.push("Bag length is required");
    } else if (isNaN(parseFloat(productDetails.bag_length)) || parseFloat(productDetails.bag_length) <= 0) {
      errors.push("Bag length must be a positive number");
    }
    
    if (!productDetails.bag_width) {
      errors.push("Bag width is required");
    } else if (isNaN(parseFloat(productDetails.bag_width)) || parseFloat(productDetails.bag_width) <= 0) {
      errors.push("Bag width must be a positive number");
    }
    
    // Validate numeric fields
    if (productDetails.default_quantity && (isNaN(parseInt(productDetails.default_quantity)) || parseInt(productDetails.default_quantity) < 1)) {
      errors.push("Default quantity must be a positive integer");
    }
    
    if (productDetails.default_rate && (isNaN(parseFloat(productDetails.default_rate)) || parseFloat(productDetails.default_rate) < 0)) {
      errors.push("Default rate must be a non-negative number");
    }
    
    // Validate components
    const allComponents = [
      ...Object.values(components).filter(Boolean),
      ...customComponents
    ].filter(Boolean);
    
    // Check for custom components without names
    customComponents.forEach((comp, index) => {
      if (!comp.customName || comp.customName.trim() === '') {
        errors.push(`Custom component #${index + 1} requires a name`);
      }
    });
    
    // Check for components with invalid measurements
    allComponents.forEach(comp => {
      const componentName = comp.type === 'custom' ? comp.customName || 'Custom component' : comp.type;
      
      if (comp.length && (isNaN(parseFloat(comp.length)) || parseFloat(comp.length) <= 0)) {
        errors.push(`${componentName}: Length must be a positive number`);
      }
      
      if (comp.width && (isNaN(parseFloat(comp.width)) || parseFloat(comp.width) <= 0)) {
        errors.push(`${componentName}: Width must be a positive number`);
      }
      
      if (comp.roll_width && (isNaN(parseFloat(comp.roll_width)) || parseFloat(comp.roll_width) <= 0)) {
        errors.push(`${componentName}: Roll width must be a positive number`);
      }
    });
    
    return errors;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Perform server-side validation
    const errors = validateProductData();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      // Display validation errors
      toast({
        title: "Validation errors",
        description: (
          <ul className="list-disc pl-4 mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      // Insert product into catalog table
      const { data: catalogData, error: catalogError } = await supabase
        .from("catalog")
        .insert({
          name: productDetails.name,
          description: productDetails.description,
          bag_length: parseFloat(productDetails.bag_length),
          bag_width: parseFloat(productDetails.bag_width),
          default_quantity: productDetails.default_quantity ? parseInt(productDetails.default_quantity) : 1,
          default_rate: productDetails.default_rate ? parseFloat(productDetails.default_rate) : null,
          cutting_charge: productDetails.cutting_charge ? parseFloat(productDetails.cutting_charge) : 0,
          printing_charge: productDetails.printing_charge ? parseFloat(productDetails.printing_charge) : 0,
          stitching_charge: productDetails.stitching_charge ? parseFloat(productDetails.stitching_charge) : 0,
          transport_charge: productDetails.transport_charge ? parseFloat(productDetails.transport_charge) : 0,
          total_cost: totalCost > 0 ? totalCost : null,
          created_by: userData.user?.id
        })
        .select('id')
        .single();
      
      if (catalogError) {
        if (catalogError.code === '23505') { // Unique constraint violation
          toast({
            title: "Product already exists",
            description: "A product with this name already exists. Please choose a different name.",
            variant: "destructive"
          });
          setSubmitting(false);
          return;
        }
        throw catalogError;
      }
      
      // Prepare component data for insertion
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          catalog_id: catalogData.id,
          component_type: comp.type === 'custom' ? comp.customName : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          length: comp.length ? parseFloat(comp.length) : null,
          width: comp.width ? parseFloat(comp.width) : null,
          color: comp.color || null,
          gsm: comp.gsm ? parseFloat(comp.gsm) : null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id && comp.material_id !== 'not_applicable' ? comp.material_id : null,
          roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
          consumption: comp.consumption ? parseFloat(comp.consumption) : null
        }));

        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Error saving components",
            description: componentsError.message,
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Product created successfully",
        description: `Product "${productDetails.name}" has been added to catalog`
      });
      
      // Navigate to the catalog list
      navigate("/inventory/catalog");
      
    } catch (error: any) {
      console.error("Error creating product:", error);
      
      // Handle specific server-side validation errors from Supabase
      if (error.code === '23514') { // Check constraint violation
        toast({
          title: "Validation error",
          description: "One or more values failed server-side validation. Please check your input and try again.",
          variant: "destructive"
        });
      } else if (error.code === '23502') { // Not null violation
        toast({
          title: "Missing required field",
          description: "A required field is missing. Please check your input and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error creating product",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Used materials list
  const usedMaterials = () => {
    if (!materials) return [];
    
    const materialUsage: Record<string, {
      id: string,
      name: string,
      quantity: number,
      unit: string,
      cost: number
    }> = {};
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: parseFloat(comp.consumption),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(comp.consumption);
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0;
          }
        }
      }
    });
    
    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: parseFloat(comp.consumption),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(comp.consumption);
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0;
          }
        }
      }
    });
    
    return Object.values(materialUsage);
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
            <h1 className="text-3xl font-bold tracking-tight">New Product (BOM)</h1>
            <p className="text-muted-foreground">Add a new product to your catalog with bill of materials</p>
          </div>
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <Card className="bg-destructive/10 border-destructive">
          <div className="p-4">
            <h2 className="font-semibold text-destructive">Please fix the following errors:</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Enter the basic information for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter product name"
                  value={productDetails.name}
                  onChange={handleProductChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter product description"
                  value={productDetails.description}
                  onChange={handleProductChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bag_length">Bag Length (inches) *</Label>
                  <Input
                    id="bag_length"
                    name="bag_length"
                    type="number"
                    step="0.01"
                    placeholder="Enter length"
                    value={productDetails.bag_length}
                    onChange={handleProductChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="bag_width">Bag Width (inches) *</Label>
                  <Input
                    id="bag_width"
                    name="bag_width"
                    type="number"
                    step="0.01"
                    placeholder="Enter width"
                    value={productDetails.bag_width}
                    onChange={handleProductChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="default_quantity">Default Quantity</Label>
                  <Input
                    id="default_quantity"
                    name="default_quantity"
                    type="number"
                    placeholder="Enter default quantity"
                    value={productDetails.default_quantity}
                    onChange={handleProductChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="default_rate">Default Rate (₹)</Label>
                  <Input
                    id="default_rate"
                    name="default_rate"
                    type="number"
                    step="0.01"
                    placeholder="Enter default rate"
                    value={productDetails.default_rate}
                    onChange={handleProductChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Bag Components</CardTitle>
            <CardDescription>Specify the details for each component of the bag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Standard Components</h2>
                <div className="divide-y divide-border">
                  <ComponentForm
                    title="Part"
                    component={components.part || { type: "part", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" }}
                    index={0}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("part", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Border"
                    component={components.border || { type: "border", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" }}
                    index={1}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("border", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Handle"
                    component={components.handle || { type: "handle", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" }}
                    index={2}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("handle", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Chain"
                    component={components.chain || { type: "chain", width: "", length: "", color: "", material_id: "" }}
                    index={3}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("chain", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Runner"
                    component={components.runner || { type: "runner", width: "", length: "", color: "", material_id: "" }}
                    index={4}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("runner", field, value)}
                    handleChange={() => {}}
                  />
                </div>
              </div>
              
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
                    <Plus size={16} />
                    Add Custom Component
                  </Button>
                </div>
                
                <CustomComponentSection
                  customComponents={customComponents}
                  componentOptions={componentOptions}
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Calculation</CardTitle>
            <CardDescription>Detailed breakdown of product costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Materials used breakdown */}
              <div>
                <h3 className="font-medium mb-3">Materials Used</h3>
                {usedMaterials().length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Material</th>
                          <th className="px-4 py-2 text-left font-medium">Quantity</th>
                          <th className="px-4 py-2 text-right font-medium">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usedMaterials().map((material, index) => (
                          <tr key={material.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                            <td className="px-4 py-2">{material.name}</td>
                            <td className="px-4 py-2">{material.quantity.toFixed(2)} {material.unit}</td>
                            <td className="px-4 py-2 text-right">
                              ₹{material.cost.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t">
                          <td className="px-4 py-2 font-medium" colSpan={2}>Total Material Cost:</td>
                          <td className="px-4 py-2 text-right font-medium">₹{materialCost.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic text-center py-4 border rounded-md">
                    No materials selected for this product
                  </div>
                )}
              </div>

              {/* Additional charges */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Additional Charges</h3>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="cutting_charge">Cutting Charge (₹)</Label>
                      <Input
                        id="cutting_charge"
                        name="cutting_charge"
                        type="number"
                        step="0.01"
                        value={productDetails.cutting_charge}
                        onChange={handleProductChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="printing_charge">Printing Charge (₹)</Label>
                      <Input
                        id="printing_charge"
                        name="printing_charge"
                        type="number"
                        step="0.01"
                        value={productDetails.printing_charge}
                        onChange={handleProductChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stitching_charge">Stitching Charge (₹)</Label>
                      <Input
                        id="stitching_charge"
                        name="stitching_charge"
                        type="number"
                        step="0.01"
                        value={productDetails.stitching_charge}
                        onChange={handleProductChange}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transport_charge">Transport Charge (₹)</Label>
                      <Input
                        id="transport_charge"
                        name="transport_charge"
                        type="number"
                        step="0.01"
                        value={productDetails.transport_charge}
                        onChange={handleProductChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Total cost summary */}
                <div className="space-y-4">
                  <h3 className="font-medium">Cost Summary</h3>
                  <div className="border rounded-md p-4 bg-muted/20 space-y-3">
                    <div className="flex justify-between">
                      <span>Material Cost:</span>
                      <span className="font-medium">₹{materialCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cutting Charge:</span>
                      <span>₹{parseFloat(productDetails.cutting_charge || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Printing Charge:</span>
                      <span>₹{parseFloat(productDetails.printing_charge || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stitching Charge:</span>
                      <span>₹{parseFloat(productDetails.stitching_charge || '0').toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Charge:</span>
                      <span>₹{parseFloat(productDetails.transport_charge || '0').toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>TOTAL PRODUCT COST:</span>
                      <span>₹{totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory/catalog")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Product (BOM)"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogNew;
