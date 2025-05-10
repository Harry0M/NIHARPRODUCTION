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
import { format, parseISO } from "date-fns";
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
              rate,
              status,
              notes,
              waste_quantity
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
            roll_width: jobDetails.roll_width,
            consumption_meters: jobDetails.consumption_meters,
            received_quantity: jobDetails.received_quantity,
            created_at: formatDate(jobDetails.created_at),
            components: jobDetails.components?.map((c: any) => 
              `${c.component_type}: ${c.width}×${c.height}, Status: ${c.status}`
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

  const handleUpdate = () => {
    if (!job || !jobDetails) return;
    
    // Navigate to the appropriate edit page
    navigate(`/production/${job.type}/${jobDetails.job_card_id}`);
  };

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Roll Width</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.roll_width || "Not specified"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Consumption (meters)</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.consumption_meters || "Not calculated"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Received Quantity</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.received_quantity || "Not recorded"}
                </p>
              </div>
            </div>
            
            {jobDetails.components && jobDetails.components.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Components</h4>
                <div className="space-y-3">
                  {jobDetails.components.map((component: any) => (
                    <div key={component.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium capitalize">{component.component_type}</div>
                        <Badge variant={getBadgeVariant(component.status)}>
                          {component.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
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
                          <span className="text-muted-foreground">Rate:</span> {component.rate || 'N/A'}
                        </div>
                        {component.notes && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Notes:</span> {component.notes}
                          </div>
                        )}
                        {component.waste_quantity && (
                          <div>
                            <span className="text-muted-foreground">Waste:</span> {component.waste_quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      case 'printing':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Pulling</h4>
              <p className="text-sm text-muted-foreground">
                {jobDetails.pulling || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">GSM</h4>
              <p className="text-sm text-muted-foreground">
                {jobDetails.gsm || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Sheet Length</h4>
              <p className="text-sm text-muted-foreground">
                {jobDetails.sheet_length || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Sheet Width</h4>
              <p className="text-sm text-muted-foreground">
                {jobDetails.sheet_width || "Not specified"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Expected Completion</h4>
              <p className="text-sm text-muted-foreground">
                {jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : "Not set"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Rate</h4>
              <p className="text-sm text-muted-foreground">
                {jobDetails.rate || "Not specified"}
              </p>
            </div>
            {jobDetails.print_image && (
              <div className="col-span-2">
                <h4 className="font-medium mb-1">Print Image</h4>
                <div className="h-32 w-32 bg-muted rounded-md overflow-hidden">
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
            )}
          </div>
        );
        
      case 'stitching':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Total Quantity</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.total_quantity || "Not specified"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Start Date</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.start_date ? formatDate(jobDetails.start_date) : "Not set"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Expected Completion</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : "Not set"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Rate</h4>
                <p className="text-sm text-muted-foreground">
                  {jobDetails.rate || "Not specified"}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Component Quantities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {jobDetails.part_quantity !== null && (
                  <div className="p-2 border rounded-md">
                    <div className="text-sm font-medium">Part</div>
                    <div className="text-lg">{jobDetails.part_quantity}</div>
                  </div>
                )}
                {jobDetails.border_quantity !== null && (
                  <div className="p-2 border rounded-md">
                    <div className="text-sm font-medium">Border</div>
                    <div className="text-lg">{jobDetails.border_quantity}</div>
                  </div>
                )}
                {jobDetails.handle_quantity !== null && (
                  <div className="p-2 border rounded-md">
                    <div className="text-sm font-medium">Handle</div>
                    <div className="text-lg">{jobDetails.handle_quantity}</div>
                  </div>
                )}
                {jobDetails.chain_quantity !== null && (
                  <div className="p-2 border rounded-md">
                    <div className="text-sm font-medium">Chain</div>
                    <div className="text-lg">{jobDetails.chain_quantity}</div>
                  </div>
                )}
                {jobDetails.runner_quantity !== null && (
                  <div className="p-2 border rounded-md">
                    <div className="text-sm font-medium">Runner</div>
                    <div className="text-lg">{jobDetails.runner_quantity}</div>
                  </div>
                )}
                {jobDetails.piping_quantity !== null && (
                  <div className="p-2 border rounded-md">
                    <div className="text-sm font-medium">Piping</div>
                    <div className="text-lg">{jobDetails.piping_quantity}</div>
                  </div>
                )}
              </div>
            </div>
            
            {jobDetails.notes && (
              <div className="mt-4">
                <h4 className="font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {jobDetails.notes}
                </p>
              </div>
            )}
          </>
        );
        
      default:
        return <p>No details available for this job type.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
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

        <div className="mt-4 space-y-6">
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
              <div className="grid grid-cols-2 gap-4 pb-4">
                <div>
                  <h4 className="font-medium mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(jobDetails.created_at)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Worker</h4>
                  <p className="text-sm text-muted-foreground">
                    {jobDetails.worker_name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Type</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {jobDetails.is_internal ? "Internal" : "External"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Status</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {jobDetails.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="pt-2">
                {renderJobSpecificDetails()}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
