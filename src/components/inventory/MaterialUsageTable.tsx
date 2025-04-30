
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, PackageIcon } from "lucide-react";

interface MaterialUsageProps {
  materialId: string;
}

interface OrderUsage {
  order_id: string;
  order_number: string;
  company_name: string;
  created_at: string;
  consumption: number;
  order_date: string;
}

export function MaterialUsageTable({ materialId }: MaterialUsageProps) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['material-transactions', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          quantity,
          transaction_type,
          reference_id,
          created_at,
          notes
        `)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!materialId,
  });

  const { data: orderUsage } = useQuery({
    queryKey: ['material-order-usage', materialId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_components')
        .select(`
          consumption,
          order_id,
          orders (
            order_number,
            company_name,
            created_at,
            order_date
          )
        `)
        .eq('material_id', materialId);
      
      if (error) throw error;
      
      return data?.map(item => ({
        order_id: item.order_id,
        consumption: item.consumption,
        order_number: item.orders?.order_number,
        company_name: item.orders?.company_name,
        created_at: item.orders?.created_at,
        order_date: item.orders?.order_date
      })) || [];
    },
    enabled: !!materialId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Material Usage History</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Usage History</CardTitle>
        <CardDescription>Orders that used this material</CardDescription>
      </CardHeader>
      <CardContent>
        {orderUsage && orderUsage.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Consumption</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderUsage.map((usage) => (
                <TableRow key={usage.order_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PackageIcon className="h-4 w-4 text-muted-foreground" />
                      {usage.order_number}
                    </div>
                  </TableCell>
                  <TableCell>{usage.company_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                      {new Date(usage.order_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {usage.consumption} 
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No usage history found for this material
          </div>
        )}
      </CardContent>
    </Card>
  );
}
