import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OrderFormData, Component, CustomComponent, OrderStatus, ComponentProps, ComponentType, DBOrderStatus } from "@/types/order";
import { ComponentForm } from "@/components/orders/ComponentForm";

const OrderNew = () => {
  const navigate = useNavigate();
  const { id, catalogId } = useParams<{ id?: string; catalogId?: string }>();
  const isEditMode = !!id;
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: '', // Required property
    catalog_id: catalogId || '',
    quantity: '',
    rate: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    bag_length: '',
    bag_width: '',
    description: '',
  });
  const [components, setComponents] = useState<ComponentProps[]>([]);
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  const [componentOptions, setComponentOptions] = useState({
    color: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'],
    gsm: ['80', '100', '120', '150'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch order data if in edit mode
  const { data: orderData } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          components (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditMode,
  });

  // Fetch catalog product details if a catalogId is provided
  const { data: catalogProduct } = useQuery({
    queryKey: ['catalog-product', catalogId],
    queryFn: async () => {
      if (!catalogId) return null;

      const { data, error } = await supabase
        .from('catalog')
        .select(`
          *,
          catalog_components(*)
        `)
        .eq('id', catalogId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!catalogId,
  });

  // Auto-fill order details and components from catalog product
  useEffect(() => {
    if (catalogProduct && catalogProduct.catalog_components) {
      // Auto-fill the bag dimensions and rate
      setOrderDetails(prev => ({
        ...prev,
        bag_length: catalogProduct.bag_length?.toString() || prev.bag_length,
        bag_width: catalogProduct.bag_width?.toString() || prev.bag_width,
        rate: catalogProduct.default_rate?.toString() || prev.rate,
      }));

      // Process catalog components
      const newComponents: ComponentProps[] = [];
      const newCustomComponents: CustomComponent[] = [];

      catalogProduct.catalog_components.forEach(component => {
        if (!component) return;

        const baseComponent = {
          id: crypto.randomUUID(),
          type: component.component_type as ComponentType,
          component_type: component.component_type,
          color: component.color || '',
          gsm: component.gsm?.toString() || '',
          length: component.length?.toString() || '',
          width: component.width?.toString() || '',
          material_id: component.material_id || '',
          roll_width: component.roll_width?.toString() || '',
          consumption: component.consumption?.toString() || ''
        };

        if (component.component_type === 'custom') {
          newCustomComponents.push({
            ...baseComponent,
            type: 'custom',
            custom_name: component.custom_name || 'custom',
          });
        } else {
          newComponents.push(baseComponent);
        }
      });

      setComponents(newComponents);
      setCustomComponents(newCustomComponents);
    }
  }, [catalogProduct]);

  // Helper function to map frontend status to DB status
  const mapStatusToDb = (status: OrderStatus): DBOrderStatus => {
    if (status === 'processing') return 'in_production';
    return status as DBOrderStatus;
  };

  // Populate form with existing data when in edit mode
  useEffect(() => {
    if (orderData) {
      // Extended interface to include the fields we need from the database
      interface ExtendedOrderData extends Record<string, any> {
        company_name: string;
        catalog_id?: string;
        quantity: number;
        rate?: number;
        order_date: string;
        delivery_date?: string;
        customer_name?: string;
        customer_phone?: string;
        customer_address?: string;
        bag_length: number;
        bag_width: number;
        description?: string;
        components?: any[];
      }

      // Cast the orderData to our extended interface to access all fields
      const extendedData = orderData as ExtendedOrderData;

      setOrderDetails({
        company_name: extendedData.company_name || '',
        catalog_id: extendedData.catalog_id || '',
        quantity: extendedData.quantity?.toString() || '',
        rate: extendedData.rate?.toString() || '',
        order_date: extendedData.order_date ? extendedData.order_date.split('T')[0] : '',
        delivery_date: extendedData.delivery_date || '',
        customer_name: extendedData.customer_name || '',
        customer_phone: extendedData.customer_phone || '',
        customer_address: extendedData.customer_address || '',
        bag_length: extendedData.bag_length?.toString() || '',
        bag_width: extendedData.bag_width?.toString() || '',
        description: extendedData.description || '',
      });
      
      // Filter and set custom components
      if (extendedData.components) {
        const customComps = extendedData.components.filter(
          (comp: any) => comp.custom_name || comp.component_type === 'custom'
        );
        setCustomComponents(convertToCustomComponents(customComps));

        // Set standard components
        const standardComps = extendedData.components.filter(
          (comp: any) => !comp.custom_name && comp.component_type !== 'custom'
        );
        const mappedComps = standardComps.map((comp: any) => ({
          ...comp,
          type: (comp.type || comp.component_type) as ComponentType,
        }));
        setComponents(mappedComps as ComponentProps[]);
      }
    }
  }, [orderData]);

  // Fix the custom components type conversion
  const convertToCustomComponents = (components: any[]): CustomComponent[] => {
    return components.map(comp => {
      // Ensure the type is a valid ComponentType
      const compType = (comp.type || comp.component_type || 'custom') as ComponentType;
      
      return {
        id: comp.id || crypto.randomUUID(),
        type: compType,
        component_type: comp.component_type || 'custom',
        color: comp.color || '',
        gsm: comp.gsm || '',
        custom_name: comp.custom_name || '',
        length: comp.length || '',
        width: comp.width || '',
        material_id: comp.material_id || '',
        roll_width: comp.roll_width || '',
        consumption: comp.consumption || '',
        details: comp.details || ''
      };
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleComponentChange = (index: number, field: string, value: string) => {
    const updatedComponents = [...components];
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: value,
    };
    setComponents(updatedComponents);
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    const updatedCustomComponents = [...customComponents];
    updatedCustomComponents[index] = {
      ...updatedCustomComponents[index],
      [field]: value,
    };
    setCustomComponents(updatedCustomComponents);
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
    const updatedCustomComponents = [...customComponents];
    updatedCustomComponents.splice(index, 1);
    setCustomComponents(updatedCustomComponents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Convert string values to proper types for database insertion
      // Map frontend status to database status if needed
      const dbStatus: DBOrderStatus = orderDetails.status 
        ? mapStatusToDb(orderDetails.status as OrderStatus) 
        : 'pending';

      const orderPayload = {
        company_name: orderDetails.company_name,
        quantity: Number(orderDetails.quantity),
        rate: Number(orderDetails.rate),
        bag_length: Number(orderDetails.bag_length),
        bag_width: Number(orderDetails.bag_width),
        user_id: userData.user?.id,
        status: dbStatus
      };

      let orderId = id;

      if (isEditMode) {
        // Update existing order
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            company_name: orderDetails.company_name,
            quantity: Number(orderDetails.quantity),
            rate: Number(orderDetails.rate),
            bag_length: Number(orderDetails.bag_length),
            bag_width: Number(orderDetails.bag_width),
            status: dbStatus,
            order_date: orderDetails.order_date,
            delivery_date: orderDetails.delivery_date,
            customer_name: orderDetails.customer_name,
            customer_phone: orderDetails.customer_phone,
            customer_address: orderDetails.customer_address,
            description: orderDetails.description
          })
          .eq('id', id);

        if (orderError) throw orderError;

        // Delete existing components
        const { error: deleteComponentsError } = await supabase
          .from("components")
          .delete()
          .eq('order_id', id);

        if (deleteComponentsError) throw deleteComponentsError;
      } else {
        // Insert new order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            company_name: orderDetails.company_name,
            quantity: Number(orderDetails.quantity),
            rate: Number(orderDetails.rate),
            bag_length: Number(orderDetails.bag_length),
            bag_width: Number(orderDetails.bag_width),
            status: dbStatus,
            order_date: orderDetails.order_date,
            delivery_date: orderDetails.delivery_date,
            customer_name: orderDetails.customer_name,
            customer_phone: orderDetails.customer_phone,
            customer_address: orderDetails.customer_address,
            description: orderDetails.description
          })
          .select('id')
          .single();

        if (orderError) throw orderError;
        orderId = orderData.id;
      }

      // Prepare components for insertion
      const allComponents = [...components, ...customComponents];
      
      // Insert components one by one to ensure proper type handling
      for (const comp of allComponents) {
        const { error: componentError } = await supabase
          .from("components")
          .insert({
            order_id: orderId,
            component_type: comp.component_type,
            type: comp.type,
            color: comp.color || null,
            gsm: comp.gsm || null,
            size: comp.size || (comp.length && comp.width ? `${comp.length}x${comp.width}` : null),
            custom_name: comp.custom_name || null,
            details: comp.details || null
          });

        if (componentError) {
          console.error("Error saving component:", componentError);
          toast({
            title: "Error saving component",
            description: componentError.message,
            variant: "destructive"
          });
        }
      }

      toast({
        title: isEditMode ? "Order updated successfully" : "Order created successfully",
        description: `Order has been ${isEditMode ? 'updated' : 'created'} successfully.`
      });

      navigate("/orders");
    } catch (error: any) {
      console.error(isEditMode ? "Error updating order:" : "Error creating order:", error);
      toast({
        title: isEditMode ? "Error updating order" : "Error creating order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Order' : 'New Order'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Modify existing order details' : 'Create a new order'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Enter the order details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="catalog_id">Catalog ID</Label>
                <Input
                  id="catalog_id"
                  name="catalog_id"
                  value={orderDetails.catalog_id}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={orderDetails.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Rate</Label>
                <Input
                  type="number"
                  id="rate"
                  name="rate"
                  value={orderDetails.rate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  type="date"
                  id="order_date"
                  name="order_date"
                  value={orderDetails.order_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  type="date"
                  id="delivery_date"
                  name="delivery_date"
                  value={orderDetails.delivery_date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={orderDetails.customer_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_phone">Customer Phone</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  value={orderDetails.customer_phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_address">Customer Address</Label>
                <Input
                  id="customer_address"
                  name="customer_address"
                  value={orderDetails.customer_address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bag_length">Bag Length</Label>
                <Input
                  type="number"
                  id="bag_length"
                  name="bag_length"
                  value={orderDetails.bag_length}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bag_width">Bag Width</Label>
                <Input
                  type="number"
                  id="bag_width"
                  name="bag_width"
                  value={orderDetails.bag_width}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={orderDetails.description}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>Define the bag components (part, border, handle, etc.)</CardDescription>
          </CardHeader>
          <CardContent>
            {components.map((component, index) => (
              <ComponentForm
                key={component.id}
                component={component}
                index={index}
                componentOptions={componentOptions}
                handleChange={handleComponentChange}
              />
            ))}

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Custom Components</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCustomComponent}>
                  <Plus size={16} className="mr-2" />
                  Add Component
                </Button>
              </div>

              {customComponents.length > 0 ? (
                <div className="space-y-6">
                  {customComponents.map((comp, index) => (
                    <ComponentForm
                      key={comp.id}
                      component={comp}
                      index={index}
                      isCustom={true}
                      componentOptions={componentOptions}
                      handleChange={handleCustomComponentChange}
                      onRemove={() => removeCustomComponent(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No custom components added yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/orders")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Order" : "Create Order")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default OrderNew;
