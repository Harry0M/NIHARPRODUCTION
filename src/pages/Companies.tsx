
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Companies() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Companies</h1>
      <Card>
        <CardHeader>
          <CardTitle>Companies List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No companies found.</p>
        </CardContent>
      </Card>
    </div>
  );
}
