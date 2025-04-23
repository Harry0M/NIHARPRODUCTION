
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
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FileText, MoreHorizontal, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface JobCard {
  id: string;
  job_name: string;
  status: string;
  created_at: string;
  order: {
    order_number: string;
    company_name: string;
  };
}

const JobCardList = () => {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
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
            orders (
              order_number,
              company_name
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formattedData = data?.map(item => ({
          id: item.id,
          job_name: item.job_name,
          status: item.status,
          created_at: item.created_at,
          order: {
            order_number: item.orders.order_number,
            company_name: item.orders.company_name
          }
        }));
        
        setJobCards(formattedData || []);
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
                                <DropdownMenuItem onClick={() => handleCuttingClick(jobCard.id)}>
                                  Cutting
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePrintingClick(jobCard.id)}>
                                  Printing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStitchingClick(jobCard.id)}>
                                  Stitching
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
    </div>
  );
};

export default JobCardList;
