
export interface Material {
  id: string;
  material_type: string;
  color: string;
  gsm: string;
  purchase_price: string; 
  quantity: number;
  unit: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  alternate_unit: string;
  conversion_rate: number;
  supplier_id: string;
  selling_price?: string;
  reorder_level?: number;
}

export interface Component {
  id: string;
  component_type: string;
  color: string;
  gsm: string;
  size: string;
  quantity?: number;
  consumption?: string;  // Changed to string only
  material_id?: string;
  material_name?: string;
  roll_width?: string;   // Changed to string only
  custom_name?: string;
  length?: string;
  width?: string;
  type?: string;
}

export interface CustomComponent extends Component {
  id: string;
  type: string;
  custom_name?: string;
  customName?: string;  // For backward compatibility
}

export interface ComponentOptions {
  color: string[];
  gsm: string[];
}

export interface ProductDetails {
  name: string;
  description: string;
  bag_length: string;
  bag_width: string;
  default_quantity: string;
  default_rate: string;
  cutting_charge: string;
  printing_charge: string;
  stitching_charge: string;
  transport_charge: string;
}

export interface MaterialUsage {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface ComponentProps {
  id?: string;
  type: string;
  width?: string;
  length?: string;
  color?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
}
