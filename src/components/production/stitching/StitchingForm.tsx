
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorSelection } from "@/components/production/VendorSelection";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  total_quantity: z.coerce.number().min(0, "Quantity must be a positive number").nullable(),
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
});

type FormValues = z.infer<typeof formSchema>;

interface StitchingFormProps {
  defaultValues: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  selectedJobId: string | null;
}

export const StitchingForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
  selectedJobId
}: StitchingFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stitching Details</CardTitle>
            <CardDescription>Enter the stitching job specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="total_quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Total quantity" 
                      {...field}
                      value={field.value === null ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quantities Fields */}
              {["part", "border", "handle", "chain", "runner", "piping"].map((type) => (
                <FormField
                  key={type}
                  control={form.control}
                  name={`${type}_quantity` as keyof FormValues}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{type.charAt(0).toUpperCase() + type.slice(1)} Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={`${type} quantity`}
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {["start_date", "expected_completion_date"].map((dateField) => (
                <FormField
                  key={dateField}
                  control={form.control}
                  name={dateField as "start_date" | "expected_completion_date"}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {dateField === "start_date" ? "Start Date" : "Expected Completion Date"}
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select {dateField === "start_date" ? "start" : "completion"} date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any notes or remarks about this job"
                      className="min-h-[100px]" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Select stitcher or enter manually"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="is_internal"
                render={({ field }) => (
                  <FormItem className="space-y-3">
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
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
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : selectedJobId ? "Update Job" : "Create Job"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};
