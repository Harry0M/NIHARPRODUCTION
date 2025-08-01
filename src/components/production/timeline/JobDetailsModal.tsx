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
import { generateJobPDF } from "@/utils/professionalPdfUtils";
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
  const [downloading, setDownloading] = useState(false);

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
                  gsm,
                  inventory:material_id (
                    id,
                    material_name,
                    color,
                    gsm,
                    unit
                  )
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
                job_name, 
                job_number,
                order:orders (
                  id,
                  order_number,
                  components:order_components (
                    id,
                    component_type,
                    custom_name,
                    size,
                    color,
                    gsm,
                    inventory:material_id (
                      id,
                      material_name,
                      color,
                      gsm,
                      unit
                    )
                  )
                )
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

    // Close the modal first
    onOpenChange(false);

    // Navigate to the edit page based on job type using React Router
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

    // Use React Router navigation instead of window.location.href
    navigate(editUrl);
  };

  const handleDownload = async () => {
    if (!jobDetails || !job) return;
    
    setDownloading(true);
    try {
      generateJobPDF(jobDetails, `${job.type}-job-${job.id}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // You could add a toast notification here for better UX
    } finally {
      setDownloading(false);
    }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/50 dark:to-indigo-900/30 rounded-lg border border-indigo-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-100">Received Quantity</h4>
                </div>
                <p className="text-xl font-semibold text-indigo-800 dark:text-indigo-200">
                  {jobDetails.received_quantity || "Not recorded"}
                </p>
              </div>
            </div>
            
            {jobDetails.components && jobDetails.components.length > 0 && (() => {
              // Filter components into main and small categories
              const allValidComponents = jobDetails.components.filter((component: any) => {
                const hasValidData = 
                  component.width || 
                  component.height || 
                  component.counter || 
                  component.rewinding || 
                  component.roll_width || 
                  component.consumption || 
                  component.rate || 
                  component.waste_quantity || 
                  component.notes ||
                  (component.order_component?.custom_name || component.order_component?.component_type);
                
                return hasValidData;
              });

              // Separate main components (with substantial data) from small components
              const mainComponents = allValidComponents.filter((component: any) => {
                const hasSubstantialData = 
                  component.consumption || 
                  component.rate || 
                  component.waste_quantity || 
                  (component.width && parseFloat(component.width) > 0) ||
                  (component.height && parseFloat(component.height) > 0) ||
                  (component.counter && parseFloat(component.counter) > 0);
                
                return hasSubstantialData;
              });

              const smallComponents = allValidComponents.filter((component: any) => {
                const hasSubstantialData = 
                  component.consumption || 
                  component.rate || 
                  component.waste_quantity || 
                  (component.width && parseFloat(component.width) > 0) ||
                  (component.height && parseFloat(component.height) > 0) ||
                  (component.counter && parseFloat(component.counter) > 0);
                
                return !hasSubstantialData;
              });

              return allValidComponents.length > 0 && (
                <div className="space-y-6">
                  {/* Main Components Section */}
                  {mainComponents.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-lg font-semibold">Main Components</h4>
                        <Badge variant="outline" className="text-xs">
                          {mainComponents.length} {mainComponents.length === 1 ? 'Component' : 'Components'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {mainComponents
                          .sort((a: any, b: any) => {
                            const consumptionA = parseFloat(a.consumption || '0');
                            const consumptionB = parseFloat(b.consumption || '0');
                            return consumptionB - consumptionA;
                          })
                          .map((component: any) => (
                        <div key={component.id} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg transform transition-transform group-hover:scale-105"></div>
                          <div className="relative p-5 border rounded-lg bg-card hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="font-semibold text-lg capitalize text-foreground">
                                  {component.order_component?.custom_name || 
                                   component.order_component?.component_type || 
                                   'Unnamed Component'}
                                </div>
                                {component.order_component?.size && 
                                  <span className="text-sm text-muted-foreground font-medium">
                                    {component.order_component.size}
                                  </span>
                                }
                                {/* Material Information */}
                                {component.order_component?.inventory ? (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        {component.order_component.inventory.material_name}
                                      </span>
                                    </div>
                                    {(component.order_component.inventory.color || component.order_component.inventory.gsm) && (
                                      <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                        {[
                                          component.order_component.inventory.color ? `Color: ${component.order_component.inventory.color}` : null,
                                          component.order_component.inventory.gsm ? `GSM: ${component.order_component.inventory.gsm}` : null
                                        ].filter(Boolean).join(' • ')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200/50">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        No material linked
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Badge 
                                variant={getBadgeVariant(component.status)}
                                className="text-xs px-2 py-1 font-medium"
                              >
                                {component.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground text-xs block">Width</span>
                                <span className="font-medium">{component.width || 'N/A'}</span>
                              </div>
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground text-xs block">Height</span>
                                <span className="font-medium">{component.height || 'N/A'}</span>
                              </div>
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground text-xs block">Counter</span>
                                <span className="font-medium">{component.counter || 'N/A'}</span>
                              </div>
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground text-xs block">Rewinding</span>
                                <span className="font-medium">{component.rewinding || 'N/A'}</span>
                              </div>
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground text-xs block">Roll Width</span>
                                <span className="font-medium">{component.roll_width || 'N/A'}</span>
                              </div>
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground text-xs block">Rate</span>
                                <span className="font-medium">{component.rate || 'N/A'}</span>
                              </div>
                            </div>
                            
                            {component.consumption && (
                              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-primary">Consumption</span>
                                  <span className="text-lg font-bold text-primary">{component.consumption}</span>
                                </div>
                              </div>
                            )}
                            
                            {component.waste_quantity && (
                              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Waste</span>
                                  <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">{component.waste_quantity}</span>
                                </div>
                              </div>
                            )}
                            
                            {component.notes && (
                              <div className="mt-3 pt-3 border-t border-muted">
                                <span className="text-xs font-medium text-muted-foreground block mb-1">Notes</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">{component.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Small Components Section */}
                  {smallComponents.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="text-base font-medium text-muted-foreground">Small Components</h4>
                        <Badge variant="secondary" className="text-xs">
                          {smallComponents.length} {smallComponents.length === 1 ? 'Component' : 'Components'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {smallComponents.map((component: any) => (
                          <div key={component.id} className="p-3 border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                            <div className="text-sm font-medium mb-1 capitalize text-foreground">
                              {component.order_component?.custom_name || 
                               component.order_component?.component_type || 
                               'Unnamed'}
                            </div>
                            {component.order_component?.size && (
                              <div className="text-xs text-muted-foreground mb-2">
                                {component.order_component.size}
                              </div>
                            )}
                            
                            {/* Material Information */}
                            {component.order_component?.inventory?.material_name ? (
                              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200/50">
                                <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                                  {component.order_component.inventory.material_name}
                                </div>
                                {(component.order_component.inventory.color || component.order_component.inventory.gsm) && (
                                  <div className="text-xs text-blue-600 dark:text-blue-300">
                                    {[component.order_component.inventory.color, component.order_component.inventory.gsm].filter(Boolean).join(' • ')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-950/30 rounded border border-gray-200/50">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  No material linked
                                </div>
                              </div>
                            )}
                            
                            <Badge 
                              variant={getBadgeVariant(component.status)}
                              className="text-xs px-1 py-0.5"
                            >
                              {component.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Information */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Total components:</span>
                    <Badge variant="outline" className="text-xs">
                      {allValidComponents.length} valid
                    </Badge>
                    {jobDetails.components.length !== allValidComponents.length && (
                      <Badge variant="secondary" className="text-xs">
                        {jobDetails.components.length - allValidComponents.length} empty filtered out
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        );
        
      case 'printing':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-lg border border-emerald-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Pulling</h4>
                </div>
                <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                  {jobDetails.pulling || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/50 dark:to-cyan-900/30 rounded-lg border border-cyan-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-cyan-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-cyan-900 dark:text-cyan-100">GSM</h4>
                </div>
                <p className="text-lg font-semibold text-cyan-800 dark:text-cyan-200">
                  {jobDetails.gsm || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 rounded-lg border border-violet-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-violet-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-violet-900 dark:text-violet-100">Sheet Dimensions</h4>
                </div>
                <p className="text-lg font-semibold text-violet-800 dark:text-violet-200">
                  {jobDetails.sheet_length && jobDetails.sheet_width 
                    ? `${jobDetails.sheet_length} × ${jobDetails.sheet_width}`
                    : "Not specified"
                  }
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/50 dark:to-rose-900/30 rounded-lg border border-rose-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-rose-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-rose-900 dark:text-rose-100">Received Quantity</h4>
                </div>
                <p className="text-lg font-semibold text-rose-800 dark:text-rose-200">
                  {jobDetails.received_quantity || "Not recorded"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 rounded-lg border border-amber-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">Expected Completion</h4>
                </div>
                <p className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                  {jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : "Not set"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/50 dark:to-teal-900/30 rounded-lg border border-teal-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-teal-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-teal-900 dark:text-teal-100">Rate</h4>
                </div>
                <p className="text-lg font-semibold text-teal-800 dark:text-teal-200">
                  {jobDetails.rate || "Not specified"}
                </p>
              </div>
            </div>
            
            {jobDetails.print_image && (
              <div className="p-6 border rounded-xl bg-card shadow-sm">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  Print Design Preview
                </h4>
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-lg group-hover:blur-xl transition-all duration-300"></div>
                    <div className="relative h-64 w-64 bg-muted rounded-lg overflow-hidden border-2 border-muted-foreground/20 shadow-lg">
                      <img 
                        src={jobDetails.print_image} 
                        alt="Print design" 
                        className="h-full w-full object-contain hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
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
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-lg border border-blue-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Quantity</h4>
                </div>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  {jobDetails.provided_quantity || "Not specified"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 rounded-lg border border-green-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-100">Start Date</h4>
                </div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {jobDetails.start_date ? formatDate(jobDetails.start_date) : "Not set"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-lg border border-purple-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">Expected Completion</h4>
                </div>
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                  {jobDetails.expected_completion_date ? formatDate(jobDetails.expected_completion_date) : "Not set"}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 rounded-lg border border-orange-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">Rate</h4>
                </div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {jobDetails.rate || "Not specified"}
                </p>
              </div>
            </div>
            
            <div className="p-6 border rounded-xl bg-card shadow-sm">
              <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                Component Quantities
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {jobDetails.part_quantity !== null && (
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/20 rounded-lg transform transition-transform group-hover:scale-105"></div>
                    <div className="relative p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/50 dark:to-indigo-900/30 rounded-lg border border-indigo-200/50">
                      <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Part</div>
                      <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{jobDetails.part_quantity}</div>
                    </div>
                  </div>
                )}
                {jobDetails.border_quantity !== null && (
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-lg transform transition-transform group-hover:scale-105"></div>
                    <div className="relative p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-lg border border-emerald-200/50">
                      <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Border</div>
                      <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{jobDetails.border_quantity}</div>
                    </div>
                  </div>
                )}
                {jobDetails.handle_quantity !== null && (
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 rounded-lg transform transition-transform group-hover:scale-105"></div>
                    <div className="relative p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 rounded-lg border border-amber-200/50">
                      <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Handle</div>
                      <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{jobDetails.handle_quantity}</div>
                    </div>
                  </div>
                )}
                {jobDetails.chain_quantity !== null && (
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 rounded-lg transform transition-transform group-hover:scale-105"></div>
                    <div className="relative p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/50 dark:to-rose-900/30 rounded-lg border border-rose-200/50">
                      <div className="text-xs font-medium text-rose-700 dark:text-rose-300 mb-1">Chain</div>
                      <div className="text-2xl font-bold text-rose-900 dark:text-rose-100">{jobDetails.chain_quantity}</div>
                    </div>
                  </div>
                )}
                {jobDetails.runner_quantity !== null && (
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/20 rounded-lg transform transition-transform group-hover:scale-105"></div>
                    <div className="relative p-4 bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/50 dark:to-cyan-900/30 rounded-lg border border-cyan-200/50">
                      <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Runner</div>
                      <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{jobDetails.runner_quantity}</div>
                    </div>
                  </div>
                )}
                {jobDetails.piping_quantity !== null && (
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/30 dark:to-violet-800/20 rounded-lg transform transition-transform group-hover:scale-105"></div>
                    <div className="relative p-4 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30 rounded-lg border border-violet-200/50">
                      <div className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">Piping</div>
                      <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">{jobDetails.piping_quantity}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {jobDetails.notes && (
              <div className="p-6 border rounded-xl bg-card shadow-sm">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  Additional Notes
                </h4>
                <div className="p-4 bg-muted/30 rounded-lg border border-muted">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {jobDetails.notes}
                  </p>
                </div>
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background to-muted/20">
        <DialogHeader className="space-y-4 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm uppercase">
                    {job.type.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold capitalize">{job.type} Job Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Job ID: {job.id}
                  </p>
                </div>
              </div>
              <StageStatus status={job.status} date={job.created_at} />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!jobDetails || downloading}
                className="hover:bg-primary/5 transition-colors"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleUpdate}
                size="sm"
                disabled={!jobDetails}
                className="bg-primary hover:bg-primary/90 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Job
              </Button>
            </div>
          </DialogTitle>
          {jobDetails && jobDetails.job_card && (
            <DialogDescription className="text-base">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium">Job:</span>
                <span className="text-foreground font-medium">
                  {jobDetails.job_card.job_name}
                </span>
                {jobDetails.job_card.job_number && (
                  <Badge variant="outline" className="ml-2">
                    {jobDetails.job_card.job_number}
                  </Badge>
                )}
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading job details...</p>
            </div>
          ) : !jobDetails ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-2xl">⚠</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Unable to Load Job Details</h3>
              <p className="text-muted-foreground">Please try refreshing or contact support if the issue persists.</p>
            </div>
          ) : (
            <>
              {/* Enhanced Job Overview Section */}
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  Job Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-lg border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Created</h4>
                    </div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {formatDate(jobDetails.created_at)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 rounded-lg border border-green-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <h4 className="text-sm font-medium text-green-900 dark:text-green-100">Worker</h4>
                    </div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {jobDetails.worker_name || "Not assigned"}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-lg border border-purple-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">Type</h4>
                    </div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200 capitalize">
                      {jobDetails.is_internal ? "Internal" : "External"}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 rounded-lg border border-orange-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                      <h4 className="text-sm font-medium text-orange-900 dark:text-orange-100">Status</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={getBadgeVariant(jobDetails.status)} 
                        className="text-xs px-2 py-1"
                      >
                        {jobDetails.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Enhanced Job Specific Details */}
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  {job.type === 'cutting' && 'Cutting Details & Components'}
                  {job.type === 'printing' && 'Printing Specifications'}
                  {job.type === 'stitching' && 'Stitching Details & Quantities'}
                </h3>
                <div className="space-y-6">
                  {renderJobSpecificDetails()}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
