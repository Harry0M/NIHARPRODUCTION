
import { FileText, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface JobCardEmptyStateProps {
  searchTerm: string;
  statusFilter: string;
}

const JobCardEmptyState = ({ searchTerm, statusFilter }: JobCardEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No job cards found</h3>
      <p className="text-muted-foreground mb-4">
        {searchTerm || statusFilter !== "all"
          ? "Try changing your search or filter"
          : "Create your first job card to get started"}
      </p>
      <Link to="/production/job-cards/new">
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          New Job Card
        </Button>
      </Link>
    </div>
  );
};

export default JobCardEmptyState;
