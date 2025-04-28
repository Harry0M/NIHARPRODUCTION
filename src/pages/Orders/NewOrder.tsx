
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderForm } from "@/components/orders/OrderForm";
import { toast } from "@/hooks/use-toast";

export default function NewOrder() {
  const handleSubmit = async (data: any) => {
    try {
      // Submit logic will be implemented later
      toast({
        title: "Order created",
        description: "The order has been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the order.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Order</CardTitle>
          <CardDescription>
            Enter the order details including specifications for all components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
