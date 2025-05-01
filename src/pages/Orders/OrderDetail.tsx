
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { OrderFormData, OrderStatus } from "@/types/order";
import { ComponentForm } from "@/components/orders/ComponentForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface Component {
  id: string;
  component_type: string;
  type: string;
  color?: string;
  gsm?: string;
  size?: string;
  custom_name?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
  order_id: string;
  created_at: string;
  updated_at: string;
  details?: string;
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: '', // Add required property
    order_number: '',
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    product_name: '',
    quantity: '',
    rate: '',
    order_date: '',
    delivery_date: '',
    delivery_address: '',
    special_instructions: '',
    status: 'pending',
    bag_length: '',
    bag_width: ''
  });
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const componentOptions = {
    color: ['Red', 'Green', 'Blue', 'Yellow', 'Black', 'White'],
    gsm: ['80', '120', '150', '200']
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            components (*)
          `)
          .eq('id', id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setOrderData(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const processComponents = (orderComponents: any[]): Component[] => {
    if (!orderComponents || orderComponents.length === 0) {
      return [];
    }

    return orderComponents.map(component => ({
      id: component.id,
      component_type: component.component_type,
      type: component.component_type,
      color: component.color || '',
      gsm: component.gsm?.toString() || '',
      size: component.size || '',
      custom_name: component.custom_name || '',
      material_id: component.material_id || '',
      roll_width: component.roll_width?.toString() || '',
      consumption: component.consumption?.toString() || '',
      order_id: component.order_id,
      created_at: component.created_at,
      updated_at: component.updated_at,
      details: component.details || ''
    }));
  };

  useEffect(() => {
    if (orderData) {
      setOrderDetails({
        company_name: orderData.company_name || '', // Add required field
        order_number: orderData.order_number || '',
        customer_name: orderData.customer_name || '',
        customer_phone: orderData.customer_phone || '',
        customer_address: orderData.customer_address || '',
        product_name: orderData.product_name || '',
        quantity: orderData.quantity?.toString() || '',
        rate: orderData.rate?.toString() || '',
        order_date: orderData.order_date || '',
        delivery_date: orderData.delivery_date || '',
        delivery_address: orderData.delivery_address || '',
        special_instructions: orderData.special_instructions || '',
        status: orderData.status || 'pending',
        bag_length: orderData.bag_length?.toString() || '',
        bag_width: orderData.bag_width?.toString() || ''
      });
      setComponents(processComponents(orderData.components || []));
    }
  }, [orderData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (status: string) => {
    setOrderDetails(prev => ({ ...prev, status: status as OrderStatus }));
  };

  const handleComponentChange = (index: number, field: string, value: string) => {
    const updatedComponents = [...components];
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: value
    } as Component;
    setComponents(updatedComponents);
  };

  const saveOrder = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const orderPayload = {
        ...orderDetails,
        quantity: parseInt(orderDetails.quantity as string),
        rate: parseFloat(orderDetails.rate as string),
        bag_length: parseFloat(orderDetails.bag_length as string),
        bag_width: parseFloat(orderDetails.bag_width as string),
        // Convert status to proper format for database
        status: orderDetails.status
      };

      // Type assertion to bypass TypeScript constraints for the database operation
      const { error: updateError } = await supabase
        .from("orders")
        .update(orderPayload as any)
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const componentsPayload = components.map(component => ({
        ...component,
        order_id: id,
        type: component.component_type as "part" | "border" | "handle" | "chain" | "runner" | "custom"
      }));

      const { error: deleteError } = await supabase
        .from("components")
        .delete()
        .eq('order_id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      for (const component of componentsPayload) {
        const { error: insertError } = await supabase
          .from("components")
          .insert({
            order_id: component.order_id,
            type: component.type,
            color: component.color,
            gsm: component.gsm,
            size: component.size,
            details: component.details
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      toast({
        title: "Order updated successfully",
        description: "The order details have been updated."
      });
      navigate('/orders');

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Failed to update order",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading order details...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/orders")}
        className="mb-4 gap-1"
      >
        <ArrowLeft size={16} />
        Back to Orders
      </Button>
      <Card className="bg-white shadow-md rounded-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Order Details</CardTitle>
          <CardDescription>View and modify order information</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="order_number">Order Number</Label>
              <Input
                type="text"
                id="order_number"
                name="order_number"
                value={orderDetails.order_number}
                onChange={handleInputChange}
                placeholder="Enter order number"
              />
            </div>
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                type="text"
                id="customer_name"
                name="customer_name"
                value={orderDetails.customer_name}
                onChange={handleInputChange}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">Customer Phone</Label>
              <Input
                type="tel"
                id="customer_phone"
                name="customer_phone"
                value={orderDetails.customer_phone}
                onChange={handleInputChange}
                placeholder="Enter customer phone"
              />
            </div>
            <div>
              <Label htmlFor="customer_address">Customer Address</Label>
              <Input
                type="text"
                id="customer_address"
                name="customer_address"
                value={orderDetails.customer_address}
                onChange={handleInputChange}
                placeholder="Enter customer address"
              />
            </div>
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                type="text"
                id="product_name"
                name="product_name"
                value={orderDetails.product_name}
                onChange={handleInputChange}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                id="quantity"
                name="quantity"
                value={orderDetails.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <Label htmlFor="rate">Rate</Label>
              <Input
                type="number"
                id="rate"
                name="rate"
                value={orderDetails.rate}
                onChange={handleInputChange}
                placeholder="Enter rate"
              />
            </div>
            <div>
              <Label htmlFor="order_date">Order Date</Label>
              <Input
                type="date"
                id="order_date"
                name="order_date"
                value={orderDetails.order_date}
                onChange={handleInputChange}
                placeholder="Select order date"
              />
            </div>
            <div>
              <Label htmlFor="delivery_date">Delivery Date</Label>
              <Input
                type="date"
                id="delivery_date"
                name="delivery_date"
                value={orderDetails.delivery_date}
                onChange={handleInputChange}
                placeholder="Select delivery date"
              />
            </div>
            <div>
              <Label htmlFor="delivery_address">Delivery Address</Label>
              <Input
                type="text"
                id="delivery_address"
                name="delivery_address"
                value={orderDetails.delivery_address}
                onChange={handleInputChange}
                placeholder="Enter delivery address"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Input
                id="special_instructions"
                name="special_instructions"
                value={orderDetails.special_instructions}
                onChange={handleInputChange}
                placeholder="Enter special instructions"
              />
            </div>
          </div>

          <Separator className="my-6" />

          <h4 className="text-lg font-semibold mb-4">Components</h4>
          {components.map((component, index) => (
            <ComponentForm
              key={component.id}
              component={component}
              index={index}
              componentOptions={componentOptions}
              handleChange={handleComponentChange}
            />
          ))}

          <Separator className="my-6" />

          <div className="grid md:grid-cols-1 gap-6">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={orderDetails.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end p-6">
          <Button onClick={saveOrder} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">
                  <CheckCircle size={16} />
                </span>
                Updating...
              </>
            ) : (
              "Update Order"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderDetail;
