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
  Calculator,
  Layers
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Component } from "@/types/order";
import { getStatusColor, getStatusDisplay } from "@/utils/orderUtils";

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
  sales_account_id?: string | null;
}

interface JobCard {
  id: string;
  order_id: string;
  job_name: string;
  status: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface MaterialSummary {
  material_id: string;
  material_name: string;
  color: string | null;
  gsm: string | null;
  total_consumption: number;
  unit: string;
  purchase_rate: number | null;
  total_cost: number;
}

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [materialSummary, setMaterialSummary] = useState<MaterialSummary[]>([]);
  const [totalMaterialCost, setTotalMaterialCost] = useState<number>(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  
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
        
        // Fetch order components with material data
        const { data: componentsData, error: componentsError } = await supabase
          .from("order_components")
          .select(`
            *,
            inventory:material_id (
              id,
              material_name,
              unit,
              color,
              gsm,
              purchase_rate
            )
          `)
          .eq("order_id", id);
          
        if (componentsError) throw componentsError;
        
        // Convert components data to match our Component type
        const typeSafeComponents: Component[] = componentsData?.map(comp => ({
          ...comp,
          // Ensure gsm is a string
          gsm: comp.gsm !== null ? String(comp.gsm) : null,
          // Ensure we handle inventory correctly
          inventory: comp.inventory && typeof comp.inventory === 'object' ? comp.inventory : null
        })) || [];
        
        setComponents(typeSafeComponents);

        // Calculate material summary - group by material_id
        if (componentsData && componentsData.length > 0) {
          const materialMap = new Map<string, MaterialSummary>();
          let totalCost = 0;

          componentsData.forEach(comp => {
            // Only process components with valid material_id, inventory, and consumption
            if (comp.material_id && comp.inventory && typeof comp.inventory === 'object' && comp.consumption) {
              const materialId = comp.material_id;
              const consumption = typeof comp.consumption === 'string' 
                ? parseFloat(comp.consumption) 
                : Number(comp.consumption);
                
              const material = comp.inventory;
              // Ensure purchase_rate is a number or default to 0
              const purchaseRate = material && 'purchase_rate' in material ? 
                (material.purchase_rate ? Number(material.purchase_rate) : 0) : 0;

              if (materialMap.has(materialId)) {
                // Update existing material
                const existing = materialMap.get(materialId)!;
                existing.total_consumption += consumption;
                existing.total_cost = existing.total_consumption * (existing.purchase_rate ?? 0);
              } else if (material) {
                // Add new material - ensure material is not null
                materialMap.set(materialId, {
                  material_id: materialId,
                  material_name: material.material_name || 'Unknown Material',
                  color: material.color,
                  gsm: material.gsm,
                  total_consumption: consumption,
                  unit: material.unit || 'meters',
                  purchase_rate: purchaseRate,
                  total_cost: consumption * purchaseRate
                });
              }
            }
          });

          const summaries = Array.from(materialMap.values());
          
          // Calculate total cost
          totalCost = summaries.reduce((sum, item) => sum + item.total_cost, 0);
          
          setMaterialSummary(summaries);
          setTotalMaterialCost(totalCost);
        }
        
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
    
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('status', 'active');

      if (!error && data) {
        setCompanies(data);
      }
    };
    
    fetchOrderData();
    fetchCompanies();
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="details">Order Details</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 pt-4">
          {/* Order Information Card */}
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
                {order.sales_account_id && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Sales Account</h3>
                    <p className="text-lg">
                      {companies.find(c => c.id === order.sales_account_id)?.name || 'Unknown Account'}
                    </p>
                  </div>
                )}
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

          {/* Component List Card */}
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
                        <TableHead>Material</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>GSM</TableHead>
                        <TableHead>Consumption</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {components.map((component) => (
                        <TableRow key={component.id}>
                          <TableCell className="font-medium">
                            {component.component_type === 'custom' && component.custom_name 
                              ? component.custom_name 
                              : getComponentTypeDisplay(component.component_type)}
                          </TableCell>
                          <TableCell>{component.size || "-"}</TableCell>
                          <TableCell>
                            {component.inventory?.material_name || "-"}
                          </TableCell>
                          <TableCell>{component.color || "-"}</TableCell>
                          <TableCell>{component.gsm || "-"}</TableCell>
                          <TableCell>
                            {component.consumption 
                              ? `${parseFloat(component.consumption.toString()).toFixed(2)} ${component.inventory?.unit || 'units'}`
                              : "-"}
                          </TableCell>
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

          {/* Material Consumption Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator size={18} />
                Material Consumption Summary
              </CardTitle>
              <CardDescription>Total materials consumed and cost calculation</CardDescription>
            </CardHeader>
            <CardContent>
              {materialSummary.length > 0 ? (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Specifications</TableHead>
                          <TableHead>Consumption</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialSummary.map((material) => (
                          <TableRow key={material.material_id}>
                            <TableCell className="font-medium">{material.material_name}</TableCell>
                            <TableCell>
                              {[
                                material.color ? `Color: ${material.color}` : null,
                                material.gsm ? `GSM: ${material.gsm}` : null
                              ].filter(Boolean).join(', ') || '-'}
                            </TableCell>
                            <TableCell>
                              {material.total_consumption.toFixed(2)} {material.unit}
                            </TableCell>
                            <TableCell>
                              {material.purchase_rate 
                                ? formatCurrency(material.purchase_rate) 
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(material.total_cost)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Cost Summary */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between font-medium">
                      <span>Total Material Cost:</span>
                      <span>{formatCurrency(totalMaterialCost)}</span>
                    </div>
                    
                    {order.rate && (
                      <>
                        <div className="flex justify-between mt-2">
                          <span>Total Revenue (Rate × Quantity):</span>
                          <span>{formatCurrency(order.rate * order.quantity)}</span>
                        </div>
                        <div className="flex justify-between mt-2 font-medium">
                          <span>Estimated Gross Profit:</span>
                          <span className={
                            order.rate * order.quantity - totalMaterialCost > 0 
                              ? "text-green-600" 
                              : "text-red-600"
                          }>
                            {formatCurrency(order.rate * order.quantity - totalMaterialCost)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No material consumption data available</p>
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
