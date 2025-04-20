
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, File, Scissors, Printer, PackageCheck, Truck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type JobStatus = Database['public']['Enums']['job_status'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface JobCardDetails {
  id: string;
  job_name: string;
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
    components: {
      id: string;
      type: string;
      size: string | null;
      color: string | null;
      gsm: string | null;
    }[];
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
          id, job_name, status, created_at,
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
      setJobCard(data as JobCardDetails);
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
    <Badge className={`${getStatusColor(status)}`}>
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
              <p className="text-muted-foreground">Job Name: {jobCard.job_name}</p>
              {getStatusBadge(jobCard.status)}
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : jobCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File size={18} />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Order Number</p>
                  <p>{jobCard.order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Company</p>
                  <p>{jobCard.order.company_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order Date</p>
                  <p>{formatDate(jobCard.order.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quantity</p>
                  <p>{jobCard.order.quantity.toLocaleString()} bags</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Bag Size</p>
                  <p>{jobCard.order.bag_length}" × {jobCard.order.bag_width}"</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p>{getStatusBadge(jobCard.order.status)}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-md font-medium mb-2">Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {jobCard.order.components?.map((component) => (
                    <div key={component.id} className="border rounded-md p-3">
                      <p className="text-sm font-medium capitalize">{component.type}</p>
                      <div className="text-xs text-muted-foreground space-y-1 mt-1">
                        {component.size && <p>Size: {component.size}</p>}
                        {component.color && <p>Color: {component.color}</p>}
                        {component.gsm && <p>GSM: {component.gsm}</p>}
                      </div>
                    </div>
                  ))}
                  {!jobCard.order.components?.length && (
                    <p className="text-muted-foreground text-sm">No components specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Stages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} />
                Production Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cutting</p>
                      <p className="text-xs text-muted-foreground">
                        {jobCard.cutting_jobs?.length ? 
                         `${jobCard.cutting_jobs.length} job(s)` : 
                         "No jobs yet"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateProcess("cutting")}
                  >
                    {jobCard.cutting_jobs?.length ? "View/Add" : "Create"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Printing</p>
                      <p className="text-xs text-muted-foreground">
                        {jobCard.printing_jobs?.length ? 
                         `${jobCard.printing_jobs.length} job(s)` : 
                         "No jobs yet"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateProcess("printing")}
                  >
                    {jobCard.printing_jobs?.length ? "View/Add" : "Create"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Stitching</p>
                      <p className="text-xs text-muted-foreground">
                        {jobCard.stitching_jobs?.length ? 
                         `${jobCard.stitching_jobs.length} job(s)` : 
                         "No jobs yet"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleCreateProcess("stitching")}
                  >
                    {jobCard.stitching_jobs?.length ? "View/Add" : "Create"}
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dispatch</p>
                      <p className="text-xs text-muted-foreground">Final stage</p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/dispatch")}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Process Summaries */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Production Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cutting Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Scissors className="h-5 w-5" /> 
                      Cutting
                    </h3>
                    {jobCard.cutting_jobs?.length > 0 && (
                      <Badge 
                        className={getStatusColor(
                          jobCard.cutting_jobs.every(job => job.status === 'completed') 
                            ? 'completed' 
                            : jobCard.cutting_jobs.some(job => job.status === 'in_progress')
                            ? 'in_progress'
                            : 'pending'
                        )}
                      >
                        {jobCard.cutting_jobs.every(job => job.status === 'completed') 
                          ? 'Completed' 
                          : jobCard.cutting_jobs.some(job => job.status === 'in_progress')
                          ? 'In Progress'
                          : 'Pending'}
                      </Badge>
                    )}
                  </div>
                  
                  {jobCard.cutting_jobs?.length ? (
                    <div className="space-y-2">
                      {jobCard.cutting_jobs.map((job) => (
                        <div key={job.id} className="text-sm border-l-2 border-gray-200 pl-3">
                          <p>Worker: {job.worker_name || 'Not assigned'}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(job.created_at)}
                            </p>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No cutting jobs created yet</p>
                  )}
                </div>
                
                {/* Printing Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Printer className="h-5 w-5" /> 
                      Printing
                    </h3>
                    {jobCard.printing_jobs?.length > 0 && (
                      <Badge 
                        className={getStatusColor(
                          jobCard.printing_jobs.every(job => job.status === 'completed') 
                            ? 'completed' 
                            : jobCard.printing_jobs.some(job => job.status === 'in_progress')
                            ? 'in_progress'
                            : 'pending'
                        )}
                      >
                        {jobCard.printing_jobs.every(job => job.status === 'completed') 
                          ? 'Completed' 
                          : jobCard.printing_jobs.some(job => job.status === 'in_progress')
                          ? 'In Progress'
                          : 'Pending'}
                      </Badge>
                    )}
                  </div>
                  
                  {jobCard.printing_jobs?.length ? (
                    <div className="space-y-2">
                      {jobCard.printing_jobs.map((job) => (
                        <div key={job.id} className="text-sm border-l-2 border-gray-200 pl-3">
                          <p>Worker: {job.worker_name || 'Not assigned'}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(job.created_at)}
                            </p>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No printing jobs created yet</p>
                  )}
                </div>
                
                {/* Stitching Summary */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <PackageCheck className="h-5 w-5" /> 
                      Stitching
                    </h3>
                    {jobCard.stitching_jobs?.length > 0 && (
                      <Badge 
                        className={getStatusColor(
                          jobCard.stitching_jobs.every(job => job.status === 'completed') 
                            ? 'completed' 
                            : jobCard.stitching_jobs.some(job => job.status === 'in_progress')
                            ? 'in_progress'
                            : 'pending'
                        )}
                      >
                        {jobCard.stitching_jobs.every(job => job.status === 'completed') 
                          ? 'Completed' 
                          : jobCard.stitching_jobs.some(job => job.status === 'in_progress')
                          ? 'In Progress'
                          : 'Pending'}
                      </Badge>
                    )}
                  </div>
                  
                  {jobCard.stitching_jobs?.length ? (
                    <div className="space-y-2">
                      {jobCard.stitching_jobs.map((job) => (
                        <div key={job.id} className="text-sm border-l-2 border-gray-200 pl-3">
                          <p>Worker: {job.worker_name || 'Not assigned'}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(job.created_at)}
                            </p>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No stitching jobs created yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
