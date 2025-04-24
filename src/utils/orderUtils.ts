
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "ready_for_dispatch":
    case "dispatched":
      return "bg-blue-100 text-blue-800";
    case "in_production":
    case "cutting":
    case "printing":
    case "stitching":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusDisplay = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
