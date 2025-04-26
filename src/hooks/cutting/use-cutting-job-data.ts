
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JobStatus, CuttingComponent } from "@/types/production";

interface JobCard {
  id: string;
  job_name: string;
  order: {
    id: string;
    company_name: string;
    order_number: string;
    quantity: number;
    bag_length: number;
    bag_width: number;
  };
}

export const useCuttingJobData = (id: string) => {
  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [existingJobs, setExistingJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: jobCardData, error: jobCardError } = await supabase
        .from("job_cards")
        .select(`
          id, 
          job_name,
          orders (
            id,
            company_name,
            order_number,
            quantity,
            bag_length,
            bag_width
          )
        `)
        .eq("id", id)
        .single();

      if (jobCardError) throw jobCardError;
      
      // Transform jobCardData to match the JobCard interface
      const formattedJobCard: JobCard = {
        id: jobCardData.id,
        job_name: jobCardData.job_name,
        order: jobCardData.orders
      };
      
      setJobCard(formattedJobCard);

      const { data: componentsData, error: componentsError } = await supabase
        .from("order_components")
        .select("*")
        .eq("order_id", jobCardData.orders.id);

      if (componentsError) throw componentsError;
      setComponents(componentsData || []);

      const { data: existingJobsData, error: existingJobsError } = await supabase
        .from("cutting_jobs")
        .select("*")
        .eq("job_card_id", id)
        .order('created_at', { ascending: false });

      if (existingJobsError) throw existingJobsError;
      
      const formattedJobs = (existingJobsData || []).map(job => ({
        ...job,
        roll_width: job.roll_width?.toString() || "",
        consumption_meters: job.consumption_meters?.toString() || "",
        received_quantity: job.received_quantity?.toString() || ""
      }));
      
      setExistingJobs(formattedJobs);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    jobCard,
    loading,
    components,
    existingJobs
  };
};
