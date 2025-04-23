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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Copy, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const OrderDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();
        
        if (error) throw error;
        
        setOrder(data);
      } catch (error: any) {
        toast({
          title: "Error fetching order",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const copyOrderDetails = () => {
    if (!order) return;

    const orderDetailsText = `
      Order Number: ${order.order_number}
      Company Name: ${order.company_name}
      Quantity: ${order.quantity}
      Bag Length: ${order.bag_length}
      Bag Width: ${order.bag_width}
      Rate: ${order.rate || 'N/A'}
      Special Instructions: ${order.special_instructions || 'N/A'}
    `;

    navigator.clipboard.writeText(orderDetailsText);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  const deleteOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order? This action cannot be undone."
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Order Deleted",
      description: "Order has been deleted successfully.",
    });
    navigate("/orders");
  };

  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found.</div>;
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
          <p className="text-muted-foreground">View and manage order details</p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{order.company_name}</CardTitle>
          <CardDescription>
            Order Number: {order.order_number}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Order Date</Label>
              <Input 
                type="text" 
                value={format(new Date(order.order_date), 'PPP')} 
                readOnly 
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="text" value={order.quantity.toLocaleString()} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Bag Length</Label>
              <Input type="text" value={order.bag_length} readOnly />
            </div>
            <div>
              <Label>Bag Width</Label>
              <Input type="text" value={order.bag_width} readOnly />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Rate</Label>
              <Input type="text" value={order.rate?.toLocaleString() || "N/A"} readOnly />
            </div>
            <div>
              <Label>Status</Label>
              <Input type="text" value={order.status || "Pending"} readOnly />
            </div>
          </div>
          <div>
            <Label>Special Instructions</Label>
            <Textarea value={order.special_instructions || "N/A"} readOnly />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyOrderDetails} disabled={isCopied}>
              {isCopied ? (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Details
                </>
              )}
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate(`/orders/${orderId}/dispatch/new`)}
            >
              Create Dispatch
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
                size="sm"
              onClick={() => navigate(`/orders/edit/${orderId}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteOrder}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrderDetail;
