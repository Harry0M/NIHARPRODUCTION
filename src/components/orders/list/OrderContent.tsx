
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Order } from "@/types/order";
import { OrderTable } from "./OrderTable";
import { OrderCard } from "./OrderCard";
import { EmptyOrdersState } from "./EmptyOrdersState";
import { OrderFilter, OrderFilters } from "@/components/orders/OrderFilter";

interface OrderContentProps {
  orders: Order[];
  loading: boolean;
  filters: OrderFilters;
  setFilters: React.Dispatch<React.SetStateAction<OrderFilters>>;
  onDeleteClick: (orderId: string) => void;
}

export const OrderContent = ({ 
  orders, 
  loading, 
  filters, 
  setFilters, 
  onDeleteClick 
}: OrderContentProps) => {
  const isMobile = useIsMobile();
  const hasFilters = filters.searchTerm !== "" || filters.status !== "all" || filters.dateRange.from !== "" || filters.dateRange.to !== "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <CardDescription>A list of all your bag manufacturing orders</CardDescription>
      </CardHeader>
      <CardContent>
        <OrderFilter filters={filters} setFilters={setFilters} />

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrdersState hasFilters={hasFilters} />
        ) : (
          <>
            {isMobile ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onDeleteClick={onDeleteClick}
                  />
                ))}
              </div>
            ) : (
              <OrderTable
                orders={orders}
                onDeleteClick={onDeleteClick}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
