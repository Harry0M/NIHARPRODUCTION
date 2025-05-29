import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInMonths, parseISO, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

// Types
interface MaterialSupplier {
  id: string;
  material_id: string;
  supplier_id: string;
  last_purchase_date: string;
  purchase_price: number;
  created_at: string;
  supplier: {
    id: string;
    name: string;
  };
  inventory: {
    id: string;
    material_name: string;
    unit: string;
  };
}

interface PurchaseItem {
  id: string;
  purchase_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  purchase: {
    id: string;
    purchase_date: string;
    status: string;
    purchase_number: string;
    supplier_id: string;
    supplier: {
      id: string;
      name: string;
    };
  };
  material: {
    id: string;
    material_name: string;
    unit: string;
  };
}

interface PriceTrendData {
  materialId: string;
  materialName: string;
  unit: string;
  priceHistory: Array<{
    date: string;
    price: number;
    purchaseId: string;
    purchaseNumber: string;
    supplierId: string;
    supplierName: string;
  }>;
  analysis: {
    lowestPrice: number;
    highestPrice: number;
    currentPrice: number;
    averagePrice: number;
    priceChangePercentage: number;
    overallTrend: 'increasing' | 'decreasing' | 'stable';
    monthlyAverage: Array<{
      month: string;
      avgPrice: number;
    }>;
  };
}

