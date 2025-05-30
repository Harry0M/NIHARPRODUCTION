import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

interface Company {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gst_number?: string | null; // Make this optional to handle legacy data
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional properties for flexibility
}

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        // Add type assertion to ensure gst_number is handled correctly
        setCompany(data as Company);
      } catch (error: any) {
        console.error('Error fetching company:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load company details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCompany();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });
      
      navigate('/companies');
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete company',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }


  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Company not found</h2>
        <p className="text-muted-foreground mt-2">The requested company could not be found.</p>
        <Button 
          onClick={() => navigate('/companies')} 
          className="mt-4"
          variant="outline"
        >
          Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/companies')}
          className="h-8 w-8" 
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Company Details</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
              <p className="text-sm">{company.contact_person || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-sm">{company.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p className="text-sm">{company.phone || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p className="text-sm whitespace-pre-line">{company.address || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">GST Number</h3>
              <p className="text-sm">{company.gst_number || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p className="text-sm">
                {new Date(company.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p className="text-sm">
                {new Date(company.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t px-6 py-4 bg-muted/50 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/companies/${company.id}/orders`)}
            >
              <Package className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </div>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/companies/edit/${company.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {company.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Company'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyDetails;
