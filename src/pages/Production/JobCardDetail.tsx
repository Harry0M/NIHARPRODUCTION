import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, File, Scissors, Printer, PackageCheck, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { OrderInfoCard } from "./JobCardDetail/OrderInfoCard";
import { ProductionTimelineCard } from "./JobCardDetail/ProductionTimelineCard";
import { ProductionProgressCard } from "./JobCardDetail/ProductionProgressCard";
import { DownloadButton } from "@/components/DownloadButton";
import { downloadAsCSV, downloadAsPDF, formatJobCardForDownload } from "@/utils/downloadUtils";

type JobStatus = Database['public']['Enums']['job_status'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface Component {
  id: string;
  type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
}

interface JobCardDetails {
  id: string;
  job_name: string;
  job_number: string | null;
  status: JobStatus;
  created_at: string;
  order: {
    id: string;
    order_number: string;
    company_name: string;
    quantity: number;
    bag_length: number;
    bag_width: number;
    order_date: string;
    status: OrderStatus;
    components: Component[];
  };
  cutting_jobs: {
    id: string;
    status: JobStatus;
    worker_name: string | null;
    created_at: string;
  }[];
  printing_jobs: {
    id: string;
    status: JobStatus;
    worker_name: string | null;
    created_at: string;
  }[];
  stitching_jobs: {
    id: string;
    status: JobStatus;
    worker_name: string | null;
    created_at: string;
  }[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "pending":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const JobCardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobCard, setJobCard] = useState<JobCardDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchJobCardDetails(id);
  }, [id]);

  const fetchJobCardDetails = async (jobCardId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id, job_name, job_number, status, created_at,
          order:order_id (
            id, order_number, company_name, quantity, 
            bag_length, bag_width, order_date, status,
            components (id, type, size, color, gsm)
          ),
          cutting_jobs (id, status, worker_name, created_at),
          printing_jobs (id, status, worker_name, created_at),
          stitching_jobs (id, status, worker_name, created_at)
        `)
        .eq('id', jobCardId)
        .single();

      if (error) throw error;
      
      // Handle the case where components might not be an array
      const safeData = {
        ...data,
        order: {
          ...data.order,
          // Ensure components is always an array
          components: Array.isArray(data.order.components) ? data.order.components : []
        }
      };
      
      setJobCard(safeData as JobCardDetails);
    } catch (error: any) {
      toast({
        title: "Error fetching job card",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => (
    <Badge variant="outline" className={`${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );

  const handleCreateProcess = (process: string) => {
    if (!jobCard) return;
    
    // Navigate to the appropriate process page
    switch (process) {
      case "cutting":
        navigate(`/production/cutting/${id}`);
        break;
      case "printing":
        navigate(`/production/printing/${id}`);
        break;
      case "stitching":
        navigate(`/production/stitching/${id}`);
        break;
      default:
        break;
    }
  };

  const handleDownloadCSV = () => {
    if (!jobCard) return;
    const formattedData = formatJobCardForDownload(jobCard);
    downloadAsCSV(formattedData, `job-card-${jobCard.job_number || jobCard.job_name}`);
  };

  const handleDownloadPDF = () => {
    if (!jobCard) return;
    const formattedData = formatJobCardForDownload(jobCard);
    downloadAsPDF(
      formattedData, 
      `job-card-${jobCard.job_number || jobCard.job_name}`,
      `Job Card: ${jobCard.job_name}`
    );
  };

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
          {!loading && jobCard && (
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Job Name: {jobCard.job_name}
                {jobCard.job_number && ` (${jobCard.job_number})`}
              </p>
              {getStatusBadge(jobCard.status)}
            </div>
          )}
        </div>
        <div className="ml-auto">
          <DownloadButton 
            label="Download Details" 
            onCsvClick={handleDownloadCSV}
            onPdfClick={handleDownloadPDF}
            disabled={loading || !jobCard}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : jobCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrderInfoCard 
            order={jobCard.order}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
          <ProductionTimelineCard
            cuttingCount={jobCard.cutting_jobs?.length || 0}
            printingCount={jobCard.printing_jobs?.length || 0}
            stitchingCount={jobCard.stitching_jobs?.length || 0}
            handleCreateProcess={handleCreateProcess}
            navigateDispatch={() => navigate("/dispatch")}
            cuttingJobs={jobCard.cutting_jobs}
            printingJobs={jobCard.printing_jobs}
            stitchingJobs={jobCard.stitching_jobs}
          />
          <ProductionProgressCard
            cuttingJobs={jobCard.cutting_jobs || []}
            printingJobs={jobCard.printing_jobs || []}
            stitchingJobs={jobCard.stitching_jobs || []}
            getStatusColor={getStatusColor}
            formatDate={formatDate}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">Job Card Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested job card could not be found.</p>
          <Button onClick={() => navigate("/production/job-cards")}>
            Back to Job Cards
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobCardDetail;
