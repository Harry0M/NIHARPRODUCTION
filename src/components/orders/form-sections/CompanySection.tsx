
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { OrderFormData } from "@/types/order";

interface CompanySectionProps {
  formData: OrderFormData;
  companies: { id: string; name: string }[];
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  formErrors: {
    company?: string;
  };
}

export const CompanySection = ({
  formData,
  companies,
  handleOrderChange,
  formErrors
}: CompanySectionProps) => {
  return (
    <div className="space-y-4 border-b pb-4">
      <div className="space-y-2">
        <Label htmlFor="company_name" className="flex items-center gap-1">
          Company Name
          <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="company_name" 
          name="company_name"
          value={formData.company_name}
          onChange={(e) => handleOrderChange(e)}
          placeholder="Enter company name"
          required
          autoComplete="off"
          className={formErrors.company ? "border-destructive" : ""}
        />
        {formErrors.company && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {formErrors.company}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales_account">Sales Account (Optional)</Label>
        <Select 
          onValueChange={(value) => 
            handleOrderChange({ 
              target: { 
                name: 'sales_account_id', 
                value 
              } 
            })
          }
          value={formData.sales_account_id || "none"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sales account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
