
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewJobCard() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create New Job Card</h1>
      <Card>
        <CardHeader>
          <CardTitle>Job Card Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Job card creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
