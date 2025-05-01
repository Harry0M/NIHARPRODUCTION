
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
  type: "custom";
}

export interface ComponentOptions {
  color: string[];
  gsm: string[];
}

export interface Material {
  id: string;
  material_type: string;
  color?: string;
  gsm?: string;
  unit: string;
  purchase_price: number;
}

export interface MaterialUsage {
  id: string;
  material_id: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  component_type: string;
  consumption: number;
  unit_cost: number;
  total_cost: number;
  material_name: string;
}

export interface CatalogFormProps {
  id?: string;
  isEditMode: boolean;
}

export interface ProductData {
  product: {
    id: string;
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
    created_at: string;
    updated_at: string;
    created_by: string;
  };
  components: any[];
}
