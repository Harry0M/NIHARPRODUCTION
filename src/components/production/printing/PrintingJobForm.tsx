
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VendorSelection } from "@/components/production/VendorSelection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { JobStatus } from "@/types/production";
import { usePrintImage } from "@/hooks/use-print-image";

interface PrintingFormData {
  id?: string; // Optional property for existing job ID
  job_card_id?: string; // Add job_card_id as an optional property
  pulling: string;
  gsm: string;
  sheet_length: string;
  sheet_width: string;
  worker_name: string;
  is_internal: boolean;
  rate: string;
  status: JobStatus;
  expected_completion_date: string;
  print_image: string;
}

interface PrintingJobFormProps {
  initialData?: PrintingFormData;
  bagDimensions: {
    length: number;
    width: number;
  };
  onSubmit: (data: PrintingFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const PrintingJobForm: React.FC<PrintingJobFormProps> = ({
  initialData,
  bagDimensions,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { uploadImage, uploading } = usePrintImage();
  const [formData, setFormData] = useState<PrintingFormData>(() => ({
    pulling: initialData?.pulling || "",
    gsm: initialData?.gsm || "",
    sheet_length: initialData?.sheet_length || String(bagDimensions.length || ""),
    sheet_width: initialData?.sheet_width || String(bagDimensions.width || ""),
    worker_name: initialData?.worker_name || "",
    is_internal: initialData?.is_internal ?? true,
    rate: initialData?.rate || "",
    status: initialData?.status || "pending",
    expected_completion_date: initialData?.expected_completion_date || "",
    print_image: initialData?.print_image || "",
    id: initialData?.id, // Include id when initializing formData
    job_card_id: initialData?.job_card_id // Include job_card_id when initializing
  }));
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.print_image || null);

  useEffect(() => {
    // Update sheet dimensions when bag dimensions change
    setFormData(prev => ({
      ...prev,
      sheet_length: String(bagDimensions.length || prev.sheet_length),
      sheet_width: String(bagDimensions.width || prev.sheet_width)
    }));
  }, [bagDimensions]);

  useEffect(() => {
    // Update image preview when initialData changes
    if (initialData?.print_image) {
      setImagePreview(initialData.print_image);
    }
    
    // Also update id and job_card_id if present in initialData
    if (initialData) {
      setFormData(prev => ({ 
        ...prev, 
        id: initialData.id,
        job_card_id: initialData.job_card_id 
      }));
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        setImagePreview(imageUrl);
        setFormData(prev => ({ ...prev, print_image: imageUrl }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pulling">Pulling</Label>
              <Input
                id="pulling"
                value={formData.pulling}
                onChange={(e) => setFormData(prev => ({ ...prev, pulling: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsm">GSM</Label>
              <Input
                id="gsm"
                value={formData.gsm}
                onChange={(e) => setFormData(prev => ({ ...prev, gsm: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sheet_length">Sheet Length</Label>
              <Input
                id="sheet_length"
                type="number"
                value={formData.sheet_length}
                onChange={(e) => setFormData(prev => ({ ...prev, sheet_length: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet_width">Sheet Width</Label>
              <Input
                id="sheet_width"
                type="number"
                value={formData.sheet_width}
                onChange={(e) => setFormData(prev => ({ ...prev, sheet_width: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Worker/Vendor</Label>
            <VendorSelection
              serviceType="printing"
              value={formData.worker_name}
              onChange={(value) => setFormData(prev => ({ 
                ...prev, 
                worker_name: value,
                is_internal: false
              }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: JobStatus) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expected Completion Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expected_completion_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expected_completion_date ? (
                    format(new Date(formData.expected_completion_date), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.expected_completion_date ? new Date(formData.expected_completion_date) : undefined}
                  onSelect={(date) => setFormData(prev => ({
                    ...prev,
                    expected_completion_date: date ? format(date, "yyyy-MM-dd") : ""
                  }))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="print_image">Print Design Image</Label>
            <Input
              id="print_image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && (
              <div className="text-sm text-muted-foreground">Uploading image...</div>
            )}
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="Print design preview" 
                  className="max-w-sm rounded-lg border"
                />
                <input 
                  type="hidden" 
                  name="print_image" 
                  value={formData.print_image} 
                />
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || uploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting ? "Saving..." : "Save Printing Job"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
