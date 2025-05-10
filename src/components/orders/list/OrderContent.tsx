
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Order } from "@/types/order";
import { OrderTable } from "./OrderTable";
import { OrderCard } from "./OrderCard";
import { EmptyOrdersState } from "./EmptyOrdersState";
import { OrderFilter, OrderFilters } from "@/components/orders/OrderFilter";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { PackageSearch, Package } from "lucide-react";

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
    <Card className="border-border/60 shadow-sm fade-in overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <span className="h-5 w-1 rounded-full bg-primary inline-block"></span>
          All Orders
        </CardTitle>
        <CardDescription className="mt-1">A list of all your bag manufacturing orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4 mb-6 slide-up" style={{animationDelay: '0.1s'}}>
          <OrderFilter filters={filters} setFilters={setFilters} />
        </div>

        {loading ? (
          <div className="slide-up opacity-70" style={{animationDelay: '0.2s'}}>
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 dark:bg-muted/10 rounded-xl slide-up" style={{animationDelay: '0.2s'}}>
            <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
              <PackageSearch className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {hasFilters ? 
                "No orders match your current filters. Try adjusting your filters or clearing them." : 
                "You haven't created any orders yet. Start by creating your first order."}
            </p>
            {hasFilters && (
              <button 
                onClick={() => setFilters({searchTerm: "", status: "all", dateRange: {from: "", to: ""}})} 
                className="text-primary hover:underline inline-flex items-center gap-2 transition-colors"
              >
                <Package className="h-4 w-4" />
                Clear filters and view all orders
              </button>
            )}
          </div>
        ) : (
          <div className="slide-up" style={{animationDelay: '0.2s'}}>
            {isMobile ? (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div className="scale-in" style={{animationDelay: `${0.2 + (index * 0.05)}s`}} key={order.id}>
                    <OrderCard
                      order={order}
                      onDeleteClick={onDeleteClick}
                      isSelected={selectedOrders?.includes(order.id) || false}
                      onSelectChange={(isSelected) => onSelectOrder?.(order.id, isSelected)}
                    />
                  </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
