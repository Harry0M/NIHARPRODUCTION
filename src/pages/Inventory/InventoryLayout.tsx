
import { Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";

const InventoryLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.includes('catalog') ? 'catalog' : 'stock';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Manage your stock and product catalog</p>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => navigate(`/inventory/${value}`)}>
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
};

export default InventoryLayout;
