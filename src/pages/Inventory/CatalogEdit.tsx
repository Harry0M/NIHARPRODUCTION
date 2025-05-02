
import { useParams, useNavigate } from "react-router-dom";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { v4 as uuidv4 } from "uuid";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  roll_width?: string;
}

const CatalogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const { data: products, isLoading } = useCatalogProducts();
  const product = products?.find((p) => p.id === id);
  
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    border_dimension: "",
    default_quantity: "",
    default_rate: ""
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<ComponentType[]>([]);
  const [existingComponents, setExistingComponents] = useState<any[]>([]);
  const [deletedComponentIds, setDeletedComponentIds] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setProductData({
        name: product.name,
        description: product.description || "",
        bag_length: product.bag_length.toString(),
        bag_width: product.bag_width.toString(),
        border_dimension: product.border_dimension ? product.border_dimension.toString() : "",
        default_quantity: product.default_quantity ? product.default_quantity.toString() : "",
        default_rate: product.default_rate ? product.default_rate.toString() : ""
      });

      // Process components from product
      const standardComponentTypes = ['part', 'border', 'handle', 'chain', 'runner'];
      const productComponents = product.catalog_components || [];
      
      // Standard components
      const standardComps: Record<string, any> = {};
      const customComps: ComponentType[] = [];
      
      productComponents.forEach(comp => {
        if (standardComponentTypes.includes(comp.component_type)) {
          standardComps[comp.component_type] = {
            id: comp.id,
            type: comp.component_type,
            color: comp.color || undefined,
            gsm: comp.gsm || undefined,
            length: comp.length?.toString() || undefined,
            width: comp.width?.toString() || undefined,
            roll_width: comp.roll_width?.toString() || undefined,
          };
        } else {
          // Custom components
          customComps.push({
            id: comp.id,
            type: 'custom',
            customName: comp.custom_name || comp.component_type,
            color: comp.color || undefined,
            gsm: comp.gsm || undefined,
            length: comp.length?.toString() || undefined,
            width: comp.width?.toString() || undefined,
            roll_width: comp.roll_width?.toString() || undefined,
          });
        }
      });
      
      setComponents(standardComps);
      setCustomComponents(customComps);
      setExistingComponents(productComponents);
    }
  }, [product]);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: existingComponents.find(c => c.component_type === type)?.id || uuidv4(),
        type 
      };
      return {
        ...prev,
        [type]: {
          ...component,
          [field]: value
        }
      };
    });
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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
    const componentToRemove = customComponents[index];
    
    // If it's an existing component (has an ID that's in the existing components), 
    // add it to the deleted list
    if (componentToRemove.id && existingComponents.some(c => c.id === componentToRemove.id)) {
      setDeletedComponentIds(prev => [...prev, componentToRemove.id]);
    }
    
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare product data
      const productDbData = {
        name: productData.name,
        description: productData.description || null,
        bag_length: parseFloat(productData.bag_length),
        bag_width: parseFloat(productData.bag_width),
        border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : null,
        default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
        default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
        updated_at: new Date().toISOString()
      };
      
      // Update the product
      const { error: productError } = await supabase
        .from("catalog")
        .update(productDbData)
        .eq("id", id);
      
      if (productError) {
        throw productError;
      }
      
      // Delete components that were removed
      if (deletedComponentIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("catalog_components")
          .delete()
          .in("id", deletedComponentIds);
          
        if (deleteError) {
          throw deleteError;
        }
      }
      
      // Process components
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents.filter(comp => comp.customName || comp.color || comp.gsm || comp.length || comp.width || comp.roll_width)
      ];
      
      // Update or insert components
      for (const comp of allComponents) {
        const isExisting = existingComponents.some(ec => ec.id === comp.id);
        
        const componentData = {
          catalog_id: id,
          component_type: comp.type === 'custom' ? 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          roll_width: comp.roll_width || null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          length: comp.length ? parseFloat(comp.length) : null,
          width: comp.width ? parseFloat(comp.width) : null,
          updated_at: new Date().toISOString()
        };
        
        if (isExisting) {
          // Update existing component
          const { error } = await supabase
            .from("catalog_components")
            .update(componentData)
            .eq("id", comp.id);
            
          if (error) throw error;
        } else {
          // Insert new component
          const { error } = await supabase
            .from("catalog_components")
            .insert({
              ...componentData,
              id: comp.id
            });
            
          if (error) throw error;
        }
      }
      
      toast({
        title: "Product updated successfully",
        description: `${productData.name} has been updated in the catalog`
      });

      navigate(`/inventory/catalog/${id}`);
      
    } catch (error: any) {
      toast({
        title: "Error updating product",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("Error updating product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-2xl font-semibold text-muted-foreground">Product not found</div>
        <Button onClick={() => navigate("/inventory/catalog")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/inventory/catalog/${id}`)}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">Update this catalog product</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Update the basic information for this product</CardDescription>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rate">Default Rate</Label>
                <Input 
                  id="default_rate" 
                  name="default_rate"
                  type="number"
                  step="0.01"
                  value={productData.default_rate}
                  onChange={handleProductChange}
                  placeholder="Default price per bag"
                  min="0"
                />
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
              <StandardComponents 
                components={components}
                componentOptions={componentOptions}
                onChange={handleComponentChange}
                defaultQuantity={productData.default_quantity}
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
                  componentOptions={componentOptions}
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                  defaultQuantity={productData.default_quantity}
                />
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/inventory/catalog/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1">
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Product</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CatalogEdit;
