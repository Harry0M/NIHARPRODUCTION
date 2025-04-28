
import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function JobCards() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Job Cards</h1>
        <Link to="/production/job-cards/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Job Card
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Job Cards List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No job cards found.</p>
        </CardContent>
      </Card>
    </div>
  );
}
