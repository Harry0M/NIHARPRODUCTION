
import * as z from "zod";

export const stockFormSchema = z.object({
  material_type: z.string().min(1, "Material type is required"),
  color: z.string().optional(),
  gsm: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be a positive number"),
  unit: z.string().min(1, "Unit is required"),
  alternate_unit: z.string().optional(),
  conversion_rate: z.number().optional(),
  track_cost: z.boolean().default(false),
  purchase_price: z.number().optional(),
  selling_price: z.number().optional(),
  supplier_id: z.string().optional(),
  vendor_id: z.string().optional(),
  reorder_level: z.number().optional(),
});

export type StockFormValues = z.infer<typeof stockFormSchema>;

export const defaultValues: StockFormValues = {
  material_type: "",
  color: "",
  gsm: "",
  quantity: 0,
  unit: "",
  alternate_unit: "",
  conversion_rate: 1,
  track_cost: false,
  purchase_price: 0,
  selling_price: 0,
  supplier_id: "",
  vendor_id: "",
  reorder_level: 0,
};
