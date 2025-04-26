
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; companyId: string | null; companyName: string | null; deleteMode: 'company-only' | 'company-and-orders' | null; }>({
    isOpen: false,
    companyId: null,
    companyName: null,
    deleteMode: null
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

  // Handler for deleting a company only
  const handleDeleteCompanyOnly = async (companyId: string) => {
    try {
      setIsDeleting(true);
      console.log(`Starting company-only deletion for ID: ${companyId}`);
      
      // First check if the company has any orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('company_id', companyId);
      
      if (ordersError) {
        console.error("Error checking for orders:", ordersError);
        throw ordersError;
      }
      
      console.log(`Found related orders: ${orders?.length || 0}`);
      
      if (orders && orders.length > 0) {
        // Update orders to remove company_id reference
        const { error: updateError } = await supabase
          .from('orders')
          .update({ company_id: null })
          .eq('company_id', companyId);
          
        if (updateError) {
          console.error("Error updating company references:", updateError);
          throw updateError;
        }
      }
      
      // Now delete the company
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteError) {
        console.error("Error during company deletion:", deleteError);
        throw deleteError;
      }
      
      console.log("Company deletion successful");
      
      // Update local state to remove the company
      setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== companyId));
      
      toast({
        title: "Success",
        description: "Company deleted successfully. Orders were preserved.",
      });
    } catch (error: any) {
      console.error("Exception in handleDeleteCompanyOnly:", error);
      toast({
        title: "Error",
        description: `Failed to delete company: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ isOpen: false, companyId: null, companyName: null, deleteMode: null });
      setIsDeleting(false);
      fetchCompanies(); // Double-check our state is correct
    }
  };

  // Handler for deleting a company and all its orders
  const handleDeleteCompanyWithOrders = async (companyId: string) => {
    try {
      setIsDeleting(true);
      console.log(`Starting full deletion for company: ${companyId}`);
      
      // Call the database function to delete the company and all related orders
      const { error } = await supabase.rpc(
        'delete_order_completely', 
        { order_id: companyId }
      );
      
      if (error) {
        console.error("Error in delete_order_completely RPC:", error);
        
        // If the RPC fails, try direct deletion
        console.log("Attempting direct deletion of company...");
        const { error: deleteError } = await supabase
          .from('companies')
          .delete()
          .eq('id', companyId);
          
        if (deleteError) {
          console.error("Error during direct company deletion:", deleteError);
          throw deleteError;
        }
      }
      
      console.log("Company deletion successful");
      
      // Update local state to remove the company
      setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== companyId));
      
      toast({
        title: "Success",
        description: "Company and all related orders deleted successfully.",
      });
    } catch (error: any) {
      console.error("Exception in handleDeleteCompanyWithOrders:", error);
      toast({
        title: "Error",
        description: `Failed to delete company and orders: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ isOpen: false, companyId: null, companyName: null, deleteMode: null });
      setIsDeleting(false);
      fetchCompanies(); // Double-check our state is correct
    }
  };

  // Show delete confirmation dialog
  const showDeleteConfirmation = (companyId: string, companyName: string, mode: 'company-only' | 'company-and-orders') => {
    console.log(`Opening delete confirmation for: ${companyId}, ${companyName}, mode: ${mode}`);
    setConfirmDialog({
      isOpen: true,
      companyId,
      companyName,
      deleteMode: mode
    });
  };

  // Execute deletion based on mode
  const executeDelete = () => {
    if (!confirmDialog.companyId || !confirmDialog.deleteMode) return;
    
    if (confirmDialog.deleteMode === 'company-only') {
      handleDeleteCompanyOnly(confirmDialog.companyId);
    } else {
      handleDeleteCompanyWithOrders(confirmDialog.companyId);
    }
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
                      onClick={() => showDeleteConfirmation(company.id, company.name, 'company-only')}
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
              {confirmDialog.deleteMode === 'company-only' ? (
                <>
                  Are you sure you want to delete the company "{confirmDialog.companyName}"?
                  <br /><br />
                  Any orders associated with this company will be kept, but their company reference will be removed.
                </>
              ) : (
                <>
                  <span className="font-bold text-destructive">Warning: This cannot be undone.</span>
                  <br /><br />
                  This will permanently delete the company "{confirmDialog.companyName}" AND all its associated orders, job cards, and production records.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={isDeleting}
              className={confirmDialog.deleteMode === 'company-and-orders' ? 
                "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  Deleting...
                </div>
              ) : (
                confirmDialog.deleteMode === 'company-only' ? 
                  'Delete Company Only' : 
                  'Delete Company & All Orders'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
          {confirmDialog.deleteMode === 'company-only' && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setConfirmDialog(prev => ({...prev, deleteMode: 'company-and-orders'}))}
                disabled={isDeleting}
                className="w-full"
              >
                Delete Company & All Related Orders Instead
              </Button>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyList;
