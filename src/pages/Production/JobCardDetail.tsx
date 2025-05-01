import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreVertical, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderInfoCard } from "./JobCardDetail/OrderInfoCard";
import { ProductionProgressCard } from "./JobCardDetail/ProductionProgressCard";
import { ProductionTimelineCard } from "./JobCardDetail/ProductionTimelineCard";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { JobCardData, JobStatus } from "@/types/production";
import { toast } from "@/hooks/use-toast";

export default function JobCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderComponents, setOrderComponents] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobCardData = async () => {
      try {
        // Fetch job card data
        const { data, error } = await supabase
          .from("job_cards")
          .select(`
            *,
            order:order_id (
              *,
              components (*)
            ),
            cutting_jobs (
              *
            ),
            printing_jobs (
              *
            ),
            stitching_jobs (
              *
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        // Log the complete response for debugging
        console.log("Job card data:", data);

        // Extract components if they exist
        const components = data.order?.components || [];
        setOrderComponents(components);
        
        setJobCard({
          id: data.id,
          job_name: data.job_name,
          status: data.status,
          created_at: data.created_at,
          order: {
            id: data.order?.id || "",
            order_number: data.order?.order_number || "",
            company_name: data.order?.company_name || "",
            quantity: data.order?.quantity,
            bag_length: data.order?.bag_length,
            bag_width: data.order?.bag_width,
            order_date: data.order?.order_date,
            status: data.order?.status,
            components: components
          },
          cutting_jobs: data.cutting_jobs || [],
          printing_jobs: data.printing_jobs || [],
          stitching_jobs: data.stitching_jobs || []
        });
      } catch (error: any) {
        console.error("Error fetching job card:", error);
        toast({
          title: "Error",
          description: "Could not fetch job card data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobCardData();
    }
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "in_progress":
      case "in_production":
        return <Badge variant="secondary">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500" variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Job Card Not Found</h2>
        <p className="mb-4">The job card you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate("/production/job-cards")}>
          Return to Job Cards
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
            onClick={() => navigate("/production/job-cards")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Job Card: {jobCard.job_name}
            </h1>
            <p className="text-muted-foreground">
              View details and manage production progress
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                if (jobCard?.order?.id) {
                  navigate(`/orders/${jobCard.order.id}`);
                } else {
                  toast({
                    title: "Error",
                    description: "Order ID is missing.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              View Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OrderInfoCard
          order={jobCard.order}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
        />
        <ProductionProgressCard jobCard={jobCard} />
        <ProductionTimelineCard jobCardId={id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No notes available for this job card.</p>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="ghost">Edit Notes</Button>
          <p className="text-sm text-muted-foreground">
            Created at {formatDate(jobCard.created_at)}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
