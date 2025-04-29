
import { Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";

const InventoryLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current tab
  let currentTab = 'stock';
  if (location.pathname.includes('catalog')) {
    currentTab = 'catalog';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Manage your stock and product catalog</p>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => navigate(`/inventory/${value}`)}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
};

export default InventoryLayout;
