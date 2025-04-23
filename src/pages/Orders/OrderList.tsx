import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Order = {
  id: string;
  order_number: string;
  company_name: string;
  status: string | null;
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, company_name, status")
        .order("created_at", { ascending: false });
      if (!error) setOrders(data ?? []);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!orders.length) return <div className="p-8">No orders found.</div>;

  return (
    <div className="grid gap-6">
      {orders.map((order) => (
        <Card
          key={order.id}
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => navigate(`/orders/${order.id}`)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Order Number: </span>
                {order.order_number}
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => {e.stopPropagation(); navigate(`/orders/${order.id}`);}}>
                View
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <span className="font-semibold">Company:</span> {order.company_name}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {order.status}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
