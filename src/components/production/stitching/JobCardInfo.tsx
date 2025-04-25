
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PackageCheck } from "lucide-react";

interface JobCardInfoProps {
  jobName: string;
  orderNumber: string;
  companyName: string;
  quantity: number;
}

export const JobCardInfo = ({
  jobName,
  orderNumber,
  companyName,
  quantity,
}: JobCardInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck size={18} />
          Job Card Information
        </CardTitle>
        <CardDescription>Details from the original job card and order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Job Name</Label>
            <div className="font-medium mt-1">{jobName}</div>
          </div>
          <div>
            <Label>Order Number</Label>
            <div className="font-medium mt-1">{orderNumber}</div>
          </div>
          <div>
            <Label>Company</Label>
            <div className="font-medium mt-1">{companyName}</div>
          </div>
          <div>
            <Label>Order Quantity</Label>
            <div className="font-medium mt-1">{quantity.toLocaleString()} bags</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
