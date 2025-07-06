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
  Layers,
  Save
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Component, InventoryMaterial } from "@/types/order";
import { getStatusColor, getStatusDisplay } from "@/utils/orderUtils";
import { useCostCalculation } from "@/hooks/order-form/useCostCalculation";
import { CostCalculationDisplay } from "@/components/orders/CostCalculationDisplay";

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  quantity: string | number;
  order_quantity?: string | number;
  product_quantity?: string | number;
  total_quantity?: string | number;
  bag_length: number;
  bag_width: number;
  border_dimension?: number | null;
  order_date: string;
  delivery_date?: string | null;
  status: string;
  rate: number | null;
  special_instructions: string | null;
  created_at: string;
  sales_account_id?: string | null;
  catalog_id?: string | null;
  company_id?: string | null;
  created_by?: string | null;
  updated_at?: string | null;
  // Cost calculation fields
  material_cost?: number | null;
  production_cost?: number | null;
  cutting_charge?: number | null;
  printing_charge?: number | null;
  stitching_charge?: number | null;
  transport_charge?: number | null;
  total_cost?: number | null;
  margin?: number | null;
  calculated_selling_price?: number | null;
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

interface CatalogProduct {
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
  const [costCalculation, setCostCalculation] = useState<{
    materialCost: number;
    cuttingCharge: number;
    printingCharge: number;
    stitchingCharge: number;
    transportCharge: number;
    wastagePercentage?: number;
    wastageCost?: number;
    baseCost?: number;
    gstAmount?: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
    perUnitBaseCost?: number;
    perUnitTransportCost?: number;
    perUnitGstCost?: number;
    perUnitCost?: number;
    productionCost?: number;
  } | null>(null);
  const [catalogProduct, setCatalogProduct] = useState<{name: string} | null>(null);
  
  // Expected completion date editing state
  const [isEditingCompletionDate, setIsEditingCompletionDate] = useState(false);
  const [editedCompletionDate, setEditedCompletionDate] = useState<string>('');
  const [savingCompletionDate, setSavingCompletionDate] = useState(false);
  
  // Cost editing state
  const [isEditingCosts, setIsEditingCosts] = useState(false);
  const [savingCosts, setSavingCosts] = useState(false);
  const [editedCosts, setEditedCosts] = useState<{
    materialCost: number;
    cuttingCharge: number;
    printingCharge: number;
    stitchingCharge: number;
    transportCharge: number;
    wastagePercentage: number;
    wastageCost: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
  } | null>(null);
  
  // Get cost calculation functions
  const { calculateTotalCost, calculateSellingPrice } = useCostCalculation();
  
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
        
        // Add these logs:
        console.log("ORDER DETAIL - Fetched components data:", componentsData);
        console.log("ORDER DETAIL - Components count:", componentsData?.length || 0);
        
        // Convert components data to match our Component type
        const typeSafeComponents: Component[] = (componentsData?.map(comp => ({
          ...comp,
          // Ensure gsm is a string
          gsm: comp.gsm !== null ? String(comp.gsm) : null,
          // Ensure we handle inventory correctly
          inventory: comp.inventory && typeof comp.inventory === 'object' ? 
            comp.inventory as InventoryMaterial : null,
          // Add material rate for cost calculation
          materialRate: comp.inventory && typeof comp.inventory === 'object' 
            ? (comp.inventory as InventoryMaterial).purchase_rate
            : null,
          // Handle component_cost_breakdown properly
          component_cost_breakdown: comp.component_cost_breakdown ? 
            (typeof comp.component_cost_breakdown === 'string' ? 
              JSON.parse(comp.component_cost_breakdown) : 
              comp.component_cost_breakdown) as { material_cost: number; material_rate: number; consumption: number; }
            : { material_cost: 0, material_rate: 0, consumption: 0 }
        })) || []) as Component[];
        
        console.log("ORDER DETAIL - Processed components:", typeSafeComponents);
        
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
              
