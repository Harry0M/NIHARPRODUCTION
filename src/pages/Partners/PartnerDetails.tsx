import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SupplierPurchaseHistory } from '@/components/partners/SupplierPurchaseHistory';
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

interface Partner {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  materials_provided?: string | null;
  service_type?: string | null;
  payment_terms: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  gst?: string | null;
}

const PartnerDetails = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const partnerType = type === 'supplier' ? 'supplier' : 'vendor';

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        setLoading(true);
        const tableName = partnerType === 'supplier' ? 'suppliers' : 'vendors';
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setPartner(data);
      } catch (error: any) {
        console.error(`Error fetching ${partnerType}:`, error);
        toast({
          title: 'Error',
          description: error.message || `Failed to load ${partnerType} details`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPartner();
    }
  }, [id, partnerType]);

  // Partner data is loaded and ready

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const tableName = partnerType === 'supplier' ? 'suppliers' : 'vendors';
      
      // Instead of deleting, update the status to 'inactive'
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${partnerType === 'supplier' ? 'Supplier' : 'Vendor'} marked as inactive successfully`,
      });
      
      // Refresh the current page to show the updated status
      setPartner(prev => prev ? { ...prev, status: 'inactive' } : null);
      
      // Optional: navigate back to partners list
      // navigate('/partners');
    } catch (error: any) {
      console.error(`Error updating ${partnerType} status:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to update ${partnerType} status`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">{partnerType === 'supplier' ? 'Supplier' : 'Vendor'} not found</h2>
        <p className="text-muted-foreground mt-2">The requested {partnerType} could not be found.</p>
        <Button 
          onClick={() => navigate('/partners')} 
          className="mt-4"
          variant="outline"
        >
          Back to Partners
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
          onClick={() => navigate('/partners')}
          className="h-8 w-8" 
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{partner.name}</h1>
          <p className="text-muted-foreground">{partnerType === 'supplier' ? 'Supplier' : 'Vendor'} Details</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
              <p className="text-sm">{partner.contact_person || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-sm">{partner.email || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p className="text-sm">{partner.phone || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">GST Number</h3>
              <p className="text-sm">{partner.gst || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p className="text-sm whitespace-pre-line">{partner.address || 'N/A'}</p>
            </div>
            
            {partnerType === 'supplier' && partner.materials_provided && (
              <div className="space-y-1 col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Materials Provided</h3>
                <p className="text-sm whitespace-pre-line">{partner.materials_provided}</p>
              </div>
            )}
            
            {partnerType === 'vendor' && partner.service_type && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Service Type</h3>
                <p className="text-sm">{partner.service_type}</p>
              </div>
            )}
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Payment Terms</h3>
              <p className="text-sm whitespace-pre-line">{partner.payment_terms || 'N/A'}</p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p className="text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  partner.status === "active" 
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/40' 
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-800/40'
                }`}>
                  {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                </span>
              </p>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
              <p className="text-sm">
                {new Date(partner.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p className="text-sm">
                {new Date(partner.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t px-6 py-4 bg-muted/50 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="space-x-2">
            {partnerType === 'vendor' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/partners/${partner.id}/performance?type=${partnerType}`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Performance
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/partners/${partnerType}/${partner.id}/edit?type=${partnerType}`)}
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

      {/* Show purchase history only for suppliers */}
      {!loading && partner && partnerType === 'supplier' && (
        <>
          <div className="mt-6 mb-2 px-6">
            <h2 className="text-2xl font-semibold">Purchase History</h2>
            <p className="text-muted-foreground">All purchases made from this supplier</p>
          </div>
          <SupplierPurchaseHistory supplierId={partner.id} />
        </>
      )}

      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {partnerType === 'supplier' ? 'Supplier' : 'Vendor'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {partner.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  Deleting...
                </div>
              ) : (
                `Delete ${partnerType === 'supplier' ? 'Supplier' : 'Vendor'}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PartnerDetails;
