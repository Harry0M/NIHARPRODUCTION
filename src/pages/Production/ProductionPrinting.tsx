
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductionPrinting() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Printing Production</h1>
      <Card>
        <CardHeader>
          <CardTitle>Printing Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No printing jobs found.</p>
        </CardContent>
      </Card>
    </div>
  );
}
