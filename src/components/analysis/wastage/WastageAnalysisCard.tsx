
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WastageStats {
  totalJobs: number;
  avgWastage: number;
  worstJob: {
    jobType: string;
    percentage: number;
  };
}

export function WastageAnalysisCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<WastageStats>({
    totalJobs: 0,
    avgWastage: 0,
    worstJob: { jobType: "", percentage: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWastageStats();
  }, []);

  const fetchWastageStats = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('job_wastage')
        .select('job_type, wastage_percentage');
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Calculate average wastage
        const totalWastage = data.reduce((sum, job) => sum + (job.wastage_percentage || 0), 0);
        const avgWastage = totalWastage / data.length;
        
        // Find worst job
        const worstJob = data.reduce((worst, job) => {
          return (job.wastage_percentage || 0) > worst.percentage
            ? { jobType: job.job_type, percentage: job.wastage_percentage || 0 }
            : worst;
        }, { jobType: "", percentage: 0 });
        
        setStats({
          totalJobs: data.length,
          avgWastage,
          worstJob
        });
      }
    } catch (error) {
      console.error("Error fetching wastage stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatJobType = (jobType: string): string => {
    switch(jobType) {
      case 'printing_jobs': return 'Printing';
      case 'stitching_jobs': return 'Stitching';
      case 'cutting_jobs': return 'Cutting';
      default: return jobType;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Wastage Analysis</CardTitle>
        <CardDescription>Monitor production wastage and identify problems</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[100px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Jobs tracked</p>
                <p className="text-xl font-medium">{stats.totalJobs}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average wastage</p>
                <p className="text-xl font-medium">{stats.avgWastage.toFixed(2)}%</p>
              </div>
            </div>
            
            {stats.worstJob.jobType && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span>Highest wastage: {stats.worstJob.percentage.toFixed(2)}% in {formatJobType(stats.worstJob.jobType)}</span>
              </div>
            )}
            
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate("/analysis/wastage")}
            >
              View wastage report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
