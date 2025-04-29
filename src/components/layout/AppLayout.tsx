
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavigation from "./MobileNavigation";
import { BreadcrumbTrail } from "@/components/navigation/BreadcrumbTrail";
import { useQueryClient } from "@tanstack/react-query";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Prefetch common data to improve user experience
  const prefetchData = async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ['inventory'],
        queryFn: () => Promise.resolve([])
      });
    } catch (error) {
      console.error("Error prefetching data:", error);
    }
  };

  return (
    <div className="flex min-h-screen max-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50">
      {!isMobile && <Sidebar />}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto max-w-7xl p-4 md:p-6">
            <BreadcrumbTrail />
            <Outlet />
          </div>
        </main>
        {isMobile && <MobileNavigation />}
      </div>
    </div>
  );
};

export default AppLayout;
