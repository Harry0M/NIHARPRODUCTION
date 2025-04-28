
import * as React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DispatchDetails() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dispatch Details</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dispatch #{id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Dispatch details will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
