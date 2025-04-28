
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductionStitching() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Stitching Production</h1>
      <Card>
        <CardHeader>
          <CardTitle>Stitching Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No stitching jobs found.</p>
        </CardContent>
      </Card>
    </div>
  );
}
