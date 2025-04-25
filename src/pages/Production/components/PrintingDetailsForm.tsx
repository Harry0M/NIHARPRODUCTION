
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { VendorSelection } from "@/components/production/VendorSelection";
import { cn } from "@/lib/utils";
import { usePrintingJob } from "../contexts/PrintingJobContext";
import { Upload } from "lucide-react";

const formSchema = z.object({
  pulling: z.string().optional(),
  gsm: z.string().optional(),
  sheet_length: z.coerce.number().min(0, "Length must be a positive number"),
  sheet_width: z.coerce.number().min(0, "Width must be a positive number"),
  worker_name: z.string().optional(),
  is_internal: z.boolean().default(true),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  rate: z.coerce.number().min(0, "Rate must be a positive number").optional().nullable(),
  expected_completion_date: z.date().optional().nullable()
});

interface PrintingDetailsFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: z.infer<typeof formSchema>;
}

export function PrintingDetailsForm({ onSubmit, defaultValues }: PrintingDetailsFormProps) {
  const { printImage, setPrintImage, loading } = usePrintingJob();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      pulling: "",
      gsm: "",
      sheet_length: 0,
      sheet_width: 0,
      worker_name: "",
      is_internal: true,
      status: "pending",
      rate: null,
      expected_completion_date: null
    }
  });

  const handlePrintImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      console.error("Invalid file type");
      return;
    }
    
    const imageUrl = URL.createObjectURL(file);
    setPrintImage(imageUrl);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pulling"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pulling</FormLabel>
                <FormControl>
                  <Input placeholder="Enter pulling details" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="gsm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSM</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GSM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sheet_length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sheet Length (inches)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter sheet length" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sheet_width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sheet Width (inches)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter sheet width" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>Print Image</FormLabel>
          <div className="mt-2">
            <div className="flex items-center gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => document.getElementById('print-image-upload')?.click()}
                disabled={loading}
                className="flex gap-2 items-center"
              >
                <Upload size={16} />
                {printImage ? "Change Image" : "Upload Image"}
              </Button>
              <input 
                type="file"
                id="print-image-upload"
                onChange={handlePrintImageUpload}
                accept="image/*"
                className="hidden"
              />
              {printImage && <span className="text-green-600 text-sm">Image selected</span>}
            </div>
            
            {printImage && (
              <div className="mt-4 border rounded p-2 max-w-md">
                <img 
                  src={printImage} 
                  alt="Print design" 
                  className="max-h-40 object-contain"
                />
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="worker_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Printer Name</FormLabel>
              <FormControl>
                <VendorSelection
                  serviceType="printing"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Select printer or enter manually"
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
                <FormLabel>Printing Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => field.onChange(value === "true")}
                    defaultValue={field.value ? "true" : "false"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select printing type" />
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

        <div className="grid md:grid-cols-2 gap-4">
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
          
          <FormField
            control={form.control}
            name="expected_completion_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected Completion Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-6">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
