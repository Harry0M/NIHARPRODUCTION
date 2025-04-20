
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Layers } from "lucide-react";

// Import Layers directly

const mockJobs = {
  cutting: [
    { id: "JC-001", order: "ORD-2023-056", product: "Canvas Shopping Bag", quantity: 2000, progress: 75, worker: "Internal Team" },
    { id: "JC-002", order: "ORD-2023-055", product: "Cotton Gift Bag", quantity: 1500, progress: 30, worker: "ABC Cutting Services" },
    { id: "JC-003", order: "ORD-2023-054", product: "Jute Market Bag", quantity: 3000, progress: 15, worker: "Internal Team" },
    { id: "JC-004", order: "ORD-2023-053", product: "Paper Carrier Bag", quantity: 5000, progress: 100, worker: "XYZ Fabricators" },
  ],
  printing: [
    { id: "JP-001", order: "ORD-2023-056", product: "Canvas Shopping Bag", quantity: 2000, progress: 40, worker: "Prime Printing Co." },
    { id: "JP-002", order: "ORD-2023-053", product: "Paper Carrier Bag", quantity: 5000, progress: 90, worker: "Internal Team" },
    { id: "JP-003", order: "ORD-2023-052", product: "Non-woven Promotional Bag", quantity: 2500, progress: 100, worker: "Prime Printing Co." },
  ],
  stitching: [
    { id: "JS-001", order: "ORD-2023-052", product: "Non-woven Promotional Bag", quantity: 2500, progress: 80, worker: "Stitch Perfect Inc." },
    { id: "JS-002", order: "ORD-2023-051", product: "Recycled Tote Bag", quantity: 1800, progress: 100, worker: "Internal Team" },
  ],
  dispatch: [
    { id: "JD-001", order: "ORD-2023-051", product: "Recycled Tote Bag", quantity: 1800, progress: 100, worker: "Internal Team" },
    { id: "JD-002", order: "ORD-2023-050", product: "Premium Gift Bag", quantity: 1200, progress: 100, worker: "Internal Team" },
  ],
};

const ProductionDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production</h1>
        <p className="text-muted-foreground">Monitor and manage production stages</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cutting</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockJobs.cutting.length}</div>
            <p className="text-xs text-muted-foreground">
              Active jobs in cutting stage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printing</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockJobs.printing.length}</div>
            <p className="text-xs text-muted-foreground">
              Active jobs in printing stage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stitching</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockJobs.stitching.length}</div>
            <p className="text-xs text-muted-foreground">
              Active jobs in stitching stage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispatch</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockJobs.dispatch.length}</div>
            <p className="text-xs text-muted-foreground">
              Orders ready for dispatch
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cutting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cutting">Cutting</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          <TabsTrigger value="stitching">Stitching</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cutting" className="space-y-4">
          <div className="grid gap-4">
            {mockJobs.cutting.map(job => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.product}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Job: {job.id}</span>
                        <span>•</span>
                        <span>Order: {job.order}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                        {job.worker}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 2 days left
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="h-2 w-40" />
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Quantity</div>
                      <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Material</div>
                      <div className="text-muted-foreground">Canvas - 150 GSM</div>
                    </div>
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Consumption</div>
                      <div className="text-muted-foreground">750 meters</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="printing" className="space-y-4">
          <div className="grid gap-4">
            {mockJobs.printing.map(job => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.product}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Job: {job.id}</span>
                        <span>•</span>
                        <span>Order: {job.order}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                        {job.worker}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 3 days left
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="h-2 w-40" />
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Quantity</div>
                      <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Design</div>
                      <div className="text-muted-foreground">2 Color Print - Logo Front</div>
                    </div>
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Screen Status</div>
                      <div className="text-muted-foreground">Ready</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="stitching" className="space-y-4">
          <div className="grid gap-4">
            {mockJobs.stitching.map(job => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.product}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Job: {job.id}</span>
                        <span>•</span>
                        <span>Order: {job.order}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                        {job.worker}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 1 day left
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Progress</div>
                      <div className="flex items-center gap-2">
                        <Progress value={job.progress} className="h-2 w-40" />
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Quantity</div>
                      <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Parts</div>
                      <div className="text-muted-foreground">Ready</div>
                    </div>
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Handles</div>
                      <div className="text-muted-foreground">In Process</div>
                    </div>
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Finishing</div>
                      <div className="text-muted-foreground">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="dispatch" className="space-y-4">
          <div className="grid gap-4">
            {mockJobs.dispatch.map(job => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.product}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Job: {job.id}</span>
                        <span>•</span>
                        <span>Order: {job.order}</span>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                      Ready for Dispatch
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Customer</div>
                      <div className="text-sm">Organic Foods</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Quantity</div>
                      <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Quality Check</div>
                      <div className="text-green-600">Passed</div>
                    </div>
                    <div className="bg-background rounded p-2 border">
                      <div className="font-medium mb-1">Packaging</div>
                      <div className="text-green-600">Complete</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDashboard;