              // Type guard to ensure material is an object with expected properties
              if (material && typeof material === 'object') {
                // Cast material to InventoryMaterial to access its properties safely
                const typedMaterial = material as unknown as InventoryMaterial;
                
                // Ensure purchase_rate is a number or default to 0
                const purchaseRate = typedMaterial.purchase_rate !== null
                  ? Number(typedMaterial.purchase_rate) 
                  : 0;

                if (materialMap.has(materialId)) {
                  // Update existing material
                  const existing = materialMap.get(materialId)!;
                  existing.total_consumption += consumption;
                  existing.total_cost = existing.total_consumption * (existing.purchase_rate ?? 0);
                } else {
                  // Add new material with safe property access
                  materialMap.set(materialId, {
                    material_id: materialId,
                    material_name: typedMaterial.material_name || 'Unknown Material',
                    color: typedMaterial.color,
                    gsm: typedMaterial.gsm,
                    total_consumption: consumption,
                    unit: typedMaterial.unit || 'meters',
                    purchase_rate: purchaseRate,
                    total_cost: consumption * purchaseRate
                  });
                }
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

        // Fetch catalog product if catalog_id exists
        if (orderData && orderData.catalog_id) {
          const { data: catalogData, error: catalogError } = await supabase
            .from("catalog")
            .select("id, name")
            .eq("id", orderData.catalog_id)
            .single();
            
          if (!catalogError && catalogData) {
            setCatalogProduct({ name: catalogData.name });
          }
        }

        // Calculate the costs using order form logic if order exists
        if (orderData) {
          // Cast to include wastage fields (they may not exist in older orders)
          const orderWithWastage = orderData as typeof orderData & {
            wastage_percentage?: number;
            wastage_cost?: number;
          };
          
          // Set cost calculation using raw values from the database with all required fields
          const orderQuantity = parseInt(orderData.order_quantity?.toString() || orderData.quantity?.toString() || '1');
          setCostCalculation({
            materialCost: orderData.material_cost || 0,
            cuttingCharge: orderData.cutting_charge || 0,
            printingCharge: orderData.printing_charge || 0,
            stitchingCharge: orderData.stitching_charge || 0,
            transportCharge: orderData.transport_charge || 0,
            wastagePercentage: orderWithWastage.wastage_percentage || 5,
            wastageCost: orderWithWastage.wastage_cost || 0,
            baseCost: orderData.total_cost || 0,
            gstAmount: 0,
            totalCost: orderData.total_cost || 0,
            margin: orderData.margin || 0,
            sellingPrice: orderData.calculated_selling_price || 0,
            perUnitBaseCost: (orderData.total_cost || 0) / orderQuantity,
            perUnitTransportCost: (orderData.transport_charge || 0) / orderQuantity,
            perUnitGstCost: 0,
            perUnitCost: (orderData.total_cost || 0) / orderQuantity,
            productionCost: orderData.production_cost || 0
          });
        }
        
      } catch (error: unknown) {
        toast({
          title: "Error fetching order details",
          description: error instanceof Error ? error.message : "An error occurred",
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Cost editing handlers
  const handleCostChange = (type: string, value: number) => {
    if (!editedCosts) return;
    
    setEditedCosts(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleMarginChange = (margin: number) => {
    if (!editedCosts) return;
    
    setEditedCosts(prev => ({
      ...prev,
      margin
    }));
  };

  const handleTotalCostChange = (totalCost: number) => {
    if (!editedCosts) return;
    
    setEditedCosts(prev => ({
      ...prev,
      totalCost
    }));
  };

  const handleSellingPriceChange = (sellingPrice: number) => {
    if (!editedCosts) return;
    
    setEditedCosts(prev => ({
      ...prev,
      sellingPrice
    }));
  };

  const handleWastagePercentageChange = (wastagePercentage: number) => {
    if (!editedCosts) return;
    
    // Calculate new wastage cost based on material cost and new percentage
    const newWastageCost = (editedCosts.materialCost * wastagePercentage) / 100;
    
    // Recalculate total cost with new wastage
    const baseCost = editedCosts.materialCost + editedCosts.cuttingCharge + 
                    editedCosts.printingCharge + editedCosts.stitchingCharge;
    const newTotalCost = baseCost + editedCosts.transportCharge + newWastageCost;
    
    setEditedCosts(prev => ({
      ...prev,
      wastagePercentage,
      wastageCost: newWastageCost,
      totalCost: newTotalCost
    }));
  };

  const handleSaveCosts = async () => {
    if (!order || !editedCosts) return;
    
    setSavingCosts(true);
    try {
      // Use the edited values directly instead of recalculating
      const newTotalCost = editedCosts.totalCost || (editedCosts.materialCost + editedCosts.cuttingCharge + 
                          editedCosts.printingCharge + editedCosts.stitchingCharge + 
                          editedCosts.transportCharge);
      
      const newSellingPrice = editedCosts.sellingPrice || (newTotalCost * (1 + editedCosts.margin / 100));
      
      // Update the order in the database
      const { error } = await supabase
        .from('orders')
        .update({
          material_cost: editedCosts.materialCost,
          cutting_charge: editedCosts.cuttingCharge,
          printing_charge: editedCosts.printingCharge,
          stitching_charge: editedCosts.stitchingCharge,
          transport_charge: editedCosts.transportCharge,
          wastage_percentage: editedCosts.wastagePercentage,
          wastage_cost: editedCosts.wastageCost,
          production_cost: editedCosts.cuttingCharge + editedCosts.printingCharge + 
                          editedCosts.stitchingCharge + editedCosts.transportCharge,
          total_cost: newTotalCost,
          margin: editedCosts.margin,
          calculated_selling_price: newSellingPrice,
          rate: newSellingPrice
        })
        .eq('id', order.id);

      if (error) throw error;

      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        material_cost: editedCosts.materialCost,
        cutting_charge: editedCosts.cuttingCharge,
        printing_charge: editedCosts.printingCharge,
        stitching_charge: editedCosts.stitchingCharge,
        transport_charge: editedCosts.transportCharge,
        production_cost: editedCosts.cuttingCharge + editedCosts.printingCharge + 
                        editedCosts.stitchingCharge + editedCosts.transportCharge,
        total_cost: newTotalCost,
        margin: editedCosts.margin,
        calculated_selling_price: newSellingPrice,
        rate: newSellingPrice
      } : null);

      // Update cost calculation state with the new values
      setCostCalculation({
        ...editedCosts,
        totalCost: newTotalCost,
        sellingPrice: newSellingPrice
      });
      setIsEditingCosts(false);
      setEditedCosts(null);

      toast({
        title: "Costs updated successfully",
        description: "Order costs have been saved.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error updating costs",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSavingCosts(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingCosts(false);
    setEditedCosts(null);
  };

  // Expected completion date handlers
  const handleStartEditCompletionDate = () => {
    if (!order) return;
    
    // Use delivery_date field for expected completion date
    setEditedCompletionDate(order.delivery_date || '');
    setIsEditingCompletionDate(true);
  };

  const handleSaveCompletionDate = async () => {
    if (!order) return;
    
    setSavingCompletionDate(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_date: editedCompletionDate || null
        })
        .eq('id', order.id);

      if (error) throw error;

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        delivery_date: editedCompletionDate || null
      } : null);

      setIsEditingCompletionDate(false);
      toast({
        title: "Expected completion date updated",
        description: "The date has been saved successfully.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error updating completion date",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setSavingCompletionDate(false);
    }
  };

  const handleCancelEditCompletionDate = () => {
    setIsEditingCompletionDate(false);
    setEditedCompletionDate('');
  };

  const handleStartEdit = () => {
    if (!costCalculation) return;
    
    setEditedCosts({
      materialCost: costCalculation.materialCost,
      cuttingCharge: costCalculation.cuttingCharge,
      printingCharge: costCalculation.printingCharge,
      stitchingCharge: costCalculation.stitchingCharge,
      transportCharge: costCalculation.transportCharge,
      wastagePercentage: costCalculation.wastagePercentage || 5,
      wastageCost: costCalculation.wastageCost || 0,
      margin: costCalculation.margin,
      sellingPrice: costCalculation.sellingPrice,
      totalCost: costCalculation.totalCost
    });
    setIsEditingCosts(true);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
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

      <div className="grid grid-cols-1 gap-6">
        {/* Order Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={18} />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                <p className="text-lg">{order.company_name}</p>
              </div>
              {catalogProduct && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Catalog Product</h3>
                  <p className="text-lg">{catalogProduct.name}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Date</h3>
                  <p className="text-lg">{formatDate(order.order_date)}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Expected Completion Date</h3>
                    {!isEditingCompletionDate && (
                      <button
                        onClick={handleStartEditCompletionDate}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        {order.delivery_date ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>
                  {isEditingCompletionDate ? (
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={editedCompletionDate}
                        onChange={(e) => setEditedCompletionDate(e.target.value)}
                        className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCompletionDate}
                          disabled={savingCompletionDate}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingCompletionDate ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEditCompletionDate}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg">
                      {order.delivery_date ? 
                        formatDate(order.delivery_date) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Product Quantity</h3>
                  <p className="text-lg">
                    {order.product_quantity !== undefined && order.product_quantity !== null 
                      ? Number(order.product_quantity).toLocaleString() 
                      : 1} units/product
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Quantity</h3>
                  <p className="text-lg">{Number(order.order_quantity || order.quantity).toLocaleString()} products</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Quantity</h3>
                  <p className="text-lg">
                    {order.total_quantity !== undefined && order.total_quantity !== null 
                      ? Number(order.total_quantity).toLocaleString() 
                      : Number(order.quantity).toLocaleString()} units
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Bag Size</h3>
                  <p className="text-lg">{order.bag_length} × {order.bag_width} inches</p>
                </div>
                {order.border_dimension && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Border Dimension</h3>
                    <p className="text-lg">{order.border_dimension} inches</p>
                  </div>
                )}
              </div>
              {order.rate && (
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Selling Price</h3>
                    <p className="text-lg">{formatCurrency(order.rate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Rate per Piece</h3>
                    <p className="text-lg font-medium text-primary">
                      {formatCurrency(order.rate / parseInt(order?.order_quantity?.toString() || order?.quantity?.toString() || '1'))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on quantity: {parseInt(order?.order_quantity?.toString() || order?.quantity?.toString() || '1')} pieces
                    </p>
                  </div>
                </div>
              )}
              {order.special_instructions && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Special Instructions</h3>
                  <p className="text-lg whitespace-pre-line">{order.special_instructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

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
              <p className="text-muted-foreground mb-2">No components found for this order</p>
              <p className="text-sm text-red-500">
                If you just created this order and added components, please try refreshing the page.
                If the issue persists, check the browser console for any errors.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Material Summary Table */}
      {materialSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers size={18} />
              Material Consumption
            </CardTitle>
            <CardDescription>Summary of all materials used in this order</CardDescription>
          </CardHeader>
          <CardContent>
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
                      <TableCell className="font-medium">
                        {material.material_name}
                      </TableCell>
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
          </CardContent>
        </Card>
      )}

      {/* Job Cards Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} />
              Job Cards
            </CardTitle>
            <Button asChild>
              <Link to={`/production/job-cards/new?orderId=${id}`}>
                <Plus size={16} className="mr-1" />
                Create Job Card
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobCards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex flex-col items-center justify-center py-12">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Calculation Display */}
      {costCalculation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator size={18} />
                Cost Calculation
              </CardTitle>
              {!isEditingCosts ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleStartEdit}
                  className="gap-2"
                >
                  <Pencil size={14} />
                  Edit Costs
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={savingCosts}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSaveCosts}
                    disabled={savingCosts}
                    className="gap-2"
                  >
                    <Save size={14} />
                    {savingCosts ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CostCalculationDisplay 
              costCalculation={isEditingCosts && editedCosts ? {
                ...costCalculation!,
                ...editedCosts
              } : costCalculation!}
              onMarginChange={isEditingCosts ? handleMarginChange : undefined}
              onCostChange={isEditingCosts ? handleCostChange : undefined}
              onTotalCostChange={isEditingCosts ? handleTotalCostChange : undefined}
              onSellingPriceChange={isEditingCosts ? handleSellingPriceChange : undefined}
              onWastagePercentageChange={isEditingCosts ? handleWastagePercentageChange : undefined}
              orderQuantity={parseInt(order?.order_quantity?.toString() || order?.quantity?.toString() || '1')}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetail;
