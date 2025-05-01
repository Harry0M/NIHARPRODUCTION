
import React from "react";
import { Order } from "@/types/order";
import OrderCard from "./OrderCard";
import OrderTable from "./OrderTable";
import { GridIcon, ListIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { EmptyOrdersState } from "./EmptyOrdersState";

interface OrderContentProps {
  orders: Order[];
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  isFiltering: boolean;
  loading?: boolean;
  onDeleteClick?: (orderId: string) => void;
}

export function OrderContent({ 
  orders, 
  view, 
  setView, 
  isFiltering,
  loading = false,
  onDeleteClick
}: OrderContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <div className="border rounded-md flex">
          <Toggle
            aria-label="Grid view"
            pressed={view === "grid"}
            onPressedChange={() => setView("grid")}
          >
            <GridIcon size={16} />
          </Toggle>
          <Toggle
            aria-label="List view"
            pressed={view === "list"}
            onPressedChange={() => setView("list")}
          >
            <ListIcon size={16} />
          </Toggle>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyOrdersState isFiltering={isFiltering} />
      ) : (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
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
        )
      )}
    </div>
  );
}

export default OrderContent;
