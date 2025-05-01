
export interface ProductDetails {
  name: string;
  bag_length: number;
  bag_width: number;
  height: number;
  default_quantity?: number;
  default_rate?: number;
  description?: string;
  cutting_charge?: number;
  printing_charge?: number;
  stitching_charge?: number;
  transport_charge?: number;
  total_cost?: number;
}

export interface CustomComponent {
  id: string;
  type: string;
  component_type: string;
  color?: string;
  gsm?: string;
  size?: string;
  quantity?: number;
  consumption?: string;
  material_id?: string;
  material_name?: string;
  roll_width?: string;
  custom_name?: string;
  length?: string;
  width?: string;
}

export interface Material {
  id: string;
  material_type: string;
  color?: string;
  gsm?: string;
  quantity: number;
  unit: string;
  alternate_unit?: string;
  conversion_rate?: number;
  track_cost?: boolean;
  purchase_price?: number;
  selling_price?: number;
  supplier_id?: string;
  reorder_level?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MaterialUsage {
  id: string;
  material_id: string;
  material_name: string;
  component_type: string;
  consumption: number;
  unit_cost: number;
  total_cost: number;
  quantity: number;
  unit: string;
  cost: number;
  name: string;
}

export interface Component {
  id: string;
  component_type: string;
  color?: string;
  gsm?: string;
  size?: string;
  quantity?: number;
  consumption?: string;
  material_id?: string;
  material_name?: string;
  roll_width?: string;
  custom_name?: string;
  length?: string;
  width?: string;
  type?: string;
}

export type ComponentOptions = {
  color: string[];
  gsm: string[];
};
