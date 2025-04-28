
import * as React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Order Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order #{id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Order details will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
