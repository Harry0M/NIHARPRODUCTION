
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TimelineJob {
  id: string;
  status: string;
  worker_name: string | null;
  created_at: string;
}

interface ProductionTimelineCardProps {
  cuttingCount: number;
  printingCount: number;
  stitchingCount: number;
  handleCreateProcess: (process: string) => void;
  navigateDispatch: () => void;
}

export const ProductionTimelineCard = ({
  cuttingCount,
  printingCount,
  stitchingCount,
  handleCreateProcess,
  navigateDispatch,
}: ProductionTimelineCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock size={18} />
        Production Timeline
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Cutting</p>
              <p className="text-xs text-muted-foreground">
                {cuttingCount ? `${cuttingCount} job(s)` : "No jobs yet"}
              </p>
            </div>
          </div>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => handleCreateProcess("cutting")}
          >
            {cuttingCount ? "View/Add" : "Create"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Printing</p>
              <p className="text-xs text-muted-foreground">
                {printingCount ? `${printingCount} job(s)` : "No jobs yet"}
              </p>
            </div>
          </div>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => handleCreateProcess("printing")}
          >
            {printingCount ? "View/Add" : "Create"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Stitching</p>
              <p className="text-xs text-muted-foreground">
                {stitchingCount ? `${stitchingCount} job(s)` : "No jobs yet"}
              </p>
            </div>
          </div>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => handleCreateProcess("stitching")}
          >
            {stitchingCount ? "View/Add" : "Create"}
          </Button>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Dispatch</p>
              <p className="text-xs text-muted-foreground">Final stage</p>
            </div>
          </div>
          <Button 
            size="sm"
            variant="outline"
            onClick={navigateDispatch}
          >
            View
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
