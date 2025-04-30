
import { RouteObject } from "react-router-dom";
import Auth from "../pages/Auth";

const authRoutes: RouteObject[] = [
  {
    path: "/auth",
    element: <Auth />
  }
];

export default authRoutes;
