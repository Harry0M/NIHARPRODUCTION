
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorSelection } from "@/components/production/VendorSelection";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { StitchingFormValues } from "./types";

interface WorkerFieldsProps {
  form: UseFormReturn<StitchingFormValues>;
}

export const WorkerFields = ({ form }: WorkerFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="worker_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stitcher Name</FormLabel>
            <FormControl>
              <VendorSelection
                serviceType="stitching"
                value={field.value || ""}
                onChange={field.onChange}
                onVendorIdChange={(vendorId) => form.setValue("vendor_id", vendorId)}
                placeholder="Select stitcher or enter manually"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_internal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stitching Type</FormLabel>
            <FormControl>
              <Select
                onValueChange={(value) => field.onChange(value === "true")}
                value={field.value ? "true" : "false"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stitching type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Internal</SelectItem>
                  <SelectItem value="false">External</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
