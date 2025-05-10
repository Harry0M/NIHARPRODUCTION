import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Partner {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  status: string;
  partnerType: 'supplier' | 'vendor';
  materials_provided?: string | null;
  service_type?: string | null;
}

const PartnersList = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [partnerToDelete, setPartnerToDelete] = useState<{id: string, type: 'supplier' | 'vendor'} | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'suppliers' | 'vendors'>('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("id, name, contact_person, phone, materials_provided, status")
        .order("name");
      
      if (suppliersError) throw suppliersError;
      
      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from("vendors")
        .select("id, name, contact_person, phone, service_type, status")
        .order("name");
      
      if (vendorsError) throw vendorsError;
      
      // Combine and format data
      const formattedSuppliers = (suppliersData || []).map(supplier => ({
        ...supplier,
        partnerType: 'supplier' as const
      }));
      
      const formattedVendors = (vendorsData || []).map(vendor => ({
        ...vendor, 
        partnerType: 'vendor' as const
      }));
      
      setPartners([...formattedSuppliers, ...formattedVendors]);
    } catch (error: any) {
      toast({
        title: "Error fetching partners",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    
    setDeleteLoading(true);
    try {
      const tableName = partnerToDelete.type === 'supplier' ? 'suppliers' : 'vendors';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", partnerToDelete.id);
        
      if (error) {
        // Check for foreign key constraint violation (409 Conflict)
        if (error.code === '23503' || error.message?.includes('foreign key constraint') || error.message?.includes('Conflict')) {
          throw new Error(
            `Cannot delete this ${partnerToDelete.type} because it's referenced by other records (inventory items, orders, etc). ` +
            `You need to remove these references before deleting the ${partnerToDelete.type}.`
          );
        }
        throw error;
      }
      
      setPartners(partners.filter(partner => 
        !(partner.id === partnerToDelete.id && partner.partnerType === partnerToDelete.type)
      ));
      toast({
        title: `${partnerToDelete.type === 'supplier' ? 'Supplier' : 'Vendor'} deleted`,
        description: `The ${partnerToDelete.type} has been successfully removed.`,
      });
    } catch (error: any) {
      toast({
        title: `Error deleting ${partnerToDelete.type}`,
        description: error.message,
        variant: "destructive",
      });
      console.error("Delete error:", error);
    } finally {
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
      setDeleteLoading(false);
    }
  };

  const filteredPartners = partners.filter(partner => {
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      partner.name.toLowerCase().includes(searchLower) ||
      (partner.contact_person && partner.contact_person.toLowerCase().includes(searchLower)) ||
      (partner.partnerType === 'supplier' && partner.materials_provided && 
        partner.materials_provided.toLowerCase().includes(searchLower)) ||
      (partner.partnerType === 'vendor' && partner.service_type && 
        partner.service_type.toLowerCase().includes(searchLower));
    
    // Filter by active tab
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'suppliers' && partner.partnerType === 'supplier') ||
      (activeTab === 'vendors' && partner.partnerType === 'vendor');
      
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="slide-up" style={{animationDelay: '0.1s'}}>
          <h1 className="text-3xl font-bold tracking-tight">Partners</h1>
          <p className="text-muted-foreground mt-1">Manage your suppliers and vendors in one place</p>
        </div>
        <div className="flex flex-wrap gap-2 slide-up" style={{animationDelay: '0.2s'}}>
          <Link to="/partners/new?type=supplier">
            <Button variant="outline" className="flex items-center gap-1 shadow-subtle">
              <Plus size={16} />
              New Supplier
            </Button>
          </Link>
          <Link to="/partners/new?type=vendor">
            <Button className="flex items-center gap-1 shadow-subtle">
              <Plus size={16} />
              New Vendor
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-border/60 shadow-elevated overflow-hidden slide-up" style={{animationDelay: '0.3s'}}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-primary inline-block"></span>
            Partners Overview
          </CardTitle>
          <CardDescription>View and manage all your suppliers and vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 mb-6">
            <Tabs 
              defaultValue="all" 
              className="w-full sm:w-auto" 
              onValueChange={(value) => setActiveTab(value as any)}
            >
              <TabsList className="grid grid-cols-3 w-full sm:w-[360px]">
                <TabsTrigger value="all" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  All
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Suppliers
                </TabsTrigger>
                <TabsTrigger value="vendors" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  Vendors
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
                className="pl-9 w-full border-border/60 focus:border-primary/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary/30 border-t-primary"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full bg-background"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {filteredPartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center scale-in">
                  <div className="w-16 h-16 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    {searchTerm ? (
                      <Search className="h-8 w-8 text-muted-foreground/80" />
                    ) : (
                      <Plus className="h-8 w-8 text-muted-foreground/80" />
                    )}
                  </div>
                  <h3 className="text-xl font-medium">
                    {searchTerm ? "No matching partners" : "No partners found"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {searchTerm
                      ? "Try adjusting your search term or view all partners by clearing the search"
                      : "Add your first supplier or vendor to get started with partner management"}
                  </p>
                  {!searchTerm && (
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link to="/partners/new?type=supplier">
                        <Button variant="outline" className="shadow-sm">
                          <Plus className="mr-1.5 h-4 w-4" />
                          Add Supplier
                        </Button>
                      </Link>
                      <Link to="/partners/new?type=vendor">
                        <Button className="shadow-sm">
                          <Plus className="mr-1.5 h-4 w-4" />
                          Add Vendor
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-border/60 shadow-sm scale-in">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Contact Person</TableHead>
                        <TableHead className="font-semibold">Phone</TableHead>
                        <TableHead className="font-semibold">Services/Materials</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner, index) => (
                        <TableRow 
                          key={`${partner.partnerType}-${partner.id}`}
                          className="group transition-colors duration-150"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              partner.partnerType === 'supplier' 
                                ? "bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-500/30" 
                                : "bg-purple-500/10 text-purple-600 ring-1 ring-inset ring-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:ring-purple-500/30"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${partner.partnerType === 'supplier' ? "bg-blue-500" : "bg-purple-500"}`}></span>
                              {partner.partnerType === 'supplier' ? 'Supplier' : 'Vendor'}
                            </span>
                          </TableCell>
                          <TableCell>{partner.contact_person || "—"}</TableCell>
                          <TableCell>{partner.phone || "—"}</TableCell>
                          <TableCell>
                            {partner.partnerType === 'supplier' 
                              ? partner.materials_provided || "—"
                              : partner.service_type || "—"
                            }
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              partner.status === "active" 
                                ? "bg-green-500/10 text-green-600 ring-1 ring-inset ring-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/30" 
                                : "bg-gray-200 text-gray-700 ring-1 ring-inset ring-gray-300/20 dark:bg-gray-600/30 dark:text-gray-300 dark:ring-gray-500/30"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${partner.status === "active" ? "bg-green-500" : "bg-gray-400"}`}></span>
                              {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                onClick={() => navigate(`/partners/${partner.id}/edit?type=${partner.partnerType}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setPartnerToDelete({id: partner.id, type: partner.partnerType});
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash className="h-5 w-5" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>
                This action cannot be undone. This will permanently delete the selected
                {partnerToDelete?.type === 'supplier' ? ' supplier' : ' vendor'} 
                from the database.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-md p-3 mt-2">
                <p className="text-amber-800 dark:text-amber-400 text-sm font-medium">
                  <span className="flex items-center gap-1">
                    ⚠️ Important
                  </span>
                </p>
                <p className="text-sm mt-1 text-amber-700 dark:text-amber-300">
                  If this {partnerToDelete?.type} is referenced by any inventory items, orders, or other records, the deletion will fail.
                  You must first update or remove those references before deleting this {partnerToDelete?.type}.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleteLoading} className="border-border/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeletePartner();
              }}
            >
              {deleteLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PartnersList;
