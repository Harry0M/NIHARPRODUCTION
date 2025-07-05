import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar, Edit } from "lucide-react";
import { format } from "date-fns";

interface LastManualEntryProps {
  materialId?: string;
}

interface ManualEntry {
  id: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  transaction_date: string;
  notes: string | null;
  is_manual_entry?: boolean;
  metadata: Record<string, unknown>;
}

export const LastManualEntry = ({ materialId }: LastManualEntryProps) => {
  const { data: lastManualEntry, isLoading } = useQuery({
    queryKey: ["last-manual-entry", materialId],
    queryFn: async () => {
      if (!materialId) return null;

      // Query for the most recent manual transaction for this material using the new is_manual_entry column
      const { data, error } = await supabase
        .from("inventory_transaction_log")
        .select(`
          id,
          transaction_type,
          quantity,
          previous_quantity,
          new_quantity,
          transaction_date,
          notes,
          is_manual_entry,
          metadata
        `)
        .eq("material_id", materialId)
        .eq("is_manual_entry", true)
        .order("transaction_date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error fetching last manual entry:", error);
        return null;
      }

      return data as unknown as ManualEntry;
    },
    enabled: !!materialId,
  });

  if (isLoading) {
    return (
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-blue-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lastManualEntry) {
    return (
      <Card className="mb-4 bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <History className="h-4 w-4" />
            <span className="text-sm">No manual entries found for this material</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositiveChange = lastManualEntry.new_quantity > lastManualEntry.previous_quantity;
  const changeAmount = Math.abs(lastManualEntry.new_quantity - lastManualEntry.previous_quantity);
  const metadata = lastManualEntry.metadata || {};
  const unit = typeof metadata.unit === 'string' ? metadata.unit : 'units';
  const updateSource = typeof metadata.update_source === 'string' ? metadata.update_source : null;
  
  // For manual stock adjustments, show the actual entered amount
  const isStockAdjustment = lastManualEntry.transaction_type === 'manual-stock-adjustment';
  const displayQuantity = isStockAdjustment ? lastManualEntry.quantity : changeAmount;

  return (
    <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Edit className="h-4 w-4 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white border-blue-300 text-blue-700">
                  <User className="h-3 w-3 mr-1" />
                  Last Manual Entry
                </Badge>
                {isStockAdjustment ? (
                  <Badge 
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Set to {displayQuantity.toFixed(2)} {unit}
                  </Badge>
                ) : (
                  <Badge 
                    variant={isPositiveChange ? "default" : "secondary"}
                    className={isPositiveChange ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {isPositiveChange ? "+" : "-"}{displayQuantity.toFixed(2)} {unit}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Stock Changed:</span>
                  <span className="ml-2">
                    {lastManualEntry.previous_quantity.toFixed(2)} → 
                    <span className={`font-semibold ml-1 ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                      {lastManualEntry.new_quantity.toFixed(2)}
                    </span>
                  </span>
                  {unit && <span className="text-gray-500 ml-1">{unit}</span>}
                </div>
                
                {isStockAdjustment && (
                  <div className="text-sm text-blue-600">
                    <span className="font-medium">Manually Set To:</span>
                    <span className="ml-2 font-bold">{displayQuantity.toFixed(2)} {unit}</span>
                  </div>
                )}
                
                {lastManualEntry.notes && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Note:</span>
                    <span className="ml-2">{lastManualEntry.notes}</span>
                  </div>
                )}
                
                {updateSource && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Source:</span>
                    <span className="ml-2 capitalize">{updateSource.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(lastManualEntry.transaction_date), "MMM dd, yyyy 'at' h:mm a")}
            </div>
            <div className="mt-1">
              {lastManualEntry.transaction_type.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LastManualEntry;
