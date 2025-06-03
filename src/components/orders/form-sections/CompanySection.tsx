
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown } from "lucide-react";
import { OrderFormData } from "@/types/order";
import { useState } from "react";
import { CompanySelectDialog } from "./CompanySelectDialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Debug log to check if companies data is being passed correctly
  console.log("CompanySection - Companies data:", companies?.length, companies);
  
  // Function to handle sales account selection
  const handleSalesAccountChange = (value: string) => {
    // Debug log
    console.log("handleSalesAccountChange - Selected value:", value);
    
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
      console.log("Selected company:", selectedCompany);
      
      if (selectedCompany) {
        // Update the company_name field with the selected company's name
        handleOrderChange({
          target: {
            name: 'company_name',
            value: selectedCompany.name
          }
        });
      }
    } else {
      // If "none" is selected, clear the company name
      handleOrderChange({
        target: {
          name: 'company_name',
          value: ''
        }
      });
    }
  };

  // Open company selection dialog
  const openCompanyDialog = () => {
    console.log("Opening company dialog with", companies?.length, "companies");
    setDialogOpen(true);
  };

  // Handle company selection from dialog
  const handleCompanySelect = (company: { id: string; name: string }) => {
    console.log("Company selected from dialog:", company);
    handleSalesAccountChange(company.id);
  };
  
  return (
    <div className="space-y-4 border-b pb-4">
      <div className="space-y-2">
        <Label htmlFor="sales_account">Sales Account (Optional)</Label>
        <Button 
          variant="outline" 
          className="w-full justify-between" 
          onClick={openCompanyDialog}
          type="button"
        >
          <span>{formData.sales_account_id ? companies.find(c => c.id === formData.sales_account_id)?.name : "Select sales account"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        <CompanySelectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          companies={companies && companies.length > 0 ? [{ id: "none", name: "None" }, ...companies] : [{ id: "none", name: "None" }]}
          onSelect={handleCompanySelect}
        />
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
