
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const JobCardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1"
          onClick={() => navigate("/production/job-cards")}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Card Details</h1>
          <p className="text-muted-foreground">Job Card ID: {id}</p>
        </div>
      </div>
      
      <div className="p-8 text-center">
        <h2 className="text-xl font-medium mb-4">Job Card Details Page</h2>
        <p className="mb-4">This page is under construction and will display job card details soon.</p>
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={() => navigate(`/production/cutting/${id}`)}
          >
            Go to Cutting Job
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobCardDetail;
