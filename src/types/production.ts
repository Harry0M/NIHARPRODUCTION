
export interface CuttingComponent {
  component_id: string;
  component_type: string;
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  rate: string;
  status: JobStatus;
  material_type?: string;
  material_color?: string;
  material_gsm?: string;
  notes?: string;
}
