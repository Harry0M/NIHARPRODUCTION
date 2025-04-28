
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Order } from "@/types/order";

interface OrderDetailsCollapsibleProps {
  order: Order;
}

export const OrderDetailsCollapsible = ({ order }: OrderDetailsCollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
            aria-expanded={isOpen}
            aria-controls={`details-content-${order.id}`}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-1">
              {isOpen ? "Show Less" : "Show More"}
            </span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent 
        className="space-y-2"
        id={`details-content-${order.id}`}
      >
        <div className="rounded-md bg-muted/50 p-4 mt-2">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Special Instructions:</span>
              <span>{order.special_instructions || "None"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate per Bag:</span>
              <span>{order.rate ? `$${order.rate.toFixed(2)}` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span>{order.rate ? `$${(order.rate * order.quantity).toFixed(2)}` : "N/A"}</span>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
