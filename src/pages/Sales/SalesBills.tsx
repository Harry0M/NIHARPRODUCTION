
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye } from 'lucide-react';
import { useSalesBills } from '@/hooks/use-sales-bills';
import { LoadingSpinner } from '@/components/production/LoadingSpinner';

const SalesBills = () => {
  const { salesBills, loading } = useSalesBills();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'partial': return 'bg-orange-500';
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Bills</h1>
          <p className="text-muted-foreground">Manage your sales bills and invoices</p>
        </div>
        <Link to="/sales/bills/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Sales Bill
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {salesBills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No sales bills found</p>
              <Link to="/sales/bills/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Sales Bill
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          salesBills.map((bill) => (
            <Card key={bill.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {bill.bill_number}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {bill.company_name} • {bill.catalog_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status}
                    </Badge>
                    <Badge className={getPaymentStatusColor(bill.payment_status)}>
                      {bill.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="font-medium">{bill.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rate</p>
                    <p className="font-medium">₹{bill.rate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium text-green-600">₹{bill.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bill Date</p>
                    <p className="font-medium">{new Date(bill.bill_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    GST: {bill.gst_percentage}% • Transport: ₹{bill.transport_charge}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/sales/bills/${bill.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesBills;
