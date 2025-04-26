
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
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; companyId: string | null; companyName: string | null }>({
    isOpen: false,
    companyId: null,
    companyName: null
  });
  const [deleteOptionsDialog, setDeleteOptionsDialog] = useState<{ isOpen: boolean; companyId: string | null; companyName: string | null }>({
    isOpen: false,
    companyId: null,
    companyName: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      console.log("Fetching companies...");
      const { data, error } = await supabase
        .from('companies')
        .select('*');

      if (error) {
        console.error("Error fetching companies:", error);
        throw error;
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
    }
  };

  // Show delete options dialog
  const showDeleteOptions = (companyId: string, companyName: string) => {
    console.log("Opening delete options for:", companyId, companyName);
    setDeleteOptionsDialog({
      isOpen: true,
      companyId,
      companyName
    });
  };

  // Delete a company only
  const handleDeleteCompanyOnly = async (companyId: string) => {
    setIsDeleting(true);
    try {
      console.log("Starting company-only deletion for ID:", companyId);
      
      // First check if the company has any orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .or(`company_id.eq.${companyId},sales_account_id.eq.${companyId}`);
      
      if (ordersError) {
        console.error("Error checking for orders:", ordersError);
        throw ordersError;
      }
      
      console.log("Found related orders:", orders?.length || 0);
      
      if (orders && orders.length > 0) {
        console.log("Updating orders to remove company references");
        
        // Update orders to remove company_id reference
        const { error: updateError } = await supabase
          .from('orders')
          .update({ company_id: null })
          .eq('company_id', companyId);
          
        if (updateError) {
          console.error("Error updating company_id references:", updateError);
          throw updateError;
        }
        
        // Update orders to remove sales_account_id reference
        const { error: updateSalesError } = await supabase
          .from('orders')
          .update({ sales_account_id: null })
          .eq('sales_account_id', companyId);
          
        if (updateSalesError) {
          console.error("Error updating sales_account_id references:", updateSalesError);
          throw updateSalesError;
        }
      }
      
      // Now delete the company
      console.log("Executing company deletion for ID:", companyId);
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteError) {
        console.error("Error during company deletion:", deleteError);
        throw deleteError;
      }
      
      console.log("Company deletion successful");
      
      // Update local state to remove the company immediately
      setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== companyId));
      
      toast({
        title: "Success",
        description: "Company deleted successfully. Orders were preserved.",
      });
      
      console.log("Refreshing companies list");
      fetchCompanies(); // Refresh the list as a backup
      
    } catch (error: any) {
      console.error("Exception in handleDeleteCompanyOnly:", error);
      toast({
        title: "Error",
        description: `Failed to delete company: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleteOptionsDialog({ isOpen: false, companyId: null, companyName: null });
      setIsDeleting(false);
    }
  };

  // Delete a company and all its orders
  const handleDeleteCompanyWithOrders = async (companyId: string) => {
    try {
      // Show the confirmation dialog
      setDeleteOptionsDialog({ isOpen: false, companyId: null, companyName: null });
      setDeleteDialog({
        isOpen: true,
        companyId,
        companyName: deleteOptionsDialog.companyName
      });
    } catch (error: any) {
      console.error("Error preparing deletion dialog:", error);
      toast({
        title: "Error",
        description: `Failed to prepare deletion: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Execute full deletion with confirmation
  const executeFullDeletion = async (companyId: string) => {
    try {
      setIsDeleting(true);
      console.log("Starting full deletion for company:", companyId);
      
      // Get all orders for this company
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .or(`company_id.eq.${companyId},sales_account_id.eq.${companyId}`);
      
      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        throw ordersError;
      }
      
      console.log("Found orders to delete:", orders?.length || 0);
      
      if (orders && orders.length > 0) {
        // Delete each order with the complete deletion function
        for (const order of orders) {
          console.log("Deleting order:", order.id);
          const { error: deleteOrderError } = await supabase.rpc(
            'delete_order_completely', 
            { order_id: order.id }
          );
          
          if (deleteOrderError) {
            console.error("Error deleting order:", deleteOrderError);
            throw deleteOrderError;
          }
        }
        console.log("All related orders deleted successfully");
      }
      
      // Now delete the company
      console.log("Executing company deletion for ID:", companyId);
      const { error: deleteCompanyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteCompanyError) {
        console.error("Error during company deletion:", deleteCompanyError);
        throw deleteCompanyError;
      }
      
      console.log("Company deletion successful");
      
      // Update local state to remove the company immediately
      setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== companyId));
      
      toast({
        title: "Success",
        description: "Company and all related orders deleted successfully.",
      });
      
      console.log("Refreshing companies list");
      fetchCompanies(); // Refresh the list as a backup
      
    } catch (error: any) {
      console.error("Exception in executeFullDeletion:", error);
      toast({
        title: "Error",
        description: `Failed to delete company and orders: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleteDialog({ isOpen: false, companyId: null, companyName: null });
      setIsDeleting(false);
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
          {companies.map((company) => (
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
                  onClick={() => showDeleteOptions(company.id, company.name)}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog for delete options */}
      <Dialog 
        open={deleteOptionsDialog.isOpen} 
        onOpenChange={(isOpen) => !isDeleting && setDeleteOptionsDialog(prev => ({ ...prev, isOpen }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Choose how you want to delete {deleteOptionsDialog.companyName}:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button 
              variant="outline" 
              onClick={() => handleDeleteCompanyOnly(deleteOptionsDialog.companyId!)}
              disabled={isDeleting}
            >
              Delete company only (preserve orders)
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteCompanyWithOrders(deleteOptionsDialog.companyId!)}
              disabled={isDeleting}
            >
              Delete company and all related orders
            </Button>
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setDeleteOptionsDialog({ isOpen: false, companyId: null, companyName: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for complete deletion */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(isOpen) => !isDeleting && setDeleteDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company "{deleteDialog.companyName}" 
              and ALL related orders, job cards, production records, and dispatch information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog.companyId && executeFullDeletion(deleteDialog.companyId)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyList;
