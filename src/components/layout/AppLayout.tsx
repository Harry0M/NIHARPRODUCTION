
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigation from "./MobileNavigation";

const AppLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen max-h-screen overflow-hidden bg-gray-100">
      {!isMobile && <Sidebar />}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto max-w-7xl p-4 md:p-6">
            <Outlet />
          </div>
        </main>
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
