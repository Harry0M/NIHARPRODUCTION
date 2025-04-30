
import { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";

const notFoundRoute: RouteObject[] = [
  {
    path: "*",
    element: <NotFound />
  }
];

export default notFoundRoute;
