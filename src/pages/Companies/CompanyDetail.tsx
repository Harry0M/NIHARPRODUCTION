
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

const CompanyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setCompany(data);
      } catch (error: any) {
        toast({
          title: "Error fetching company",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompany();
  }, [id]);

  const handleDelete = async () => {
    if (!company) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);
        
      if (error) throw error;
      
      toast({
        title: "Company deleted",
        description: "Company has been successfully deleted",
      });
      
      navigate("/companies");
    } catch (error: any) {
      toast({
        title: "Error deleting company",
        description: error.message,
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Company Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">The requested company could not be found.</p>
            <Button onClick={() => navigate("/companies")} className="mt-4">
              Return to Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/companies")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Information about {company.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Company Name</dt>
              <dd>{company.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Contact Person</dt>
              <dd>{company.contact_person || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Email</dt>
              <dd>{company.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground mb-1">Phone</dt>
              <dd>{company.phone || "—"}</dd>
            </div>
            {company.address && (
              <div className="col-span-2">
                <dt className="text-sm font-medium text-muted-foreground mb-1">Address</dt>
                <dd>{company.address}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this company?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyDetail;
