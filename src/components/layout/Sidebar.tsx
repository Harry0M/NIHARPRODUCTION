
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Building2, 
  Users, 
  TrendingUp, 
  BarChart3,
  Package,
  Clipboard,
  Truck,
  ShoppingCart,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Analysis",
    icon: BarChart3,
    children: [
      { name: "Analysis Dashboard", href: "/dashboard/analysis" },
      { name: "Material Consumption", href: "/dashboard/analysis/material-consumption" },
      { name: "Order Consumption", href: "/dashboard/analysis/order-consumption" },
      { name: "Refill Analysis", href: "/dashboard/analysis/refill" },
      { name: "Wastage Analysis", href: "/dashboard/analysis/wastage" },
      { name: "Transaction History", href: "/dashboard/analysis/transactions" },
      { name: "Inventory Value", href: "/dashboard/analysis/inventory-value" },
      { name: "Partners Analysis", href: "/dashboard/analysis/partners" },
    ],
  },
  {
    name: "Inventory",
    icon: Package,
    children: [
      { name: "Stock Management", href: "/dashboard/inventory" },
      { name: "Product Catalog", href: "/dashboard/catalog" },
    ],
  },
  { name: "Orders", href: "/dashboard/orders", icon: Clipboard },
  { name: "Production", href: "/dashboard/production", icon: Settings },
  {
    name: "Partners",
    icon: Users,
    children: [
      { name: "Companies", href: "/dashboard/companies" },
      { name: "Suppliers", href: "/dashboard/suppliers" },
      { name: "Vendors", href: "/dashboard/vendors" },
      { name: "All Partners", href: "/dashboard/partners" },
    ],
  },
  { name: "Purchases", href: "/dashboard/purchases", icon: ShoppingCart },
];

export const Sidebar = () => {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isActivePath = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  const isSectionActive = (children: any[]) => {
    return children.some(child => isActivePath(child.href));
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">ERP System</h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              if (item.children) {
                const isOpen = openSections.includes(item.name);
                const isActive = isSectionActive(item.children);
                
                return (
                  <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleSection(item.name)}>
                    <CollapsibleTrigger className={cn(
                      "w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors",
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-600"
                    )}>
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={cn(
                            "block px-2 py-1 text-sm rounded-md hover:bg-gray-50 transition-colors",
                            isActivePath(child.href)
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-gray-600"
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors",
                    isActivePath(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
