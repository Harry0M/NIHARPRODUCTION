import { useState, useEffect, useCallback } from "react";
import { 
  NoAnimationDialog as Dialog, 
  NoAnimationDialogContent as DialogContent, 
  NoAnimationDialogHeader as DialogHeader, 
  NoAnimationDialogTitle as DialogTitle 
} from "@/components/purchases/NoAnimationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Company {
  id: string;
  name: string;
  [key: string]: any;
}

interface CompanySelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onSelect: (company: Company) => void;
  searchFields?: string[];
}

const ITEMS_PER_PAGE = 10;

export function CompanySelectDialog({
  open,
  onOpenChange,
  companies,
  onSelect,
  searchFields = ["name"]
}: CompanySelectDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Debug log
  console.log("CompanySelectDialog - Companies received:", companies?.length, companies);
  
  // Update filteredCompanies when companies prop changes
  useEffect(() => {
    if (companies && Array.isArray(companies)) {
      setFilteredCompanies(companies);
      console.log("CompanySelectDialog - Updated filtered companies:", companies.length);
    } else {
      console.warn("CompanySelectDialog - No companies data or invalid format");
      setFilteredCompanies([]);
    }
  }, [companies]);
  
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Update filtered companies when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies || []);
      return;
    }

    if (!companies || !Array.isArray(companies)) {
      console.warn("CompanySelectDialog - Cannot filter: companies data is invalid");
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const filtered = companies.filter(company => {
      return searchFields.some(field => {
        if (!company || !company[field]) return false;
        return company[field].toString().toLowerCase().includes(lowerQuery);
      });
    });

    console.log("CompanySelectDialog - Filtered companies:", filtered.length, "out of", companies.length);
    setFilteredCompanies(filtered);
    setCurrentPage(1); // Reset to first page on new search
  }, [companies, searchQuery, searchFields]);

  // Clear search, reset page, and log companies when dialog opens/closes
  useEffect(() => {
    if (open) {
      console.log("Dialog opened with companies:", companies?.length);
      // Force refresh filtered companies when dialog opens
      if (companies && Array.isArray(companies)) {
        setFilteredCompanies([...companies]);
      }
    } else {
      setSearchQuery("");
      setCurrentPage(1);
    }
  }, [open, companies]);
  
  // Load companies data directly when dialog is opened
  const loadCompaniesData = useCallback(async () => {
    if (open && (!companies || companies.length <= 1)) {
      try {
        console.log("Attempting to load companies data directly from database");
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .eq('status', 'active');

        if (!error && data && data.length > 0) {
          console.log("Directly fetched", data.length, "companies");
          // Add the "None" option to the beginning
          const companiesWithNone = [{ id: "none", name: "None" }, ...data];
          setFilteredCompanies(companiesWithNone);
        } else if (error) {
          console.error("Error fetching companies:", error);
        }
      } catch (error) {
        console.error("Error loading companies:", error);
      }
    }
  }, [open, companies]);
  
  // Call the function to load companies when dialog opens
  useEffect(() => {
    if (open) {
      loadCompaniesData();
    }
  }, [open, loadCompaniesData]);

  const handleSelect = (company: Company) => {
    onSelect(company);
    onOpenChange(false);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Company</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search companies..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          {paginatedCompanies.length > 0 ? (
            <div className="space-y-1">
              {paginatedCompanies.map((company) => (
                <Button
                  key={company.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleSelect(company)}
                >
                  <div className="font-medium">{company.name}</div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              {companies && companies.length > 0 ? (
                <>No matching companies found</>  
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  <span>No companies available</span>
                  <span className="text-xs">Please try refreshing the page</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        {/* Pagination controls */}
        {filteredCompanies.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
