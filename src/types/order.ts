
import { Component as CatalogComponent } from "../pages/Inventory/CatalogNew/types";

// Interface for form errors
export interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
  [key: string]: string | undefined;
}

// Order statuses enum
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'delivered';

// Base interface for order form data
export interface OrderFormData {
  // Customer information
  company_name?: string;
  company_id?: string | null;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  
  // Order details
  order_number?: string;
  catalog_id?: string;
  bag_length: string;
  bag_width: string;
  height?: string;
  quantity: string;
  rate: string;
  
  // Dates
  order_date: string;
  delivery_date?: string;
  
  // Additional information
  product_name?: string;
  delivery_address?: string;
  special_instructions?: string;
  sales_account_id?: string | null;
  status?: string;
  notes?: string;
  description?: string;
}

// Full order data from the database
export interface OrderData {
  id: string;
  company_id?: string;
  company_name: string;
  order_number: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  height?: number;
  rate?: number;
  order_date: string;
  delivery_date?: string;
  special_instructions?: string;
  sales_account_id?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  components?: Component[];
}

// Short order info for lists
export interface Order {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  rate?: number;
  order_date: string;
  delivery_date?: string;
  status: OrderStatus;
  created_at: string;
}

// Add a type adapter to better handle compatibility between catalog and order components
export type OrderComponent = CatalogComponent & {
  roll_width?: string;
  consumption?: string;
};

// Component for orders and catalog products
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

// Custom component definition
export interface CustomComponent extends Component {
  type: string; // Making type required for CustomComponent
  customName?: string; // For backward compatibility
  custom_name?: string;
}

// Material usage tracking
export interface MaterialUsage {
  id?: string;
  material_id: string;
  material_name: string;
  material_color?: string;
  material_gsm?: string;
  consumption: number;
  available_quantity: number;
  unit: string;
  cost?: number;
  unit_cost?: number;
  total_cost?: number;
  quantity?: number;
  name?: string;
  component_type?: string;
}

export interface OrderSummary {
  id: string;
  company_name: string;
  order_date: string;
  delivery_date?: string;
  quantity: number;
  total_amount?: number;
  balance_amount?: number;
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
