
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigation from "./MobileNavigation";

const AppLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {!isMobile && <Sidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
