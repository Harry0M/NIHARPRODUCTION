
export interface ComponentProps {
  id?: string;
  type: string;
  length?: string;
  width?: string;
  color?: string;
  gsm?: string;
  customName?: string;
  name?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: number;
  details?: string;
}

export interface ComponentFormProps {
  component: ComponentProps;
  index: number;
  isCustom?: boolean;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  title?: string;
  handleChange: (index: number, field: string, value: string) => void;
  onChange?: (field: string, value: string) => void;
  disableConsumptionFields?: boolean;
}

export interface DimensionsFieldsProps {
  component: ComponentProps;
  onFieldChange: (field: string, value: string) => void;
}

export interface MaterialSelectionProps {
  component: ComponentProps;
  onFieldChange: (field: string, value: string) => void;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
}

export interface ConsumptionFieldsProps {
  component: ComponentProps;
  onFieldChange: (field: string, value: string) => void;
  selectedMaterial?: any;
}
