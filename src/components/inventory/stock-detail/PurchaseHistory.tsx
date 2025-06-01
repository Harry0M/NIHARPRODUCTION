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
import { ExternalLink, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface PurchaseHistoryProps {
  materialId: string;
}

export const PurchaseHistory = ({ materialId }: PurchaseHistoryProps) => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      
      // Get purchase items containing this material
      const { data: purchaseItems, error: itemsError } = await supabase
        .from('purchase_items')
        .select(`
          id,
          purchase_id,
          quantity, 
          unit_price,
          line_total,
          created_at,
          purchases (
            id,
            purchase_number,
            purchase_date,
            status,
            transport_charge,
            supplier_id,
            suppliers:supplier_id (
              name
            )
          )
        `)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error("Error fetching purchase history:", itemsError);
        return;
      }

      console.log("Purchase history fetched:", purchaseItems);
      setPurchases(purchaseItems || []);
    } catch (error) {
      console.error("Unexpected error in fetchPurchaseHistory:", error);
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
    if (materialId) {
      fetchPurchaseHistory();
    }
  }, [materialId]);

  // Calculate transport-adjusted unit price
  const calculateTrueUnitPrice = (purchaseItem: any) => {
    if (!purchaseItem.purchases?.transport_charge) {
      return purchaseItem.unit_price;
    }
    
    // Need to fetch all purchase items to calculate total weight
    // For simplicity, we'll just display a badge indicating transport charges were applied
    return purchaseItem.unit_price;
  };

  const viewPurchase = (purchaseId: string) => {
    window.open(`/purchases/${purchaseId}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Purchase History</h3>
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
              <TableHead>Supplier</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Line Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((item) => {
              const purchase = item.purchases;
              const hasTransportCharge = purchase?.transport_charge > 0;
              
              return (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(purchase?.purchase_date)}</TableCell>
                  <TableCell>{purchase?.purchase_number || '—'}</TableCell>
                  <TableCell>{purchase?.suppliers?.name || '—'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatCurrency(item.unit_price)}</span>
                      {hasTransportCharge && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          +Transport
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.line_total)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        purchase?.status === 'completed' ? 'default' :
                        purchase?.status === 'pending' ? 'secondary' :
                        purchase?.status === 'cancelled' ? 'destructive' : 
                        'outline'
                      }
                    >
                      {purchase?.status || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => viewPurchase(purchase?.id)}
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
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">
              No purchase records found for this item
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
