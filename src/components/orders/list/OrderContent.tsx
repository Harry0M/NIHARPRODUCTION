
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Order } from "@/types/order";
import OrderCard from "./OrderCard";
import OrderTable from "./OrderTable";
import { GridIcon, ListIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface OrderContentProps {
  orders: Order[];
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
  isFiltering: boolean;
}

export function OrderContent({ 
  orders, 
  view, 
  setView, 
  isFiltering 
}: OrderContentProps) {
  return (
    <TabsContent value="all" className="mt-0 border-0 p-0">
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
      
      {orders.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-lg font-semibold">No orders found</h3>
          <p className="text-muted-foreground">
            {isFiltering 
              ? "Try adjusting your filters to see more results." 
              : "Start by creating a new order."}
          </p>
        </div>
      ) : (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <OrderTable orders={orders} />
        )
      )}
    </TabsContent>
  );
}

export default OrderContent;
