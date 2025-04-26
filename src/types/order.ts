
import { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface Order {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  order_date: string;
  status: OrderStatus;
  rate: number | null;
  created_at: string;
}
