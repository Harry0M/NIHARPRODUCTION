
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { StitchingFormValues } from "./types";

interface StatusFieldsProps {
  form: UseFormReturn<StitchingFormValues>;
}

export const StatusFields = ({ form }: StatusFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value || "pending"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rate</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter rate"
                {...field}
                value={field.value === null ? '' : field.value}
                onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
