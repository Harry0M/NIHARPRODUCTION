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
import { Plus, Search, Trash, Edit, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import PaginationControls from "@/components/ui/pagination-controls";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPartners();
  }, [page, pageSize, searchTerm, activeTab]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // For pagination, we need to handle suppliers and vendors separately
      if (activeTab === 'all' || activeTab === 'suppliers') {
        // Fetch suppliers count
        let suppliersCountQuery = supabase
          .from("suppliers")
          .select("id", { count: 'exact', head: true });
        
        if (searchTerm) {
          suppliersCountQuery = suppliersCountQuery.or(
            `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,materials_provided.ilike.%${searchTerm}%`
          );
        }
        
        const { count: suppliersCount, error: suppliersCountError } = await suppliersCountQuery;
        
        if (suppliersCountError) throw suppliersCountError;
        
        // Store suppliers count
        const suppliersTotal = suppliersCount || 0;
        
        // If only showing suppliers, set total count now
        if (activeTab === 'suppliers') {
          setTotalCount(suppliersTotal);
        }
        
        // If we're showing all, also fetch vendors count
        if (activeTab === 'all') {
          // Fetch vendors count
          let vendorsCountQuery = supabase
            .from("vendors")
            .select("id", { count: 'exact', head: true });
          
          if (searchTerm) {
            vendorsCountQuery = vendorsCountQuery.or(
              `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%`
            );
          }
          
          const { count: vendorsCount, error: vendorsCountError } = await vendorsCountQuery;
          
          if (vendorsCountError) throw vendorsCountError;
          
          // Set total count for both suppliers and vendors
          setTotalCount((suppliersTotal || 0) + (vendorsCount || 0));
        }
      } else if (activeTab === 'vendors') {
        // Fetch vendors count
        let vendorsCountQuery = supabase
          .from("vendors")
          .select("id", { count: 'exact', head: true });
        
        if (searchTerm) {
          vendorsCountQuery = vendorsCountQuery.or(
            `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%`
          );
        }
        
        const { count: vendorsCount, error: vendorsCountError } = await vendorsCountQuery;
        
        if (vendorsCountError) throw vendorsCountError;
        
        // Set total count for vendors only
        setTotalCount(vendorsCount || 0);
      }
      
      // Determine pagination for each type
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Fetch the actual data based on active tab
      const partnersData: Partner[] = [];
      
      if (activeTab === 'all' || activeTab === 'suppliers') {
        // Fetch suppliers
        let suppliersQuery = supabase
          .from("suppliers")
          .select("id, name, contact_person, phone, materials_provided, status");
        
        if (searchTerm) {
          suppliersQuery = suppliersQuery.or(
            `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,materials_provided.ilike.%${searchTerm}%`
          );
        }
        
        // If only showing suppliers, apply pagination directly
        if (activeTab === 'suppliers') {
          suppliersQuery = suppliersQuery.range(from, to);
        }
        
        suppliersQuery = suppliersQuery.order("name");
        
        const { data: suppliersData, error: suppliersError } = await suppliersQuery;
        
        if (suppliersError) throw suppliersError;
        
        // Format suppliers data
        const formattedSuppliers = (suppliersData || []).map(supplier => ({
          ...supplier,
          partnerType: 'supplier' as const
        }));
        
        partnersData.push(...formattedSuppliers);
      }
      
      if (activeTab === 'all' || activeTab === 'vendors') {
        // Fetch vendors
        let vendorsQuery = supabase
          .from("vendors")
          .select("id, name, contact_person, phone, service_type, status");
        
        if (searchTerm) {
          vendorsQuery = vendorsQuery.or(
            `name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%`
          );
        }
        
        // If only showing vendors, apply pagination directly
        if (activeTab === 'vendors') {
          vendorsQuery = vendorsQuery.range(from, to);
        }
        
        vendorsQuery = vendorsQuery.order("name");
        
        const { data: vendorsData, error: vendorsError } = await vendorsQuery;
        
        if (vendorsError) throw vendorsError;
        
        // Format vendors data
        const formattedVendors = (vendorsData || []).map(vendor => ({
          ...vendor, 
          partnerType: 'vendor' as const
        }));
        
        partnersData.push(...formattedVendors);
      }
      
      // If we're showing all partners, apply pagination manually after combining the data
      if (activeTab === 'all') {
        // Sort combined data by name
        partnersData.sort((a, b) => a.name.localeCompare(b.name));
        
        // Apply pagination manually
        const paginatedData = partnersData.slice(from, to + 1);
        setPartners(paginatedData);
      } else {
        // For single partner type, pagination is already applied in the query
        setPartners(partnersData);
      }
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
      
      // Update partners state without causing a full re-fetch
      setPartners(partners.filter(partner => 
        !(partner.id === partnerToDelete.id && partner.partnerType === partnerToDelete.type)
      ));
      
      // Update total count
      setTotalCount(prev => prev - 1);
      
      // If we deleted the last item on the page, go to previous page
      if (partners.length === 1 && page > 1) {
        setPage(page - 1);
      }
      
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

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

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
              onValueChange={(value) => {
                setActiveTab(value as any);
                setPage(1); // Reset to first page when tab changes
              }}
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when search term changes
                }}
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
              {partners.length === 0 ? (
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
                <div className="rounded-md border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50 dark:bg-muted/20">
                      <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>{activeTab === 'vendors' ? 'Service Type' : 'Materials'}</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow 
                          key={`${partner.partnerType}-${partner.id}`} 
                          className="hover:bg-muted/30 dark:hover:bg-muted/10 cursor-pointer group"
                          onClick={() => navigate(`/partners/${partner.partnerType}/${partner.id}`)}>
                        
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>
                            <span 
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                partner.partnerType === 'supplier' 
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40' 
                                  : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                partner.partnerType === 'supplier' ? 'bg-blue-500' : 'bg-purple-500'
                              }`}></span>
                              {partner.partnerType === 'supplier' ? 'Supplier' : 'Vendor'}
                            </span>
                          </TableCell>
                          <TableCell>{partner.contact_person || '—'}</TableCell>
                          <TableCell>{partner.phone || '—'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {partner.partnerType === 'supplier' 
                              ? (partner.materials_provided || '—')
                              : (partner.service_type || '—')}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              partner.status === "active" 
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800/40' 
                                : 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border border-gray-200 dark:border-gray-800/40'
                            }`}>
                              {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/partners/${partner.partnerType}/${partner.id}/edit`)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPartnerToDelete({
                                    id: partner.id, 
                                    type: partner.partnerType
                                  });
                                  setDeleteDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
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
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {partnerToDelete?.type} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeletePartner();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PartnersList;
