
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
  // Function to handle sales account selection
  const handleSalesAccountChange = (value: string) => {
    // First update the sales_account_id field
    handleOrderChange({ 
      target: { 
        name: 'sales_account_id', 
        value 
      } 
    });
    
    // If an actual company is selected (not "none"), also update the company_name field
    if (value !== "none") {
      // Find the selected company
      const selectedCompany = companies.find(company => company.id === value);
      if (selectedCompany) {
        // Update the company_name field with the selected company's name
        handleOrderChange({
          target: {
            name: 'company_name',
            value: selectedCompany.name
          }
        });
      }
    }
  };
  
  return (
    <div className="space-y-4 border-b pb-4">
      <div className="space-y-2">
        <Label htmlFor="sales_account">Sales Account (Optional)</Label>
        <Select 
          onValueChange={handleSalesAccountChange}
          value={formData.sales_account_id || "none"}
        >
          <SelectTrigger id="sales_account">
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
    </div>
  );
};
