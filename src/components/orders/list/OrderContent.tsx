
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Order } from "@/types/order";
import { OrderTable } from "./OrderTable";
import { OrderCard } from "./OrderCard";
import { EmptyOrdersState } from "./EmptyOrdersState";
import { OrderFilter, OrderFilters } from "@/components/orders/OrderFilter";
import { SkeletonTable } from "@/components/ui/skeleton-table";

interface OrderContentProps {
  orders: Order[];
  loading: boolean;
  filters: OrderFilters;
  setFilters: React.Dispatch<React.SetStateAction<OrderFilters>>;
  onDeleteClick: (orderId: string) => void;
  selectedOrders?: string[];
  onSelectOrder?: (orderId: string, isSelected: boolean) => void;
  onSelectAllOrders?: (isSelected: boolean) => void;
}

export const OrderContent = ({ 
  orders, 
  loading, 
  filters, 
  setFilters, 
  onDeleteClick,
  selectedOrders,
  onSelectOrder,
  onSelectAllOrders
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
          <SkeletonTable rows={5} columns={6} />
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
                    isSelected={selectedOrders?.includes(order.id) || false}
                    onSelectChange={(isSelected) => onSelectOrder?.(order.id, isSelected)}
                  />
                ))}
              </div>
            ) : (
              <OrderTable
                orders={orders}
                onDeleteClick={onDeleteClick}
                selectedOrders={selectedOrders}
                onSelectOrder={onSelectOrder}
                onSelectAllOrders={onSelectAllOrders}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
