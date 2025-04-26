import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { CuttingJobOrderInfo } from "./CuttingJobOrderInfo";
import { CuttingJobComponentForm } from "./CuttingJobComponentForm";
import { CuttingJobSelection } from "./CuttingJobSelection";
import { useCuttingJob } from "@/hooks/use-cutting-job";
import { CuttingJobHeader } from "@/components/production/cutting/CuttingJobHeader";
import { ArrowLeft } from "lucide-react";

interface CuttingJobFormProps {
  orderId?: string;
}

const CuttingJobForm: React.FC<CuttingJobFormProps> = () => {
  const { id: jobId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const {
    order,
    components,
    job,
    loading,
    setJob,
    addComponent,
    removeComponent,
    updateComponentField,
    saveCuttingJob,
    fetchCuttingJobDetails,
  } = useCuttingJob();

  useEffect(() => {
    if (jobId) {
      fetchCuttingJobDetails(jobId);
    }
  }, [jobId, fetchCuttingJobDetails]);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto mt-4">
      <CuttingJobHeader onBack={handleGoBack} />

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order && <CuttingJobOrderInfo order={order} />}
          <div>
            <CuttingJobSelection
              job={job}
              setJob={setJob}
            />
            <CuttingJobComponentForm
              components={components}
              addComponent={addComponent}
              removeComponent={removeComponent}
              updateComponentField={updateComponentField}
            />
            <Button onClick={saveCuttingJob} className="w-full mt-4">
              Save Cutting Job
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingJobForm;
