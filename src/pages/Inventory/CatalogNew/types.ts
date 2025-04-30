
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

export interface Component {
  id: string;
  type: string;
  customName?: string;
  length?: string;
  width?: string;
  color?: string;
  gsm?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
}

export interface CustomComponent extends Component {
  customName: string;
}

export interface Material {
  id: string;
  material_type: string;
  color?: string;
  gsm?: string; // Changed from number to string to match actual data
  unit: string;
  purchase_price: string;
}

export interface MaterialUsage {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface ComponentOptions {
  color: string[];
  gsm: string[];
}
