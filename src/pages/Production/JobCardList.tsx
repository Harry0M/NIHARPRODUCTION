import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FileText, MoreHorizontal, Plus, Search, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface JobCard {
  id: string;
  job_name: string;
  status: string;
  created_at: string;
  order: {
    id: string;
    order_number: string;
    company_name: string;
  };
  cutting_jobs: {
    id: string;
    status: string;
  }[];
  printing_jobs: {
    id: string;
    status: string;
  }[];
  stitching_jobs: {
    id: string;
    status: string;
  }[];
}

const JobCardList = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobCardToDelete, setJobCardToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const canStartStage = (jobCard: JobCard, stage: string) => {
    const hasCuttingJobs = jobCard.cutting_jobs && jobCard.cutting_jobs.length > 0;
    const hasPrintingJobs = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
    const hasStitchingJobs = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;

    // Check if at least one cutting job is completed instead of requiring all to be completed
    const isCuttingStarted = hasCuttingJobs;
    const isPrintingStarted = hasPrintingJobs;
    const isStitchingStarted = hasStitchingJobs;
    
    // Check if at least one job is completed for each stage
    const isCuttingCompleted = hasCuttingJobs && 
      jobCard.cutting_jobs.some(job => job.status === 'completed');
    const isPrintingCompleted = hasPrintingJobs && 
      jobCard.printing_jobs.some(job => job.status === 'completed');
    const isStitchingCompleted = hasStitchingJobs && 
      jobCard.stitching_jobs.every(job => job.status === 'completed');

    switch (stage) {
      case 'cutting':
        return true; // Cutting can always be started
      case 'printing':
        return isCuttingStarted || isPrintingStarted; // Either cutting is started or printing already exists
      case 'stitching':
        return isPrintingStarted || isStitchingStarted; // Either printing is started or stitching already exists
      case 'dispatch':
        return isStitchingCompleted; // All stitching jobs must be complete
      default:
        return false;
    }
  };

  const handleStageClick = (stage: string, jobId: string) => {
    const jobCard = jobCards.find(card => card.id === jobId);
    if (!jobCard) return;

    if (!canStartStage(jobCard, stage)) {
      const requiredStage = stage === 'printing' ? 'cutting' : 
                          stage === 'stitching' ? 'printing' : 
                          'stitching';
      
      toast({
        title: "Cannot start " + stage,
        description: `Please complete the ${requiredStage} stage first.`,
        variant: "destructive"
      });
      return;
    }

    switch (stage) {
      case 'cutting':
        handleCuttingClick(jobId);
        break;
      case 'printing':
        handlePrintingClick(jobId);
        break;
      case 'stitching':
        handleStitchingClick(jobId);
        break;
      default:
        break;
    }
  };

  const getJobCardStatus = (jobCard: JobCard) => {
    // Check if there are any stitching jobs
    const hasStitchingJobs = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;
    const hasPrintingJobs = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
    
    // Check if all stitching jobs are completed
    const isStitchingCompleted = hasStitchingJobs && 
      jobCard.stitching_jobs.every(job => job.status === 'completed');
    
    // Check if all printing jobs are completed
    const isPrintingCompleted = hasPrintingJobs && 
      jobCard.printing_jobs.every(job => job.status === 'completed');

    if (isStitchingCompleted) {
      return 'completed';
    } else if (isPrintingCompleted) {
      return 'in_progress';
    } else {
      return 'pending';
    }
  };

  // Update the fetchJobCards function to use the new status
  const fetchJobCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id, 
          job_name, 
          status, 
          created_at,
          order_id,
          orders (
            id,
            order_number,
            company_name
          ),
          cutting_jobs (
            id,
            status
          ),
          printing_jobs (
            id,
            status
          ),
          stitching_jobs (
            id,
            status
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Properly map the response to match our JobCard interface
      const formattedData = data?.map(item => ({
        id: item.id,
        job_name: item.job_name,
        created_at: item.created_at,
        // Transform the orders property to order
        order: {
          id: item.orders?.id,
          order_number: item.orders?.order_number,
          company_name: item.orders?.company_name
        },
        cutting_jobs: item.cutting_jobs || [],
        printing_jobs: item.printing_jobs || [],
        stitching_jobs: item.stitching_jobs || [],
        // Add our custom status logic
        status: getJobCardStatus({
          id: item.id,
          job_name: item.job_name,
          created_at: item.created_at,
          order: {
            id: item.orders?.id,
            order_number: item.orders?.order_number,
            company_name: item.orders?.company_name
          },
          cutting_jobs: item.cutting_jobs || [],
          printing_jobs: item.printing_jobs || [],
          stitching_jobs: item.stitching_jobs || [],
          status: item.status
        })
      })) || [];
      
      setJobCards(formattedData);
    } catch (error: any) {
      toast({
        title: "Error fetching job cards",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  const filteredJobCards = jobCards.filter(jobCard => {
    const matchesSearch = (
      jobCard.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobCard.order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobCard.order.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === "all" || jobCard.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Fixed: Use direct navigation without state to avoid issues with back button
  const handleViewDetails = (jobId: string) => {
    navigate(`/production/job-cards/${jobId}`);
  };

  const handleCuttingClick = (jobId: string) => {
    navigate(`/production/cutting/${jobId}`);
  };

  const handlePrintingClick = (jobId: string) => {
    navigate(`/production/printing/${jobId}`);
  };

  const handleStitchingClick = (jobId: string) => {
    navigate(`/production/stitching/${jobId}`);
  };

  const handleDeleteJobCard = async () => {
    if (!jobCardToDelete) return;

    setDeleteLoading(true);
    try {
      console.log("Attempting to delete job card with ID:", jobCardToDelete);
      
      // Delete all related cutting components
      try {
        const { data: cuttingJobs } = await supabase
          .from('cutting_jobs')
          .select('id')
          .eq('job_card_id', jobCardToDelete);
        
        if (cuttingJobs && cuttingJobs.length > 0) {
          console.log(`Found ${cuttingJobs.length} cutting jobs to delete components from`);
          for (const job of cuttingJobs) {
            const { error } = await supabase
              .from('cutting_components')
              .delete()
              .eq('cutting_job_id', job.id);
            
            if (error) {
              console.error(`Error deleting cutting components for job ${job.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error processing cutting components:", error);
      }
      
      // Delete cutting jobs
      try {
        const { error } = await supabase
          .from('cutting_jobs')
          .delete()
          .eq('job_card_id', jobCardToDelete);
        
        if (error) {
          console.error("Error deleting cutting jobs:", error);
        }
      } catch (error) {
        console.error("Error in cutting jobs deletion:", error);
      }
      
      // Delete printing jobs
      try {
        const { error } = await supabase
          .from('printing_jobs')
          .delete()
          .eq('job_card_id', jobCardToDelete);
          
        if (error) {
          console.error("Error deleting printing jobs:", error);
        }
      } catch (error) {
        console.error("Error in printing jobs deletion:", error);
      }
        
      // Delete stitching jobs
      try {
        const { error } = await supabase
          .from('stitching_jobs')
          .delete()
          .eq('job_card_id', jobCardToDelete);
          
        if (error) {
          console.error("Error deleting stitching jobs:", error);
        }
      } catch (error) {
        console.error("Error in stitching jobs deletion:", error);
      }
      
      // Delete the job card itself
      try {
        const { error: jobCardDeleteError } = await supabase
          .from('job_cards')
          .delete()
          .eq('id', jobCardToDelete);
          
        if (jobCardDeleteError) {
          console.error("Error deleting job card:", jobCardDeleteError);
          throw jobCardDeleteError;
        }
      } catch (error) {
        console.error("Error in job card deletion:", error);
        throw error;
      }
      
      // Update the job cards list by removing the deleted job card
      setJobCards(prevJobCards => prevJobCards.filter(jobCard => jobCard.id !== jobCardToDelete));
      
      toast({
        title: "Job card deleted successfully",
        description: "The job card and all related jobs have been removed.",
      });

      // Navigate to the job cards page to refresh
      navigate('/production/job-cards');
      
    } catch (error: any) {
      console.error("Error deleting job card:", error);
      toast({
        title: "Error deleting job card",
        description: error.message || "An error occurred while deleting the job card",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setJobCardToDelete(null);
      setDeleteLoading(false);
    }
  };

  const confirmDeleteJobCard = (jobCardId: string) => {
    setJobCardToDelete(jobCardId);
    setDeleteDialogOpen(true);
  };

  // Update the DropdownMenu items in the render part
  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>All Job Cards</CardTitle>
          <CardDescription>Production job cards for all orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search job cards..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {filteredJobCards.length === 0 ? (
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
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Job Card</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Created</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobCards.map((jobCard) => (
                        <TableRow key={jobCard.id}>
                          <TableCell className="font-medium">
                            <Button 
                              variant="link" 
                              className="p-0 h-auto font-medium text-left"
                              onClick={() => handleViewDetails(jobCard.id)}
                            >
                              {jobCard.job_name}
                            </Button>
                          </TableCell>
                          <TableCell>{jobCard.order.order_number}</TableCell>
                          <TableCell>{jobCard.order.company_name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(jobCard.status)}`}>
                              {getStatusDisplay(jobCard.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(jobCard.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(jobCard.id)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStageClick('cutting', jobCard.id)}
                                >
                                  Cutting
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStageClick('printing', jobCard.id)}
                                  className={!canStartStage(jobCard, 'printing') ? 'text-muted-foreground' : ''}
                                >
                                  Printing {!canStartStage(jobCard, 'printing') && '(Complete cutting first)'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleStageClick('stitching', jobCard.id)}
                                  className={!canStartStage(jobCard, 'stitching') ? 'text-muted-foreground' : ''}
                                >
                                  Stitching {!canStartStage(jobCard, 'stitching') && '(Complete printing first)'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmDeleteJobCard(jobCard.id)}>
                                  <Trash className="mr-2 h-4 w-4" /> Delete Job Card
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this job card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job card and all associated cutting, printing, and stitching jobs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteJobCard();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete Job Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobCardList;
