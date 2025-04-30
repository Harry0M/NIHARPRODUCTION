
export interface Material {
  id: string;
  material_type: string;
  color: string;
  gsm: string;
  purchase_price: string; // Changed to string to match the interface usage
  quantity: number;
  unit: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  alternate_unit: string;
  conversion_rate: number;
  supplier_id: string;
}

export interface Component {
  id: string;
  component_type: string;
  color: string;
  gsm: string;
  size: string;
  quantity?: number;
  consumption?: number | string;
  material_id?: string;
  material_name?: string;
  roll_width?: number | string;
  custom_name?: string;
  length?: string;
  width?: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  bag_length: string;
  bag_width: string;
  default_quantity: string;
  default_rate: string;
  cutting_charge: string;
  printing_charge: string;
  stitching_charge: string;
}
