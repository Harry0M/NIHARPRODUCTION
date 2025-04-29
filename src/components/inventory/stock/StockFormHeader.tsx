
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StockFormHeaderProps {
  isEditing: boolean;
}

export const StockFormHeader = ({ isEditing }: StockFormHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate("/inventory/stock")}
          className="gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Stock' : 'Add Stock'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Update stock details' : 'Add new stock to inventory'}</p>
        </div>
      </div>
    </div>
  );
};
