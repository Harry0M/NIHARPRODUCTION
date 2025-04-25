
import { Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StageCardProps {
  title: string;
  count: number;
  path: string;
  isActive: boolean;
  description: string;
}

export const StageCard = ({ title, count, path, isActive, description }: StageCardProps) => (
  <Link to={path}>
    <Card className={`hover:border-primary hover:shadow-md transition-all duration-200 ${isActive ? 'border-primary' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          <Layers className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  </Link>
);
