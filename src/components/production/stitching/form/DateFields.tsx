
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { StitchingFormValues } from "./types";

interface DateFieldsProps {
  form: UseFormReturn<StitchingFormValues>;
}

export const DateFields = ({ form }: DateFieldsProps) => {
  return (
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
  );
};
