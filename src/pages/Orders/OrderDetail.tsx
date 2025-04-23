
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  ClipboardList, 
  Clock, 
  FileText, 
  Package, 
  Pencil,
  Plus,
  Trash
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  order_date: string;
  status: string;
  rate: number | null;
  special_instructions: string | null;
  created_at: string;
}

interface Component {
  id: string;
  order_id: string;
  type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
  details: string | null;
}

interface JobCard {
  id: string;
  order_id: string;
  job_name: string;
  status: string;
  created_at: string;
}

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();
          
        if (orderError) throw orderError;
        setOrder(orderData);
        
        // Fetch order components
        const { data: componentsData, error: componentsError } = await supabase
          .from("components")
          .select("*")
          .eq("order_id", id);
          
        if (componentsError) throw componentsError;
        setComponents(componentsData || []);
        
        // Fetch job cards
        const { data: jobCardsData, error: jobCardsError } = await supabase
          .from("job_cards")
          .select("*")
          .eq("order_id", id)
          .order("created_at", { ascending: false });
          
        if (jobCardsError) throw jobCardsError;
        setJobCards(jobCardsData || []);
        
      } catch (error: any) {
        toast({
          title: "Error fetching order details",
          description: error.message,
          variant: "destructive"
        });
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id, navigate]);

  const handleDeleteOrder = async () => {
    setDeleteLoading(true);
    try {
      console.log("Attempting to delete order with ID:", id);
      
      // First delete related records in a specific sequence
      
      // 1. Delete all cutting components related to this order's job cards
      // First get all job cards for this order
      const { data: jobCardsData, error: jobCardsError } = await supabase
        .from("job_cards")
        .select("id")
        .eq("order_id", id);
      
      if (jobCardsError) throw jobCardsError;
      
      // For each job card, delete cutting components and related jobs
      if (jobCardsData && jobCardsData.length > 0) {
        for (const jobCard of jobCardsData) {
          // Get cutting jobs for this job card
          const { data: cuttingJobs, error: cuttingJobsError } = await supabase
            .from("cutting_jobs")
            .select("id")
            .eq("job_card_id", jobCard.id);
            
          if (cuttingJobsError) throw cuttingJobsError;
          
          // Delete cutting components for each cutting job
          if (cuttingJobs && cuttingJobs.length > 0) {
            for (const cuttingJob of cuttingJobs) {
              const { error: delCuttingComponentsError } = await supabase
                .from("cutting_components")
                .delete()
                .eq("cutting_job_id", cuttingJob.id);
                
              if (delCuttingComponentsError) throw delCuttingComponentsError;
            }
            
            // Delete cutting jobs
            const { error: delCuttingJobsError } = await supabase
              .from("cutting_jobs")
              .delete()
              .eq("job_card_id", jobCard.id);
              
            if (delCuttingJobsError) throw delCuttingJobsError;
          }
          
          // Delete printing jobs
          const { error: delPrintingJobsError } = await supabase
            .from("printing_jobs")
            .delete()
            .eq("job_card_id", jobCard.id);
            
          if (delPrintingJobsError) throw delPrintingJobsError;
          
          // Delete stitching jobs
          const { error: delStitchingJobsError } = await supabase
            .from("stitching_jobs")
            .delete()
            .eq("job_card_id", jobCard.id);
            
          if (delStitchingJobsError) throw delStitchingJobsError;
        }
        
        // Delete job cards
        const { error: delJobCardsError } = await supabase
          .from("job_cards")
          .delete()
          .eq("order_id", id);
          
        if (delJobCardsError) throw delJobCardsError;
      }
      
      // 2. Delete order components
      const { error: componentsError } = await supabase
        .from("components")
        .delete()
        .eq("order_id", id);
      
      if (componentsError) throw componentsError;
      
      // 3. Delete dispatches
      const { error: dispatchesError } = await supabase
        .from("order_dispatches")
        .delete()
        .eq("order_id", id);
        
      if (dispatchesError) throw dispatchesError;
      
      // 4. Finally delete the order itself
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      console.log("Order deleted successfully");
      toast({
        title: "Order Deleted",
        description: "The order has been successfully deleted"
      });
      
      navigate("/orders");
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error deleting order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ready_for_dispatch":
        return "bg-blue-100 text-blue-800";
      case "in_production":
      case "cutting":
      case "printing":
      case "stitching":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const getComponentTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="mb-4 text-muted-foreground">The order you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <Link to="/orders">Return to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Order {order.order_number}
            </h1>
            <p className="text-muted-foreground">
              View and manage order details
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/orders/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this order? This action cannot be undone.
                  All associated job cards and production data will be deleted as well.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteOrder}
                  disabled={deleteLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? "Deleting..." : "Delete Order"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-xs`}>
          {getStatusDisplay(order.status)}
        </Badge>
        <div className="flex items-center text-muted-foreground gap-1">
          <Calendar size={14} />
          <span className="text-sm">Created on {formatDate(order.created_at)}</span>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={18} />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                  <p className="text-lg">{order.company_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Date</h3>
                  <p className="text-lg">{formatDate(order.order_date)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                  <p className="text-lg">{order.quantity.toLocaleString()} bags</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Bag Size</h3>
                  <p className="text-lg">{order.bag_length} × {order.bag_width} inches</p>
                </div>
                {order.rate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Rate per Bag</h3>
                    <p className="text-lg">${order.rate.toFixed(2)}</p>
                  </div>
                )}
                {order.special_instructions && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Special Instructions</h3>
                    <p className="text-lg whitespace-pre-line">{order.special_instructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList size={18} />
                Bag Components
              </CardTitle>
              <CardDescription>Details of all components for this order</CardDescription>
            </CardHeader>
            <CardContent>
              {components.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>GSM</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.map((component) => (
                        <TableRow key={component.id}>
                          <TableCell className="font-medium">
                            {getComponentTypeDisplay(component.type)}
                          </TableCell>
                          <TableCell>{component.size || "-"}</TableCell>
                          <TableCell>{component.color || "-"}</TableCell>
                          <TableCell>{component.gsm || "-"}</TableCell>
                          <TableCell>{component.details || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No components found for this order</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="production" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Job Cards</h2>
            <Button asChild>
              <Link to={`/production/job-cards/new?orderId=${id}`}>
                <Plus size={16} className="mr-1" />
                Create Job Card
              </Link>
            </Button>
          </div>
          
          {jobCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {jobCards.map((jobCard) => (
                <Card key={jobCard.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{jobCard.job_name}</CardTitle>
                    <CardDescription className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(jobCard.created_at)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(jobCard.status)}`}>
                        {getStatusDisplay(jobCard.status)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <Button variant="outline" size="sm" asChild className="justify-center">
                        <Link to={`/production/cutting/${jobCard.id}`}>
                          Cutting
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="justify-center">
                        <Link to={`/production/printing/${jobCard.id}`}>
                          Printing
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="justify-center">
                        <Link to={`/production/stitching/${jobCard.id}`}>
                          Stitching
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary" size="sm" className="w-full" asChild>
                      <Link to={`/production/job-cards/${jobCard.id}`}>
                        <FileText size={14} className="mr-1" />
                        View Job Card
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No job cards yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a job card to start production for this order
                </p>
                <Button asChild>
                  <Link to={`/production/job-cards/new?orderId=${id}`}>
                    <Plus size={16} className="mr-1" />
                    Create Job Card
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDetail;
