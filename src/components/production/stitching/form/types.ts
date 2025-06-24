
import { z } from "zod";

export const stitchingFormSchema = z.object({
  received_quantity: z.coerce.number().min(0, "Quantity must be a positive number").nullable(),
  provided_quantity: z.coerce.number().min(0, "Provided quantity must be a positive number").nullable(),
  part_quantity: z.coerce.number().min(0, "Part quantity must be a positive number").nullable(),
  border_quantity: z.coerce.number().min(0, "Border quantity must be a positive number").nullable(),
  handle_quantity: z.coerce.number().min(0, "Handle quantity must be a positive number").nullable(),
  chain_quantity: z.coerce.number().min(0, "Chain quantity must be a positive number").nullable(),
  runner_quantity: z.coerce.number().min(0, "Runner quantity must be a positive number").nullable(),
  piping_quantity: z.coerce.number().min(0, "Piping quantity must be a positive number").nullable(),
  start_date: z.date().nullable(),
  expected_completion_date: z.date().nullable(),
  notes: z.string().optional(),
  worker_name: z.string().optional(),
  is_internal: z.boolean().default(true),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  rate: z.coerce.number().min(0, "Rate must be a positive number").optional().nullable(),
  vendor_id: z.string().nullable().optional(),
});

export type StitchingFormValues = z.infer<typeof stitchingFormSchema>;
