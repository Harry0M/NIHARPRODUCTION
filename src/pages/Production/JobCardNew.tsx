
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
import { recordJobCardMaterialUsage } from "@/utils/allowNegativeInventory";
import { createJobCardConsumptionBatch } from "@/utils/jobCardConsumptionUtils";

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
          .order("created_at", { ascending: false });        if (error) throw error;
        setOrders(data || []);
      } catch (error: unknown) {
        toast({
          title: "Error fetching orders",
          description: error instanceof Error ? error.message : "Unknown error occurred",
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
      // Implement retry logic for job card creation
      let jobCardResult = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !jobCardResult) {
        attempts++;
        
        try {
          const { data, error } = await supabase
            .from("job_cards")
            .insert({
              order_id: selectedOrderId,
              job_name: jobName,
              status: "pending",
              notes: notes || null,
            })
            .select()
            .single();

          if (error) {
            console.error(`Job card creation attempt ${attempts} error:`, error);
            
            // If it's not a duplicate key error or we've reached max attempts, throw the error
            if (error.code !== '23505' || attempts >= maxAttempts) {
              throw error;
            }
            
            // For duplicate key errors, wait briefly and retry
            await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          } else {
            // Success! Store the result and exit the retry loop
            jobCardResult = data;
            break;
          }
        } catch (insertError) {
          if (attempts >= maxAttempts) {
            throw insertError;
          }
        }
      }
        if (!jobCardResult) {
        throw new Error("Failed to create job card after multiple attempts");
      }

      // Refetch the job card to get the generated job_number
      const { data: updatedJobCard, error: refetchError } = await supabase
        .from("job_cards")
        .select("id, job_name, job_number")
        .eq("id", jobCardResult.id)
        .single();

      if (refetchError) {
        console.error("Error refetching job card:", refetchError);
        throw refetchError;
      }

      // Use the updated job card data with the generated job_number
      jobCardResult = updatedJobCard;
      console.log("Job card created with number:", jobCardResult.job_number);

      // After job card is created, calculate and record material consumption
      try {
        console.log("Fetching order components for consumption calculation");
        const { data: components, error: componentsError } = await supabase
          .from("order_components")
          .select(`
            *,
            material:inventory(
              id,
              material_name,
              unit,
              quantity
            )
          `)
          .eq("order_id", selectedOrderId);
          
        if (componentsError) {
          console.error("Error fetching order components:", componentsError);
          throw componentsError;
        }
        
        console.log(`Found ${components?.length || 0} components for order ${selectedOrderId}`);
        
        if (components && components.length > 0) {          // Get the order details including creation date
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .select("order_number, order_date")
            .eq("id", selectedOrderId)
            .single();
            
          if (orderError) {
            console.error("Error fetching order details:", orderError);
            throw orderError;
          }
          
          const orderNumber = orderData.order_number;
          const orderDate = orderData.order_date;
          console.log(`Processing material consumption for order #${orderNumber} created on ${orderDate}`);
          
          // Track inventory update results
          let inventorySuccessCount = 0;
          let inventoryErrorCount = 0;
          
          // Step 1: Update inventory quantities using the existing function
          for (const component of components) {
            if (component.material_id && component.consumption > 0 && component.material) {
              console.log(`Processing inventory update for ${component.component_type} component:`, {
                materialId: component.material_id,
                consumption: component.consumption
              });
                try {
                const result = await recordJobCardMaterialUsage(
                  jobCardResult.id,
                  jobCardResult.job_number || 'New Job',
                  selectedOrderId,
                  orderNumber,
                  component.material_id,
                  component.consumption,
                  component.component_type,
                  orderDate
                );
                
                if (!result.success) {
                  console.warn(`Warning: Inventory update failed for component ${component.component_type}:`, result);
                  inventoryErrorCount++;
                } else {
                  console.log(`Inventory updated for component ${component.component_type}:`, {
                    previousQuantity: result.previousQuantity,
                    newQuantity: result.newQuantity,
                    consumed: component.consumption
                  });
                  inventorySuccessCount++;
                }
              } catch (materialError: unknown) {
                console.error(`Error processing material ${component.material_id}:`, materialError);
                inventoryErrorCount++;
              }
            }
          }
            // Step 2: Create job card consumption records for accurate reversal
          console.log("Creating job card consumption records...");
          const consumptionResult = await createJobCardConsumptionBatch(
            jobCardResult.id,
            jobCardResult.job_number || 'New Job',
            selectedOrderId,
            orderNumber,
            components,
            orderDate
          );
          
          console.log(`Material processing complete:`);
          console.log(`- Inventory updates: ${inventorySuccessCount} successful, ${inventoryErrorCount} errors`);
          console.log(`- Consumption records: ${consumptionResult.successCount} successful, ${consumptionResult.errorCount} errors`);
          
          // Show toast with comprehensive summary
          if (inventorySuccessCount > 0 && consumptionResult.successCount > 0) {
            toast({
              title: "Job card created successfully",
              description: `Material consumption recorded for ${Math.min(inventorySuccessCount, consumptionResult.successCount)} materials`,
            });
          } else if (inventorySuccessCount > 0 || consumptionResult.successCount > 0) {
            toast({
              title: "Job card created with warnings",
              description: `Some material consumption records may be incomplete`,
              variant: "destructive",
            });
          } else if (inventoryErrorCount > 0 || consumptionResult.errorCount > 0) {
            toast({
              title: "Warning: Material consumption issues",
              description: `Job card created but failed to process material consumption`,
              variant: "destructive",
            });
          }
        } else {
          console.log("No components found for this order, skipping material consumption");
        }
      } catch (consumptionError: unknown) {
        const errorMessage = consumptionError instanceof Error ? consumptionError.message : "Unknown error";
        console.error("Error processing material consumption:", consumptionError);
        toast({
          title: "Warning: Material consumption issue",
          description: `Job card created but failed to process material consumption: ${errorMessage}`,
          variant: "destructive",
        });
      }
      
      toast({
        title: "Job Card created",
        description: `Job ${jobCardResult.job_number || 'card'} created successfully`,
      });
        navigate(`/production/job-cards/${jobCardResult.id}`);
    } catch (error: unknown) {
      toast({
        title: "Error creating job card",
        description: error instanceof Error ? error.message : "Unknown error occurred",
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
