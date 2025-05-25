import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/ui/pagination-controls";

interface Company {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
}

const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; companyId: string | null; companyName: string | null; }>({
    isOpen: false,
    companyId: null,
    companyName: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  // Fetch companies when pagination parameters or search term changes
  useEffect(() => {
    fetchCompanies();
  }, [page, pageSize, searchTerm]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      console.log("Fetching companies...");
      
      // First get the total count for pagination
      let countQuery = supabase
        .from('companies')
        .select('id', { count: 'exact', head: true });
      
      if (searchTerm) {
        countQuery = countQuery.or(
          `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error fetching companies count:", countError);
        throw countError;
      }
      
      setTotalCount(count || 0);
      
      // Then fetch the paginated data
      let query = supabase
        .from('companies')
        .select('*');
      
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }
      
      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await query
        .order('name')
        .range(from, to);

      if (error) {
        console.error("Error fetching companies:", error);
        toast({
          title: "Error",
          description: `Failed to fetch companies: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log("Companies fetched:", data?.length || 0);
        setCompanies(data || []);
      }
    } catch (error: any) {
      console.error("Exception in fetchCompanies:", error);
      toast({
        title: "Error",
        description: `Failed to fetch companies: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      setIsDeleting(true);
      console.log(`Deleting company with ID: ${companyId}`);
      
      const { data, error } = await supabase.rpc(
        'delete_company', 
        { input_company_id: companyId }  // Updated parameter name to match SQL function
      );
      
      if (error) {
        console.error("Error deleting company:", error);
        throw error;
      }
      
      console.log("Company deletion result:", data);
      
      // Update local state without refetching
      setCompanies(companies.filter(company => company.id !== companyId));
      
      // Update total count
      setTotalCount(prev => prev - 1);
      
      // If we deleted the last item on the page, go to previous page
      if (companies.length === 1 && page > 1) {
        setPage(page - 1);
      }
      
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in handleDeleteCompany:", error);
      toast({
        title: "Error",
        description: `Failed to delete company: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ isOpen: false, companyId: null, companyName: null });
      setIsDeleting(false);
    }
  };

  // Show delete confirmation dialog
  const showDeleteConfirmation = (companyId: string, companyName: string) => {
    console.log(`Opening delete confirmation for: ${companyId}, ${companyName}`);
    setConfirmDialog({
      isOpen: true,
      companyId,
      companyName
    });
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your customer companies</p>
        </div>
        <Button 
          onClick={() => navigate('/companies/new')}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Company
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page when search term changes
            }}
          />
        </div>
      </div>

      {loadingCompanies ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    {searchTerm ? `No companies found matching "${searchTerm}"` : "No companies found"}
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.contact_person || 'N/A'}</TableCell>
                    <TableCell>{company.email || 'N/A'}</TableCell>
                    <TableCell>{company.phone || 'N/A'}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/companies/${company.id}/orders`)}
                        className="flex items-center gap-1"
                      >
                        <Package size={16} />
                        Orders
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => showDeleteConfirmation(company.id, company.name)}
                        disabled={isDeleting}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1); // Reset to first page when page size changes
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
              />
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(isOpen) => !isDeleting && setConfirmDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {confirmDialog.companyName}? This will remove the company, but any orders associated with it will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog.companyId && handleDeleteCompany(confirmDialog.companyId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  Deleting...
                </div>
              ) : (
                'Delete Company'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyList;
