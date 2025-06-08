
import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

interface BreadcrumbConfig {
  path: string;
  label: string;
  exact?: boolean;
}

// Define breadcrumb routes mapping
const routes: BreadcrumbConfig[] = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/orders", label: "Orders" },
  { path: "/orders/new", label: "New Order" },
  { path: "/production", label: "Production" },
  { path: "/production/job-cards", label: "Job Cards" },
  { path: "/production/job-cards/new", label: "New Job Card" },
  { path: "/production/cutting", label: "Cutting", exact: false },
  { path: "/production/printing", label: "Printing", exact: false },
  { path: "/production/stitching", label: "Stitching", exact: false },
  { path: "/dispatch", label: "Dispatch" },
  { path: "/vendors", label: "Vendors" },
  { path: "/suppliers", label: "Suppliers" },
  { path: "/inventory", label: "Inventory" },
  { path: "/settings", label: "Settings" },  { path: "/companies", label: "Companies" },
  { path: "/sells", label: "Sells" },
  { path: "/sells/create", label: "Create Invoice", exact: false },
  { path: "/sells/invoice", label: "Invoice Details", exact: false },
];

export const BreadcrumbTrail = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  
  // Generate breadcrumb items based on current route
  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join("/")}`;
    
    // Find matching route config
    const route = routes.find(
      route => (route.exact ? route.path === to : to.startsWith(route.path))
    );
    
    // Get label from route config or capitalize pathname
    const label = route?.label || value.charAt(0).toUpperCase() + value.slice(1);
    
    // Check if it's the last item
    const isLast = index === pathnames.length - 1;
    
    return { to, label, isLast };
  });

  // Don't render if we're at the root
  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        
        {breadcrumbs.map((breadcrumb, i) => (
          <React.Fragment key={i}>
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.to}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!breadcrumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
