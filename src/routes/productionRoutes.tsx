
import { RouteObject } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProductionDashboard from "../pages/Production/ProductionDashboard";
import CuttingJob from "../pages/Production/CuttingJob";
import PrintingJob from "../pages/Production/PrintingJob";
import StitchingJob from "../pages/Production/StitchingJob";
import JobCardList from "../pages/Production/JobCardList";
import JobCardNew from "../pages/Production/JobCardNew";
import JobCardDetail from "../pages/Production/JobCardDetail";
import Dispatch from "../pages/Production/Dispatch";
import DispatchDetail from "../pages/Production/DispatchDetail";
import ProtectedRoute from "../components/ProtectedRoute";

const productionRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            path: "production",
            element: <ProductionDashboard />
          },
          {
            path: "production/job-cards",
            element: <JobCardList />
          },
          {
            path: "production/job-cards/new",
            element: <JobCardNew />
          },
          {
            path: "production/job-cards/:id",
            element: <JobCardDetail />
          },
          {
            path: "production/cutting/:id",
            element: <CuttingJob />
          },
          {
            path: "production/printing/:id",
            element: <PrintingJob />
          },
          {
            path: "production/stitching/:id",
            element: <StitchingJob />
          },
          {
            path: "dispatch",
            element: <Dispatch />
          },
          {
            path: "dispatch/:id",
            element: <DispatchDetail />
          }
        ]
      }
    ]
  }
];

export default productionRoutes;
