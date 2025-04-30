
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, ArrowLeft } from "lucide-react";

const StockJournalList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Filter inventory based on search term and filter type
  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = 
      item.material_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.gsm && item.gsm.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (filterType === "all") return matchesSearch;
    if (filterType === "tracked") return matchesSearch && item.track_cost;
    if (filterType === "untracked") return matchesSearch && !item.track_cost;
    if (filterType === "low") return matchesSearch && item.reorder_level && item.quantity <= item.reorder_level;
    
    return matchesSearch;
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle>Stock Journal</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => navigate('/inventory/stock')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stock
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 mt-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              className="pl-8 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Materials</SelectItem>
              <SelectItem value="tracked">Cost Tracked</SelectItem>
              <SelectItem value="untracked">Not Tracked</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInventory?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No inventory items found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>GSM</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Primary Unit</TableHead>
                  <TableHead>Alt. Unit</TableHead>
                  <TableHead>Cost Tracking</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory?.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => navigate(`/inventory/stock/journal/${item.id}`)}
                  >
                    <TableCell className="font-medium text-primary hover:underline">
                      {item.material_type}
                    </TableCell>
                    <TableCell>{item.color || '—'}</TableCell>
                    <TableCell>{item.gsm || '—'}</TableCell>
                    <TableCell>
                      {item.quantity}
                      {item.reorder_level && item.quantity <= item.reorder_level && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Low
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      {item.alternate_unit ? (
                        <span className="flex items-center">
                          {item.alternate_unit}
                          <span className="text-xs text-muted-foreground ml-1">
                            (1:{item.conversion_rate})
                          </span>
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {item.track_cost ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.reorder_level && item.quantity <= item.reorder_level ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Reorder
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockJournalList;
