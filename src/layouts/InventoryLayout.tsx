
import { Outlet } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

interface LayoutProps {
  children?: React.ReactNode;
}

export const InventoryLayout = ({ children }: LayoutProps) => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {children || <Outlet />}
      </div>
    </AppLayout>
  );
};
