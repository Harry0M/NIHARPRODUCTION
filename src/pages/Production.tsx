
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Production() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Production</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/production/job-cards">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle>Job Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage production job cards</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/production/cutting">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle>Cutting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage cutting production</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/production/printing">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle>Printing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage printing production</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/production/stitching">
          <Card className="h-full hover:bg-accent/5 transition-colors">
            <CardHeader>
              <CardTitle>Stitching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Manage stitching production</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
