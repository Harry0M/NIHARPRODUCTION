
export type ProductDetails = {
  name: string;
  description: string;
  bag_length: number;
  bag_width: number;
  height: number;
  default_quantity: number;
  default_rate: number;
  cutting_charge: number;
  printing_charge: number;
  stitching_charge: number;
  transport_charge: number;
};

export type ComponentType = "part" | "border" | "handle" | "chain" | "runner" | "custom";

export interface Component {
  id: string;
  type: ComponentType;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
  component_type?: string;
}

export interface CustomComponent extends Component {
  custom_name: string;
  component_type: string;
}

export interface ComponentOptions {
  color: string[];
  gsm: string[];
}
