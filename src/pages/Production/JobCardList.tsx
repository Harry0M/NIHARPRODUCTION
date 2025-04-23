import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type JobCard = {
  id: string;
  job_name: string;
  job_number: string | null;
  order_id: string;
};

export default function JobCardList() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobCards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_cards")
        .select("id, job_name, job_number, order_id")
        .order("created_at", { ascending: false });
      if (!error) setJobCards(data ?? []);
      setLoading(false);
    };
    fetchJobCards();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!jobCards.length) return <div className="p-8">No job cards found.</div>;

  return (
    <div className="grid gap-6">
      {jobCards.map((job) => (
        <Card
          key={job.id}
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => navigate(`/production/job-cards/${job.id}`)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Job Number: </span>
                {job.job_number}
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); navigate(`/production/job-cards/${job.id}`);}}>
                View
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <span className="font-semibold">Job Name:</span> {job.job_name}
            </div>
            <div>
              <span className="font-semibold">Order ID:</span> {job.order_id}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
