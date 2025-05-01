
import { RouteObject, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import InventoryLayout from "../pages/Inventory/InventoryLayout";
import CatalogList from "../pages/Inventory/CatalogList";
import CatalogNew from "../pages/Inventory/CatalogNew";
import CatalogOrders from "../pages/Inventory/CatalogOrders";
import StockJournalList from "../pages/Inventory/StockJournalList";
import StockJournalDetail from "../pages/Inventory/StockJournalDetail";
import StockNew from "../pages/Inventory/StockNew";
import StockEdit from "../pages/Inventory/StockEdit";
import ProtectedRoute from "../components/ProtectedRoute";

const inventoryRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            path: "inventory",
            element: <InventoryLayout />,
            children: [
              {
                path: "",
                element: <Navigate to="/inventory/stock/journal/list" replace />
              },
              {
                path: "stock",
                element: <Navigate to="/inventory/stock/journal/list" replace />
              },
              {
                path: "stock/:id",
                element: <StockJournalDetail />
              },
              {
                path: "stock/new",
                element: <StockNew />
              },
              {
                path: "stock/edit/:id",
                element: <StockEdit />
              },
              {
                path: "stock/journal/list",
                element: <StockJournalList />
              },
              {
                path: "stock/journal/:id",
                element: <StockJournalDetail />
              },
              {
                path: "catalog",
                element: <CatalogList />
              },
              {
                path: "catalog/new",
                element: <CatalogNew />
              },
              {
                path: "catalog/edit/:id",
                element: <CatalogNew />
              },
              {
                path: "catalog/:id/orders",
                element: <CatalogOrders />
              }
            ]
          }
        ]
      }
    ]
  }
];

export default inventoryRoutes;
