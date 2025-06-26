import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, File, Scissors, Printer, PackageCheck, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Component } from "@/types/order";
import { TimelineJob } from "@/types/production";
import { OrderInfoCard } from "./JobCardDetail/OrderInfoCard";
import { ProductionTimelineCard } from "./JobCardDetail/ProductionTimelineCard";
import { ProductionProgressCard } from "./JobCardDetail/ProductionProgressCard";
import { DownloadButton } from "@/components/DownloadButton";
import { downloadAsCSV, formatJobCardForDownload } from "@/utils/downloadUtils";
import { generateJobCardPDF } from "@/utils/professionalPdfUtils";

type JobStatus = Database['public']['Enums']['job_status'];
type OrderStatus = Database['public']['Enums']['order_status'];

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
    received_quantity: number | null;
  }[];
  printing_jobs: {
    id: string;
    status: JobStatus;
    worker_name: string | null;
    created_at: string;
    received_quantity: number | null;
  }[];
  stitching_jobs: {
    id: string;
    status: JobStatus;
    worker_name: string | null;
    created_at: string;
    received_quantity: number | null;
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
            components:order_components (id, component_type, size, color, gsm, custom_name)
          ),
          cutting_jobs (id, status, worker_name, created_at, received_quantity),
          printing_jobs (id, status, worker_name, created_at, received_quantity),
          stitching_jobs (id, status, worker_name, created_at, received_quantity)
        `)
        .eq('id', jobCardId)
        .single();

      if (error) throw error;
      
      // Handle the case where components might not be an array
      const safeData = {
        ...data,
        order: {
          ...data.order,
          // Ensure components is always an array and convert gsm to string
          components: Array.isArray(data.order.components) 
            ? data.order.components.map((comp: any) => ({
                ...comp,
                gsm: comp.gsm !== null ? String(comp.gsm) : null
              }))
            : []
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
    // Use the enhanced job card PDF generation
    generateJobCardPDF(jobCard, `job-card-${jobCard.job_number || jobCard.job_name}`);
  };

  // Transform job data to TimelineJob format
  const mapToTimelineJobs = (jobs: any[], jobType: string): TimelineJob[] => {
    return jobs.map(job => ({
      id: job.id,
      type: jobType,
      status: job.status as JobStatus,
      created_at: job.created_at,
      worker_name: job.worker_name,
      is_internal: job.is_internal
    }));
  };

  // When rendering ProductionTimelineCard, transform the jobs
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
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/orders/${jobCard?.order.id}/edit`)}
            disabled={loading || !jobCard}
          >
            <File size={16} className="mr-1" />
            Edit Order
          </Button>
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
            cuttingJobs={mapToTimelineJobs(jobCard.cutting_jobs || [], 'cutting')}
            printingJobs={mapToTimelineJobs(jobCard.printing_jobs || [], 'printing')}
            stitchingJobs={mapToTimelineJobs(jobCard.stitching_jobs || [], 'stitching')}
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
