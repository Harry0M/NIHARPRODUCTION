
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

interface JobCard {
  job_name: string;
  order: {
    order_number: string;
    company_name: string;
    bag_length: number;
    bag_width: number;
    quantity: number;
  };
}

interface PrintingJobInfoProps {
  jobCard: JobCard;
}

export function PrintingJobInfo({ jobCard }: PrintingJobInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer size={18} />
          Job Card Information
        </CardTitle>
        <CardDescription>Details from the original job card and order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Job Name</Label>
            <div className="font-medium mt-1">{jobCard.job_name}</div>
          </div>
          <div>
            <Label>Order Number</Label>
            <div className="font-medium mt-1">{jobCard.order.order_number}</div>
          </div>
          <div>
            <Label>Company</Label>
            <div className="font-medium mt-1">{jobCard.order.company_name}</div>
          </div>
          <div>
            <Label>Quantity</Label>
            <div className="font-medium mt-1">{jobCard.order.quantity.toLocaleString()} bags</div>
          </div>
          <div>
            <Label>Bag Size</Label>
            <div className="font-medium mt-1">{jobCard.order.bag_length} × {jobCard.order.bag_width} inches</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
