
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const JobCardListHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Cards</h1>
        <p className="text-muted-foreground">Manage production job cards</p>
      </div>
      <Link to="/production/job-cards/new">
        <Button className="flex items-center gap-1">
          <Plus size={16} />
          New Job Card
        </Button>
      </Link>
    </div>
  );
};

export default JobCardListHeader;