// Helper function to calculate monthly average prices
const calculateMonthlyAverages = (priceHistory: PriceTrendData['priceHistory']) => {
  const monthlyPrices: Record<string, number[]> = {};
  
  priceHistory.forEach(item => {
    const monthYear = format(new Date(item.date), 'MMM yyyy');
    if (!monthlyPrices[monthYear]) {
      monthlyPrices[monthYear] = [];
    }
    monthlyPrices[monthYear].push(item.price);
  });
  
  return Object.entries(monthlyPrices).map(([month, prices]) => ({
    month,
    avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length
  })).sort((a, b) => {
    // Sort by date
    const [monthA, yearA] = a.month.split(' ');
    const [monthB, yearB] = b.month.split(' ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateA.getTime() - dateB.getTime();
  });
};

// Helper function to calculate price change percentage
const calculatePriceChangePercentage = (oldPrice: number, newPrice: number) => {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
};

// Helper function to determine price trend
const determineTrend = (priceHistory: PriceTrendData['priceHistory']) => {
  if (priceHistory.length < 2) return 'stable';
  
  // Sort by date
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const firstPrice = sortedHistory[0].price;
  const lastPrice = sortedHistory[sortedHistory.length - 1].price;
  
  if (lastPrice > firstPrice) return 'increasing';
  if (lastPrice < firstPrice) return 'decreasing';
  return 'stable';
};

const PriceTrendAnalysis = () => {
  const navigate = useNavigate();
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("12");
  
  // Fetch all materials
  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['materials-for-price-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, material_name")
        .order("material_name");
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch purchase history data for price trend analysis
  const { data: purchaseData, isLoading: purchaseDataLoading } = useQuery({
    queryKey: ['price-trend-data', selectedMaterial, timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseInt(timeRange));
      
      // Build query based on whether a specific material is selected
      let query = supabase
        .from("purchase_items")
        .select(`
          id,
          purchase_id,
          material_id,
          quantity,
          unit_price,
          created_at,
          purchase:purchases (
            id,
            purchase_date,
            status,
            purchase_number,
            supplier_id,
            supplier:suppliers (
              id,
              name
            )
          ),
          material:inventory (
            id,
            material_name,
            unit
          )
        `)
        .gte('purchase.purchase_date', cutoffDate.toISOString())
        .eq('purchase.status', 'completed');
      
      // If a specific material is selected, filter for it
      if (selectedMaterial) {
        query = query.eq('material_id', selectedMaterial);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PurchaseItem[];
    },
    enabled: timeRange !== null
  });
  
  // Process the raw purchase data into the format needed for analysis
  const processedData: PriceTrendData[] = useMemo(() => {
    if (!purchaseData || purchaseData.length === 0) return [];
    
    // Group by material
    const materialGroups: Record<string, PurchaseItem[]> = {};
    purchaseData.forEach(item => {
      if (!materialGroups[item.material_id]) {
        materialGroups[item.material_id] = [];
      }
      materialGroups[item.material_id].push(item);
    });
    
    // Process each material's price history
    const mappedData = Object.entries(materialGroups).map(([materialId, items]) => {
      // Filter out items with missing purchase data
      const validItems = items.filter(item => item.purchase && item.purchase.purchase_date);
      
      // If no valid items, skip this material
      if (validItems.length === 0) return null;
      
      // Extract price history with null checks
      const priceHistory = validItems.map(item => ({
        date: item.purchase.purchase_date,
        price: item.unit_price,
        purchaseId: item.purchase_id,
        purchaseNumber: item.purchase.purchase_number || 'Unknown',
        supplierId: item.purchase.supplier_id || '',
        supplierName: item.purchase.supplier?.name || 'Unknown Supplier'
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Calculate metrics
      const prices = priceHistory.map(p => p.price);
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const currentPrice = priceHistory[0]?.price || 0;
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // Calculate price change percentage (from oldest to newest)
      const oldestPrice = priceHistory[priceHistory.length - 1]?.price || 0;
      const priceChangePercentage = calculatePriceChangePercentage(oldestPrice, currentPrice);
      
      // Determine overall trend
      const overallTrend = determineTrend(priceHistory);
      
      // Calculate monthly averages
      const monthlyAverage = calculateMonthlyAverages(priceHistory);
      
      return {
        materialId,
        materialName: items[0]?.material?.material_name || 'Unknown Material',
        unit: items[0]?.material?.unit || '',
        priceHistory,
        analysis: {
          lowestPrice,
          highestPrice,
          currentPrice,
          averagePrice,
          priceChangePercentage,
          overallTrend,
          monthlyAverage
        }
      };
    });
    
    // Filter out null entries (materials with no valid purchase data)
    return mappedData.filter(item => item !== null) as PriceTrendData[];
  }, [purchaseData]);
  
  // Get data for the selected material
  const selectedMaterialData = useMemo(() => {
    if (!selectedMaterial) return null;
    return processedData.find(item => item.materialId === selectedMaterial) || null;
  }, [selectedMaterial, processedData]);
  
  // Handle back button click
  const handleBackClick = () => {
    // If a material is selected, just clear the selection to return to material list
    // Otherwise, navigate back to the analysis dashboard
    if (selectedMaterial) {
      setSelectedMaterial(null);
    } else {
      navigate('/analysis');
    }
  };
  
  // Prepare chart data for the selected material
  const chartData = useMemo(() => {
    if (!selectedMaterialData) return [];
    
    // Use actual purchase history for the chart instead of monthly averages
    // This provides more accurate price trends over time
    return selectedMaterialData.priceHistory
      .slice() // Create a copy to avoid mutation
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date ascending
      .map(item => ({
        date: format(new Date(item.date), 'dd MMM yyyy'),
        price: item.price,
        purchaseNumber: item.purchaseNumber
      }));
  }, [selectedMaterialData]);
  
  // Loading state
  if (materialsLoading) {
    return <LoadingSpinner text="Loading price trend data..." />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackClick}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Price Trend Analysis</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Material Selector */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Materials</CardTitle>
            <CardDescription>Select a material to view price trends</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
              {processedData.map(material => (
                <Button
                  key={material.materialId}
                  variant={selectedMaterial === material.materialId ? "default" : "ghost"}
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => setSelectedMaterial(material.materialId)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{material.materialName}</span>
                    <div className="flex items-center mt-1 text-xs">
                      <span className="text-muted-foreground">
                        {formatCurrency(material.analysis.currentPrice)}/{material.unit}
                      </span>
                      
                      {material.analysis.priceChangePercentage !== 0 && (
                        <Badge 
                          className={`ml-2 flex items-center ${
                            material.analysis.priceChangePercentage > 0 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          }`}
                          variant="outline"
                        >
                          {material.analysis.priceChangePercentage > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(material.analysis.priceChangePercentage).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
              
              {processedData.length === 0 && !purchaseDataLoading && (
                <div className="p-4 text-center text-muted-foreground">
                  No price data available for the selected time range
                </div>
              )}
              
              {purchaseDataLoading && (
                <div className="flex justify-center p-4">
                  <LoadingSpinner className="h-6 w-6" text="" fullHeight={false} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Price Trend Details */}
        <div className="md:col-span-4 space-y-6">
          {selectedMaterialData ? (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{selectedMaterialData.materialName}</span>
                    <Badge 
                      className={`${
                        selectedMaterialData.analysis.overallTrend === 'increasing' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                          : selectedMaterialData.analysis.overallTrend === 'decreasing'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                      variant="outline"
                    >
                      {selectedMaterialData.analysis.overallTrend === 'increasing' ? (
                        <><TrendingUp className="h-4 w-4 mr-1" /> Price Increasing</>
                      ) : selectedMaterialData.analysis.overallTrend === 'decreasing' ? (
                        <><TrendingDown className="h-4 w-4 mr-1" /> Price Decreasing</>
                      ) : (
                        <><Minus className="h-4 w-4 mr-1" /> Price Stable</>
                      )}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Price trend analysis over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Price</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedMaterialData.analysis.currentPrice)}/{selectedMaterialData.unit}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Average Price</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedMaterialData.analysis.averagePrice)}/{selectedMaterialData.unit}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Lowest Price</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedMaterialData.analysis.lowestPrice)}/{selectedMaterialData.unit}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Highest Price</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedMaterialData.analysis.highestPrice)}/{selectedMaterialData.unit}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="mt-6">
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Purchase Date', position: 'insideBottomRight', offset: -10 }}
                          />
                          <YAxis 
                            label={{ 
                              value: `Price (${selectedMaterialData.unit})`, 
                              angle: -90, 
                              position: 'insideLeft',
                              offset: -10
                            }}
                          />
                          <RechartsTooltip 
                            formatter={(value: number) => [`${formatCurrency(value)}`, 'Price']}
                            labelFormatter={(label) => `Date: ${label}`}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border border-border p-2 rounded shadow-md">
                                    <p className="font-medium">{data.date}</p>
                                    <p className="text-sm">{`Price: ${formatCurrency(data.price)}/${selectedMaterialData.unit}`}</p>
                                    <p className="text-xs text-muted-foreground">{`Purchase: ${data.purchaseNumber}`}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#8884d8' }}
                            activeDot={{ r: 8, fill: '#8884d8', stroke: '#fff' }}
                            connectNulls
                            name="Price"
                          />
                          <Legend verticalAlign="top" height={36} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Price History Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Price History</CardTitle>
                  <CardDescription>
                    Detailed purchase history showing price changes over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Purchase #</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMaterialData.priceHistory.map((record, index) => {
                        // Calculate price change from previous purchase
                        const previousPrice = selectedMaterialData.priceHistory[index + 1]?.price;
                        const priceChange = previousPrice ? calculatePriceChangePercentage(previousPrice, record.price) : 0;
                        
                        return (
                          <TableRow key={record.purchaseId}>
                            <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{record.purchaseNumber}</TableCell>
                            <TableCell>{record.supplierName}</TableCell>
                            <TableCell>{formatCurrency(record.price)}/{selectedMaterialData.unit}</TableCell>
                            <TableCell>
                              {previousPrice ? (
                                <Badge 
                                  className={`flex items-center ${
                                    priceChange > 0 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                                      : priceChange < 0
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                  }`}
                                  variant="outline"
                                >
                                  {priceChange > 0 ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : priceChange < 0 ? (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Minus className="h-3 w-3 mr-1" />
                                  )}
                                  {priceChange !== 0 ? Math.abs(priceChange).toFixed(2) + '%' : 'No change'}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">First purchase</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {selectedMaterialData.priceHistory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No purchase history available for this material
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-[calc(100vh-240px)] flex items-center justify-center">
              <CardContent className="text-center p-6">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Material</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Choose a material from the list to view its price trend analysis, including historical price changes, averages, and trend visualization.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceTrendAnalysis;
