
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
import { Trash2, Plus, Package } from "lucide-react";

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
  const navigate = useNavigate();

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      console.log("Fetching companies...");
      const { data, error } = await supabase
        .from('companies')
        .select('*');

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
        { input_company_id: companyId }  // Updated parameter name
      );
      
      if (error) {
        console.error("Error deleting company:", error);
        throw error;
      }
      
      console.log("Company deletion result:", data);
      
      // Refresh the page after successful deletion
      window.location.reload();
      
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Companies</h1>
        <Button 
          onClick={() => navigate('/companies/new')}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Company
        </Button>
      </div>

      {loadingCompanies ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
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
                  No companies found
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
