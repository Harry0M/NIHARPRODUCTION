import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, formatQuantity, formatAnalysisDate, calculatePercentageChange } from "@/utils/analysisUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, TrendingUp, TrendingDown, CalendarRange, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MaterialConsumption = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateRange | undefined>(undefined);
  const { consumptionData, isLoading } = useInventoryAnalytics();
  
  // Update the filtering logic for consumptionData to safely handle non-array values
  const filteredData = useMemo(() => {
    if (!Array.isArray(consumptionData)) {
      return [];
    }
    
    return consumptionData.filter(item => {
      // Apply search filter
      const matchesSearch = searchQuery === '' || 
        (item.material_name && item.material_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply date range filter if specified
      let matchesDateRange = true;
      if (dateFilter.startDate && dateFilter.endDate) {
        // Check if usage date is within range
        const firstUsageDate = item.first_usage_date ? new Date(item.first_usage_date) : null;
        const lastUsageDate = item.last_usage_date ? new Date(item.last_usage_date) : null;
        
        // Material must have been used during this period
        // Check if date ranges overlap
        if (firstUsageDate && lastUsageDate) {
          matchesDateRange = 
            (firstUsageDate <= dateFilter.endDate && lastUsageDate >= dateFilter.startDate);
        } else {
          matchesDateRange = false; // No dates available
        }
      }
      
      return matchesSearch && matchesDateRange;
    });
  }, [consumptionData, searchQuery, dateFilter]);
  
  // Calculate total consumption
  const totalConsumption = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.total_usage || 0), 0);
  }, [filteredData]);
  
  // Calculate total value of consumed materials
  const totalValue = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (item.total_value || 0), 0);
  }, [filteredData]);
  
  // Prepare data for chart visualization (top 5 by usage)
  const topMaterialsByUsage = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => (b.total_usage || 0) - (a.total_usage || 0))
      .slice(0, 5);
  }, [filteredData]);
  
  // Calculate percentage change in consumption (example)
  const percentageChange = useMemo(() => {
    if (consumptionData && consumptionData.length > 1) {
      const current = totalConsumption;
      const previous = consumptionData.slice(0, -1).reduce((sum, item) => sum + (item.total_usage || 0), 0);
      return calculatePercentageChange(current, previous);
    }
    return 0;
  }, [consumptionData, totalConsumption]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/analysis')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Material Consumption Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze material consumption patterns over time
        </p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-[200px]">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !dateFilter?.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateFilter?.startDate ? (
                      dateFilter.endDate ? (
                        `${formatAnalysisDate(dateFilter.startDate)} - ${formatAnalysisDate(dateFilter.endDate)}`
                      ) : (
                        formatAnalysisDate(dateFilter.startDate)
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateFilter?.startDate}
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    numberOfMonths={2}
                    pagedNavigation
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatQuantity(totalConsumption, 'units')}</div>
            <p className="text-xs text-muted-foreground">Total materials consumed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total value of consumed materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {percentageChange > 0 ? (
                <TrendingUp className="inline-block h-5 w-5 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="inline-block h-5 w-5 text-red-500 mr-2" />
              )}
              {percentageChange.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Change from previous period
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Materials by Usage
          </CardTitle>
          <CardDescription>Materials with highest consumption</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          {topMaterialsByUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topMaterialsByUsage}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
              >
                <XAxis dataKey="material_name" />
                <YAxis />
                <Tooltip formatter={(value) => [formatQuantity(value as number, 'units'), 'Usage']} />
                <Legend />
                <Bar dataKey="total_usage" name="Usage">
                  {topMaterialsByUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8" />
                <h3 className="mt-2">No material consumption data available</h3>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Consumption Details</CardTitle>
          <CardDescription>Detailed consumption breakdown of all materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left font-medium">Material</th>
                  <th className="py-2 px-4 text-left font-medium">Unit</th>
                  <th className="py-2 px-4 text-right font-medium">Total Usage</th>
                  <th className="py-2 px-4 text-right font-medium">Total Value</th>
                  <th className="py-2 px-4 text-center font-medium">Orders Count</th>
                  <th className="py-2 px-4 text-center font-medium">First Usage</th>
                  <th className="py-2 px-4 text-center font-medium">Last Usage</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.material_id} className="border-b">
                      <td className="py-2 px-4 text-left font-medium">{item.material_name}</td>
                      <td className="py-2 px-4 text-left">{item.unit}</td>
                      <td className="py-2 px-4 text-right">{formatQuantity(item.total_usage, item.unit)}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(item.total_value)}</td>
                      <td className="py-2 px-4 text-center">{item.orders_count}</td>
                      <td className="py-2 px-4 text-center">
                        {item.first_usage_date ? formatAnalysisDate(new Date(item.first_usage_date)) : '-'}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {item.last_usage_date ? formatAnalysisDate(new Date(item.last_usage_date)) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground">
                      No material consumption data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialConsumption;
