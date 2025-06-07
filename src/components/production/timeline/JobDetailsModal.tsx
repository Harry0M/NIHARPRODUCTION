import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StageStatus } from "@/components/production/StageStatus";
import { TimelineJob } from "@/types/production";
import { format } from "date-fns";
import { Download, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadAsPDF } from "@/utils/downloadUtils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface JobDetailsModalProps {
  job: TimelineJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailsModal = ({ job, open, onOpenChange }: JobDetailsModalProps) => {
  const navigate = useNavigate();
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (job && open) {
      fetchJobDetails(job.id, job.type);
    }
  }, [job, open]);

  const fetchJobDetails = async (jobId: string, jobType: string) => {
    if (!jobId || !jobType) return;
    
    setLoading(true);
    try {
      let data;
      
      switch (jobType) {
        case 'cutting':
          const { data: cuttingData, error: cuttingError } = await supabase
            .from('cutting_jobs')
            .select(`
              *,
              job_card:job_cards (
                job_name, job_number
              ),
              components:cutting_components (
                id,
                component_id,
                width,
                height,
                counter,
                rewinding,
                roll_width,
                consumption,
                rate,
                status,
                notes,
                waste_quantity,
                order_component:component_id (
                  component_type,
                  custom_name,
                  size,
                  color,
                  gsm
                )
              )
            `)
            .eq('id', jobId)
            .single();
          
          if (cuttingError) throw cuttingError;
          data = cuttingData;
          break;
          
        case 'printing':
          const { data: printingData, error: printingError } = await supabase
            .from('printing_jobs')
            .select(`
              *,
              job_card:job_cards (
                job_name, job_number
              )
            `)
            .eq('id', jobId)
            .single();
          
          if (printingError) throw printingError;
          data = printingData;
          break;
          
        case 'stitching':
          const { data: stitchingData, error: stitchingError } = await supabase
            .from('stitching_jobs')
            .select(`
              *,
              job_card:job_cards (
                job_name, job_number
              )
            `)
            .eq('id', jobId)
            .single();
          
          if (stitchingError) throw stitchingError;
          data = stitchingData;
          break;
      }
      
      setJobDetails(data);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleUpdate = () => {
    if (!jobDetails || !job) return;

    // Directly navigate to the edit page based on job type
    const jobCardId = jobDetails.job_card_id;
    let editUrl = '';

    switch(job.type) {
      case 'cutting':
        editUrl = `/production/cutting/${jobCardId}?edit=${job.id}`;
        break;
      case 'printing':
        editUrl = `/production/printing/${jobCardId}?edit=${job.id}`;
        break;
      case 'stitching':
        editUrl = `/production/stitching/${jobCardId}?edit=${job.id}`;
        break;
      default:
        // Default to job card page if type is unknown
        editUrl = `/production/job-cards/${jobCardId}`;
    }

    // Use direct navigation to ensure full page refresh
    window.location.href = editUrl;
  };

  const handleDownload = () => {
    if (!jobDetails) return;
    
    let data;
    switch (job.type) {
      case 'cutting':
        data = [
          {
            job_name: jobDetails.job_card?.job_name || 'N/A',
            job_number: jobDetails.job_card?.job_number || 'N/A',
            status: jobDetails.status,
            worker: jobDetails.worker_name || "N/A",
            is_internal: jobDetails.is_internal ? "Yes" : "No",
            received_quantity: jobDetails.received_quantity,
            created_at: formatDate(jobDetails.created_at),
            components: jobDetails.components?.map((c: any) => 
              `${c.component_type}: ${c.width}×${c.height}, Roll Width: ${c.roll_width || 'N/A'}, 
              Consumption: ${c.consumption || 'N/A'}, Status: ${c.status}`
            ).join('; ')
          }
        ];
        break;
      case 'printing':
        data = [
          {
            job_name: jobDetails.job_card?.job_name || 'N/A',
            job_number: jobDetails.job_card?.job_number || 'N/A',
            status: jobDetails.status,
            worker: jobDetails.worker_name || "N/A",
            is_internal: jobDetails.is_internal ? "Yes" : "No",
            pulling: jobDetails.pulling,
            gsm: jobDetails.gsm,
            sheet_dimensions: `${jobDetails.sheet_length || 'N/A'} × ${jobDetails.sheet_width || 'N/A'}`,
            expected_completion: jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : 'N/A',
            rate: jobDetails.rate,
            created_at: formatDate(jobDetails.created_at)
          }
        ];
        break;
      case 'stitching':
        data = [
          {
            job_name: jobDetails.job_card?.job_name || 'N/A',
            job_number: jobDetails.job_card?.job_number || 'N/A',
            status: jobDetails.status,
            worker: jobDetails.worker_name || "N/A",
            is_internal: jobDetails.is_internal ? "Yes" : "No",
            total_quantity: jobDetails.total_quantity,
            component_quantities: `Part: ${jobDetails.part_quantity || 'N/A'}, Border: ${jobDetails.border_quantity || 'N/A'}, Handle: ${jobDetails.handle_quantity || 'N/A'}, Chain: ${jobDetails.chain_quantity || 'N/A'}, Runner: ${jobDetails.runner_quantity || 'N/A'}, Piping: ${jobDetails.piping_quantity || 'N/A'}`,
            start_date: jobDetails.start_date ? formatDate(jobDetails.start_date) : 'N/A',
            expected_completion: jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : 'N/A',
            notes: jobDetails.notes || 'None',
            rate: jobDetails.rate,
            created_at: formatDate(jobDetails.created_at)
          }
        ];
        break;
    }
    
    downloadAsPDF(data, `${job.type}-job-${job.id}`, `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job Details`);
  };

  // The handleUpdate function has been moved and enhanced to use window.location.href above

  // Helper function to get badge variant based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return "secondary"; // Use secondary instead of success
      case 'in_progress':
        return "default";   // Use default instead of warning
      default:
        return "outline";
    }
  };

  const renderJobSpecificDetails = () => {
    if (!jobDetails) return null;
    
    switch (job.type) {
      case 'cutting':
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Received Quantity</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.received_quantity || "Not recorded"}
                </p>
              </div>
            </div>
            
            {jobDetails.components && jobDetails.components.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobDetails.components
                    .sort((a: any, b: any) => {
                      const consumptionA = parseFloat(a.consumption || '0');
                      const consumptionB = parseFloat(b.consumption || '0');
                      return consumptionB - consumptionA;
                    })
                    .map((component: any) => (
                    <div key={component.id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium capitalize">
                          {component.order_component?.custom_name || 
                           component.order_component?.component_type || 
                           'Unnamed Component'}
                          {component.order_component?.size && 
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({component.order_component.size})
                            </span>
                          }
                        </div>
                        <Badge variant={getBadgeVariant(component.status)}>
                          {component.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Width:</span> {component.width || 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Height:</span> {component.height || 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Counter:</span> {component.counter || 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rewinding:</span> {component.rewinding || 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Roll Width:</span> {component.roll_width || 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Consumption:</span> {component.consumption || 'N/A'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate:</span> {component.rate || 'N/A'}
                        </div>
                        {component.waste_quantity && (
                          <div>
                            <span className="text-muted-foreground">Waste:</span> {component.waste_quantity}
                          </div>
                        )}
                      </div>
                      
                      {component.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="text-sm mt-1">{component.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      case 'printing':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Pulling</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.pulling || "Not specified"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">GSM</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.gsm || "Not specified"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Sheet Length</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.sheet_length || "Not specified"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Sheet Width</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.sheet_width || "Not specified"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Received Quantity</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.received_quantity || "Not recorded"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Expected Completion</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : "Not set"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Rate</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.rate || "Not specified"}
                </p>
              </div>
            </div>
            
            {jobDetails.print_image && (
              <div className="p-4 border rounded-lg bg-card">
                <h4 className="text-sm font-medium mb-3">Print Image</h4>
                <div className="flex justify-center">
                  <div className="h-48 w-48 bg-muted rounded-md overflow-hidden">
                    <img 
                      src={jobDetails.print_image} 
                      alt="Print design" 
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'stitching':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Total Quantity</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.total_quantity || "Not specified"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Start Date</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.start_date ? formatDate(jobDetails.start_date) : "Not set"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Expected Completion</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : "Not set"}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Rate</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.rate || "Not specified"}
                </p>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="text-sm font-medium mb-3">Component Quantities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {jobDetails.part_quantity !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Part</div>
                    <div className="text-lg mt-1">{jobDetails.part_quantity}</div>
                  </div>
                )}
                {jobDetails.border_quantity !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Border</div>
                    <div className="text-lg mt-1">{jobDetails.border_quantity}</div>
                  </div>
                )}
                {jobDetails.handle_quantity !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Handle</div>
                    <div className="text-lg mt-1">{jobDetails.handle_quantity}</div>
                  </div>
                )}
                {jobDetails.chain_quantity !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Chain</div>
                    <div className="text-lg mt-1">{jobDetails.chain_quantity}</div>
                  </div>
                )}
                {jobDetails.runner_quantity !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Runner</div>
                    <div className="text-lg mt-1">{jobDetails.runner_quantity}</div>
                  </div>
                )}
                {jobDetails.piping_quantity !== null && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Piping</div>
                    <div className="text-lg mt-1">{jobDetails.piping_quantity}</div>
                  </div>
                )}
              </div>
            </div>
            
            {jobDetails.notes && (
              <div className="p-4 border rounded-lg bg-card">
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {jobDetails.notes}
                </p>
              </div>
            )}
          </div>
        );
        
      default:
        return <p>No details available for this job type.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="capitalize">{job.type} Job Details</span>
              <StageStatus status={job.status} date={job.created_at} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!jobDetails}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={handleUpdate}
                size="sm"
                disabled={!jobDetails}
              >
                <Edit className="h-4 w-4" />
                Update
              </Button>
            </div>
          </DialogTitle>
          {jobDetails && jobDetails.job_card && (
            <DialogDescription>
              Job: {jobDetails.job_card.job_name}
              {jobDetails.job_card.job_number && ` (${jobDetails.job_card.job_number})`}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !jobDetails ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Unable to load job details</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(jobDetails.created_at)}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Worker</h4>
                  <p className="text-sm text-muted-foreground">
                    {jobDetails.worker_name || "Not assigned"}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Type</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {jobDetails.is_internal ? "Internal" : "External"}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {jobDetails.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                {renderJobSpecificDetails()}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
