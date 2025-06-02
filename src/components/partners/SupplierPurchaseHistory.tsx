import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/dateUtils';
import { ExternalLink, RefreshCw, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/hooks/use-toast';

interface SupplierPurchaseHistoryProps {
  supplierId: string;
}

export const SupplierPurchaseHistory = ({ supplierId }: SupplierPurchaseHistoryProps) => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      
      // Get basic purchase data first
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('purchase_date', { ascending: false });

      if (purchaseError) {
        toast({
          title: "Error fetching purchase history",
          description: "Could not load purchase data. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // If purchases exist, fetch their items
      if (purchaseData && purchaseData.length > 0) {
        const purchasesWithItems = await Promise.all(
          purchaseData.map(async (purchase) => {
            // Get purchase items for this purchase
            const { data: items, error: itemsError } = await supabase
              .from('purchase_items')
              .select('id, material_id, quantity, unit_price, line_total')
              .eq('purchase_id', purchase.id);
              
            if (itemsError) {
              // Silent error - just return empty items array
              return { ...purchase, purchase_items: [] };
            }
            
            return { ...purchase, purchase_items: items || [] };
          })
        );
        
        setPurchases(purchasesWithItems);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading purchase history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPurchaseHistory();
  };

  useEffect(() => {
    if (supplierId) {
      fetchPurchaseHistory();
    }
  }, [supplierId]);

  const viewPurchase = (purchaseId: string) => {
    window.open(`/purchases/${purchaseId}`, '_blank');
  };

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Purchase History</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          All purchases made from this supplier
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : purchases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Purchase #</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => {
                const itemCount = purchase.purchase_items?.length || 0;
                
                return (
                  <TableRow key={purchase.id}>
                    <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                    <TableCell>{purchase.purchase_number || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span>{itemCount}</span>
                        <Badge variant="outline" className="ml-2">
                          {itemCount === 1 ? '1 item' : `${itemCount} items`}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                    <TableCell>{purchase.transport_charge ? formatCurrency(purchase.transport_charge) : '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          purchase.status === 'completed' ? 'default' :
                          purchase.status === 'pending' ? 'secondary' :
                          purchase.status === 'cancelled' ? 'destructive' : 
                          'outline'
                        }
                      >
                        {purchase.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => viewPurchase(purchase.id)}
                        title="View purchase details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6">
            <p className="text-center text-muted-foreground">
              No purchase records found for this supplier
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
