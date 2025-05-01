
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  status: string;
}

const JobCardNew = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [jobName, setJobName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, order_number, company_name, quantity, bag_length, bag_width, status")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error: any) {
        toast({
          title: "Error fetching orders",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      setSelectedOrder(order || null);
      
      if (order) {
        setJobName(`${order.company_name} - ${order.order_number}`);
      } else {
        setJobName("");
      }
    } else {
      setSelectedOrder(null);
      setJobName("");
    }
  }, [selectedOrderId, orders]);

  const handleCreateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrderId || !jobName) {
      toast({
        title: "Missing required fields",
        description: "Please select an order and enter a job name",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // First create the job card
      const { data, error } = await supabase
        .from("job_cards")
        .insert({
          order_id: selectedOrderId,
          job_name: jobName,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      
      // Fetch components associated with the order
      const { data: components, error: componentsError } = await supabase
        .from("components")
        .select("*")
        .eq("order_id", selectedOrderId);
        
      if (componentsError) {
        console.error("Error fetching components:", componentsError);
        // Continue with job card creation even if components fetch fails
      } else {
        console.log("Components fetched:", components);
        // Log the components data for debugging
      }
      
      toast({
        title: "Job Card created",
        description: `Job ${data.job_number || 'card'} created successfully`,
      });
      
      navigate(`/production/job-cards/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating job card",
        description: error.message,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">New Job Card</h1>
            <p className="text-muted-foreground">Create a new production job card</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Order</CardTitle>
            <CardDescription>
              Choose an order to create a job card for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No orders found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create an order first to generate a job card
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate("/orders/new")}
                >
                  Create Order
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Select
                    value={selectedOrderId}
                    onValueChange={setSelectedOrderId}
                  >
                    <SelectTrigger id="order">
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {order.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOrder && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Company
                      </h3>
                      <p className="text-lg">{selectedOrder.company_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Quantity
                      </h3>
                      <p className="text-lg">
                        {selectedOrder.quantity.toLocaleString()} bags
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Bag Size
                      </h3>
                      <p className="text-lg">
                        {selectedOrder.bag_length} × {selectedOrder.bag_width} inches
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Job Card Details</CardTitle>
              <CardDescription>Enter information for this job card</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="job-card-form" onSubmit={handleCreateJobCard}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="job_name">Job Name</Label>
                    <input
                      id="job_name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder="Enter job name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes for this job"
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/production/job-cards")}
          >
            Cancel
          </Button>
          <Button
            form="job-card-form"
            type="submit"
            disabled={!selectedOrderId || !jobName || submitting}
          >
            {submitting ? "Creating..." : "Create Job Card"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobCardNew;
