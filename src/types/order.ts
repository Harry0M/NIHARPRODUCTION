import { Component as CatalogComponent } from "../pages/Inventory/CatalogNew/types";

export interface OrderFormData {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  order_date: string;
  delivery_date: string;
  quantity: string;
  bag_length: string;
  bag_width: string;
  rate: string;
  total_amount: string;
  advance_amount: string;
  balance_amount: string;
  status: string;
  notes: string;
}

export interface OrderData {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  order_date: string;
  delivery_date: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  rate: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Add a type adapter to better handle compatibility between catalog and order components
export type OrderComponent = CatalogComponent & {
  roll_width?: string;
  consumption?: string;
};

export type CustomComponent = {
  id: string;
  type: string;
  component_type: string;
  color?: string;
  gsm?: string;
  size?: string;
  custom_name?: string;
  length?: string;
  width?: string;
  material_id?: string;
  material_name?: string;
  roll_width?: string;
  consumption?: string;
};

export interface Component {
  id: string;
  component_type: string;
  type?: string;
  color?: string;
  gsm?: string;
  size?: string;
  custom_name?: string;
  length?: string;
  width?: string;
  material_id?: string;
  material_name?: string;
  roll_width?: string;
  consumption?: string;
  order_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderSummary {
  id: string;
  customer_name: string;
  order_date: string;
  delivery_date: string;
  quantity: number;
  total_amount: number;
  balance_amount: number;
  status: string;
}

export interface OrderDetailsData {
  order: OrderData;
  components: Component[];
}

export interface OrderListFilters {
  status: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  searchQuery: string;
}
