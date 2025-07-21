
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

interface ExistingJobCard {
  id: string;
  job_name: string;
  job_number: string;
  status: string;
  created_at: string;
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
  const [existingJobCards, setExistingJobCards] = useState<ExistingJobCard[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const pageSize = 50;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      
      // Build the query with search filter
      let query = supabase
        .from("orders")
        .select("id, order_number, company_name, quantity, bag_length, bag_width, status", { count: 'exact' });
      
      // Apply search filter if search term exists
      if (debouncedSearchTerm.trim()) {
        query = query.or(`order_number.ilike.%${debouncedSearchTerm}%,company_name.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Apply pagination and ordering
      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      
      const { data, error, count } = await query;
        
      if (error) throw error;
      
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error: unknown) {
      toast({
        title: "Error fetching orders",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearchTerm, fetchOrders]);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to first page when search term changes
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage]);

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  const fetchSelectedOrder = useCallback(async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, company_name, quantity, bag_length, bag_width, status")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedOrder(data);
        setJobName(`${data.company_name} - ${data.order_number}`);
        checkExistingJobCards(orderId);
      }
    } catch (error) {
      console.error("Error fetching selected order:", error);
      setSelectedOrderId("");
    }
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      setSelectedOrder(order || null);
      
      if (order) {
        setJobName(`${order.company_name} - ${order.order_number}`);
        checkExistingJobCards(selectedOrderId);
      } else {
        // If selected order is not in current page, fetch it specifically
        if (selectedOrderId) {
          fetchSelectedOrder(selectedOrderId);
        }
      }
    } else {
      setSelectedOrder(null);
      setJobName("");
      setExistingJobCards([]);
      setShowDuplicateWarning(false);
    }
  }, [selectedOrderId, orders, fetchSelectedOrder]);

  const checkExistingJobCards = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("job_cards")
        .select("id, job_name, job_number, status, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error checking existing job cards:", error);
        return;
      }

      setExistingJobCards(data || []);
      setShowDuplicateWarning((data || []).length > 0);
    } catch (error) {
      console.error("Error checking existing job cards:", error);
    }
  };

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

    // Check for existing job cards and show confirmation if duplicates exist
    if (existingJobCards.length > 0 && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    await createJobCard();
  };

  const createJobCard = async () => {
    setSubmitting(true);
    setShowConfirmDialog(false);
    
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
    } finally {
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
        {/* Search Input - Only show when no order is selected */}
        {!selectedOrder && (
          <div className="space-y-2">
            <Label htmlFor="search">Search Orders</Label>
            <Input
              id="search"
              placeholder="Search by order number or company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{selectedOrder ? "Selected Order" : "Select Order"}</CardTitle>
            <CardDescription>
              {selectedOrder 
                ? `Order ${selectedOrder.order_number} - ${selectedOrder.company_name}` 
                : `Choose an order to create a job card for ${loading ? "" : ` (${totalCount} total orders${debouncedSearchTerm ? ` matching "${debouncedSearchTerm}"` : ""})`}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedOrder ? (
              /* Show selected order with change option */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">Selected Order: {selectedOrder.order_number}</h3>
                    <p className="text-sm text-muted-foreground">{selectedOrder.company_name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrderId("");
                      setSelectedOrder(null);
                    }}
                  >
                    Change Order
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orders Table */}
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">No orders found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {debouncedSearchTerm ? "Try adjusting your search terms" : "Create an order first to generate a job card"}
                    </p>
                    {!debouncedSearchTerm && (
                      <Button 
                        className="mt-4" 
                        onClick={() => navigate("/orders/new")}
                      >
                        Create Order
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Bag Size</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow 
                              key={order.id}
                              className={selectedOrderId === order.id ? "bg-muted" : ""}
                            >
                              <TableCell className="font-medium">{order.order_number}</TableCell>
                              <TableCell>{order.company_name}</TableCell>
                              <TableCell>{order.quantity.toLocaleString()} bags</TableCell>
                              <TableCell>{order.bag_length} × {order.bag_width} inches</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {order.status.replace('_', ' ')}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={selectedOrderId === order.id ? "default" : "outline"}
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    setSelectedOrder(order);
                                  }}
                                >
                                  {selectedOrderId === order.id ? "Selected" : "Select"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {startRecord} to {endRecord} of {totalCount} orders
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        
                        {/* Page numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageSelect(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Order Details */}
        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Order Details</CardTitle>
              <CardDescription>
                Order {selectedOrder.order_number} - {selectedOrder.company_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {showDuplicateWarning && existingJobCards.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">
                  ⚠️ Warning: Job card(s) already exist for this order
                </p>
                <p className="text-sm">
                  Creating duplicate job cards will cause additional inventory transactions and material consumption. 
                  This may lead to inventory discrepancies.
                </p>
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2">Existing job cards for this order:</p>
                  <div className="space-y-1">
                    {existingJobCards.map((jobCard) => (
                      <div key={jobCard.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                        <div>
                          <span className="font-medium">{jobCard.job_number || jobCard.job_name}</span>
                          <span className="ml-2 text-gray-600">({jobCard.status})</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(jobCard.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/production/job-cards/${existingJobCards[0].id}`)}
                  >
                    View Existing Job Card
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/production/job-cards")}
                  >
                    View All Job Cards
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

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

      {/* Confirmation Dialog for Duplicate Job Cards */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Duplicate Job Card Warning
              </CardTitle>
              <CardDescription>
                You are about to create a duplicate job card for this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> Creating duplicate job cards will:
                </p>
                <ul className="mt-2 text-sm text-orange-700 space-y-1">
                  <li>• Consume additional inventory materials</li>
                  <li>• Create duplicate inventory transactions</li>
                  <li>• Potentially cause inventory discrepancies</li>
                  <li>• Complicate production tracking</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Existing job cards:</p>
                {existingJobCards.map((jobCard) => (
                  <div key={jobCard.id} className="text-sm p-2 bg-gray-50 rounded border">
                    <div className="font-medium">{jobCard.job_number || jobCard.job_name}</div>
                    <div className="text-gray-600">Status: {jobCard.status}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    navigate(`/production/job-cards/${existingJobCards[0].id}`);
                  }}
                  disabled={submitting}
                >
                  View Existing
                </Button>
                <Button
                  type="button"
                  onClick={createJobCard}
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {submitting ? "Creating..." : "Create Anyway"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JobCardNew;
