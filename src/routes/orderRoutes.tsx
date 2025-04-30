
import { RouteObject } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import OrderList from "../pages/Orders/OrderList";
import OrderNew from "../pages/Orders/OrderNew";
import OrderDetail from "../pages/Orders/OrderDetail";
import OrderEdit from "../pages/Orders/OrderEdit";
import ProtectedRoute from "../components/ProtectedRoute";

const orderRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            path: "orders",
            element: <OrderList />
          },
          {
            path: "orders/new",
            element: <OrderNew />
          },
          {
            path: "orders/:id",
            element: <OrderDetail />
          },
          {
            path: "orders/:id/edit",
            element: <OrderEdit />
          }
        ]
      }
    ]
  }
];

export default orderRoutes;
