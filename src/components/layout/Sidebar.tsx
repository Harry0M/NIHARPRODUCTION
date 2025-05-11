import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BarChart, File, Home, ListChecks, Package, Users } from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  className?: string;
}

function NavLinkComponent({
  to,
  children,
  isActive,
}: {
  to: string;
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm py-2 px-2.5 rounded-md transition-colors duration-200",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const collapsed = false;
  const className = "";
  const props = {};

  const toggleAccordion = (item: string) => {
    setExpandedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const isPathActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isPathExact = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={cn(
        "fixed top-14 h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:w-52 border-r bg-card p-2 transition-all overflow-y-auto",
        collapsed && "md:w-16",
        className
      )}
      {...props}
    >
      <div className="flex flex-col h-full gap-2">
        <NavLinkComponent to="/dashboard" isActive={isPathExact("/dashboard")}>
          <div className="flex items-center gap-2 my-1 text-sm">
            <Home className="h-4 w-4" />
            {!collapsed && <span>Dashboard</span>}
          </div>
        </NavLinkComponent>

        <Accordion type="multiple" defaultValue={expandedItems}>
          <AccordionItem value="inventory">
            <AccordionTrigger
              onClick={() => toggleAccordion("inventory")}
              className={`h-9 rounded-md px-2 ${
                isPathActive("/inventory") && !collapsed ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 my-1 text-sm">
                <Package className="h-4 w-4" />
                {!collapsed && <span>Inventory</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className={`${collapsed ? "hidden" : ""}`}>
              <div className="flex flex-col gap-1 pl-6">
                <NavLinkComponent to="/inventory" isActive={isPathExact("/inventory")}>
                  Stock List
                </NavLinkComponent>
                <NavLinkComponent to="/inventory/catalog" isActive={isPathActive("/inventory/catalog")}>
                  Catalog
                </NavLinkComponent>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="orders">
            <AccordionTrigger
              onClick={() => toggleAccordion("orders")}
              className={`h-9 rounded-md px-2 ${
                isPathActive("/orders") && !collapsed ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 my-1 text-sm">
                <ListChecks className="h-4 w-4" />
                {!collapsed && <span>Orders</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className={`${collapsed ? "hidden" : ""}`}>
              <div className="flex flex-col gap-1 pl-6">
                <NavLinkComponent to="/orders" isActive={isPathExact("/orders")}>
                  Order List
                </NavLinkComponent>
                <NavLinkComponent to="/orders/new" isActive={isPathActive("/orders/new")}>
                  New Order
                </NavLinkComponent>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="production">
            <AccordionTrigger
              onClick={() => toggleAccordion("production")}
              className={`h-9 rounded-md px-2 ${
                isPathActive("/production") && !collapsed ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 my-1 text-sm">
                <File className="h-4 w-4" />
                {!collapsed && <span>Production</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className={`${collapsed ? "hidden" : ""}`}>
              <div className="flex flex-col gap-1 pl-6">
                <NavLinkComponent to="/production" isActive={isPathExact("/production")}>
                  Dashboard
                </NavLinkComponent>
                <NavLinkComponent to="/production/job-cards" isActive={isPathActive("/production/job-cards")}>
                  Job Cards
                </NavLinkComponent>
                <NavLinkComponent to="/dispatch" isActive={isPathActive("/dispatch")}>
                  Dispatch
                </NavLinkComponent>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="partners">
            <AccordionTrigger
              onClick={() => toggleAccordion("partners")}
              className={`h-9 rounded-md px-2 ${
                isPathActive("/partners") && !collapsed ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 my-1 text-sm">
                <Users className="h-4 w-4" />
                {!collapsed && <span>Partners</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className={`${collapsed ? "hidden" : ""}`}>
              <div className="flex flex-col gap-1 pl-6">
                <NavLinkComponent to="/partners" isActive={isPathExact("/partners")}>
                  Customers
                </NavLinkComponent>
                <NavLinkComponent to="/vendors" isActive={isPathActive("/vendors")}>
                  Vendors
                </NavLinkComponent>
                <NavLinkComponent to="/suppliers" isActive={isPathActive("/suppliers")}>
                  Suppliers
                </NavLinkComponent>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="analysis">
            <AccordionTrigger
              onClick={() => toggleAccordion("analysis")}
              className={`h-9 rounded-md px-2 ${
                isPathActive("/analysis") && !collapsed ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 my-1 text-sm">
                <BarChart className="h-4 w-4" />
                {!collapsed && <span>Analysis</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className={`${collapsed ? "hidden" : ""}`}>
              <div className="flex flex-col gap-1 pl-6">
                <NavLinkComponent to="/analysis" isActive={isPathExact("/analysis")}>
                  Dashboard
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/inventory-value" isActive={isPathActive("/analysis/inventory-value")}>
                  Inventory Value
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/material-consumption" isActive={isPathActive("/analysis/material-consumption")}>
                  Material Usage
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/order-consumption" isActive={isPathActive("/analysis/order-consumption")}>
                  Order Consumption
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/wastage" isActive={isPathActive("/analysis/wastage")}>
                  Wastage Analysis
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/partners" isActive={isPathActive("/analysis/partners")}>
                  Partners
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/refill-analysis" isActive={isPathActive("/analysis/refill-analysis")}>
                  Refill Analysis
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/transaction-history" isActive={isPathActive("/analysis/transaction-history")}>
                  Transaction History
                </NavLinkComponent>
                <NavLinkComponent to="/analysis/partner-performance" isActive={isPathActive("/analysis/partner-performance")}>
                  Partner Performance
                </NavLinkComponent>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="companies">
            <AccordionTrigger
              onClick={() => toggleAccordion("companies")}
              className={`h-9 rounded-md px-2 ${
                isPathActive("/companies") && !collapsed ? "bg-accent" : ""
              }`}
            >
              <div className="flex items-center gap-2 my-1 text-sm">
                <Users className="h-4 w-4" />
                {!collapsed && <span>Companies</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent className={`${collapsed ? "hidden" : ""}`}>
              <div className="flex flex-col gap-1 pl-6">
                <NavLinkComponent to="/companies" isActive={isPathExact("/companies")}>
                  Company List
                </NavLinkComponent>
                <NavLinkComponent to="/companies/new" isActive={isPathActive("/companies/new")}>
                  New Company
                </NavLinkComponent>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}
