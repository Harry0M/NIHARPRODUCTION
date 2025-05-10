
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Package, History, BarChart, Users, RefreshCcw, Waypoints, BarChart3 } from "lucide-react";

export default function AnalysisDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analysis Dashboard</h1>
        <p className="text-muted-foreground">View detailed insights about your business performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Inventory Value Analysis
            </CardTitle>
            <CardDescription>Track inventory financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monitor your inventory value over time, track investment, and analyze stock financial performance.</p>
          </CardContent>
          <CardFooter>
            <Link to="/analysis/inventory-value" className="w-full">
              <Button variant="outline" className="w-full">View Analysis</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Material Consumption
            </CardTitle>
            <CardDescription>Track material usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Analyze how materials are consumed across jobs and orders to optimize your production process.</p>
          </CardContent>
          <CardFooter>
            <Link to="/analysis/material-consumption" className="w-full">
              <Button variant="outline" className="w-full">View Analysis</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Order Consumption
            </CardTitle>
            <CardDescription>Analyze material usage by order</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">See detailed breakdowns of material consumption by order to track costs and optimize pricing.</p>
          </CardContent>
          <CardFooter>
            <Link to="/analysis/order-consumption" className="w-full">
              <Button variant="outline" className="w-full">View Analysis</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-primary" />
              Refill Analysis
            </CardTitle>
            <CardDescription>Inventory reorder recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Get insights into which materials need to be reordered based on your defined thresholds.</p>
          </CardContent>
          <CardFooter>
            <Link to="/analysis/refill-analysis" className="w-full">
              <Button variant="outline" className="w-full">View Analysis</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>Detailed inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Review all inventory transactions to audit material usage and identify patterns or issues.</p>
          </CardContent>
          <CardFooter>
            <Link to="/analysis/transaction-history" className="w-full">
              <Button variant="outline" className="w-full">View Analysis</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Partner Performance
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">New</Badge>
            </CardTitle>
            <CardDescription>Analyze vendor efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Evaluate partner performance based on quantity efficiency, rates, and delivery metrics across jobs.</p>
          </CardContent>
          <CardFooter>
            <Link to="/analysis/partner-performance" className="w-full">
              <Button variant="outline" className="w-full">View Analysis</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
