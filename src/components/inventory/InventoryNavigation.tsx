import { useLocation, Link } from "react-router-dom";
import { Package, Layers, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const InventoryNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    {
      name: "Stock",
      path: "/inventory/stock",
      icon: Package,
    },
    {
      name: "Catalog",
      path: "/inventory/catalog",
      icon: Layers,
    },
    {
      name: "Purchases",
      path: "/inventory/purchases",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-3 gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className="block"
            >
              <Button
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "w-full h-full py-6 justify-start",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex flex-col items-center justify-center w-full">
                  <item.icon className="h-6 w-6 mb-2" />
                  <span>{item.name}</span>
                </div>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryNavigation;
