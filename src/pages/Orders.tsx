
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function Orders() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Link to="/orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No orders found. Create a new order to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
}
