import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Users, Search, ExternalLink 
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/production/LoadingSpinner';

interface Partner {
  id: string;
  name: string;
  partnerType: 'vendor' | 'supplier';
  service_type?: string | null;
  materials_provided?: string | null;
  jobCounts?: {
    total: number;
    completed: number;
  };
}

const PartnersAnalysis = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'vendors' | 'suppliers'>('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("id, name, materials_provided")
        .order("name");
      
      if (suppliersError) throw suppliersError;
      
      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from("vendors")
        .select("id, name, service_type")
        .order("name");
      
      if (vendorsError) throw vendorsError;
      
      // Format suppliers
      const formattedSuppliers = (suppliersData || []).map(supplier => ({
        ...supplier,
        partnerType: 'supplier' as const,
        jobCounts: { total: 0, completed: 0 }
      }));
      
      // Format vendors
      const formattedVendors = (vendorsData || []).map(vendor => ({
        ...vendor,
        partnerType: 'vendor' as const,
        jobCounts: { total: 0, completed: 0 }
      }));
      
      // Combine both types
      const allPartners = [...formattedSuppliers, ...formattedVendors];
      
      // Fetch job counts for each partner (this could be optimized with a more efficient query)
      for (const partner of allPartners) {
        try {
          // Count total jobs
          const jobCounts = await fetchPartnerJobCounts(partner.name, partner.partnerType);
          partner.jobCounts = jobCounts;
        } catch (e) {
          console.error(`Error fetching job data for ${partner.name}:`, e);
        }
      }
      
      setPartners(allPartners);
    } catch (error: any) {
      console.error("Error fetching partners:", error);
      toast({
        title: "Error fetching partners",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerJobCounts = async (partnerName: string, type: 'vendor' | 'supplier') => {
    // Only vendors have jobs assigned to them
    if (type !== 'vendor') {
      return { total: 0, completed: 0 };
    }
    
    let totalJobs = 0;
    let completedJobs = 0;
    
    // Cutting jobs
    const { count: cuttingTotal, error: cuttingTotalError } = await supabase
      .from('cutting_jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('worker_name', `%${partnerName}%`);
      
    if (!cuttingTotalError && cuttingTotal) {
      totalJobs += cuttingTotal;
    }
    
    const { count: cuttingCompleted, error: cuttingCompletedError } = await supabase
      .from('cutting_jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('worker_name', `%${partnerName}%`)
      .eq('status', 'completed');
      
    if (!cuttingCompletedError && cuttingCompleted) {
      completedJobs += cuttingCompleted;
    }
    
    // Printing jobs
    const { count: printingTotal, error: printingTotalError } = await supabase
      .from('printing_jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('worker_name', `%${partnerName}%`);
      
    if (!printingTotalError && printingTotal) {
      totalJobs += printingTotal;
    }
    
    const { count: printingCompleted, error: printingCompletedError } = await supabase
      .from('printing_jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('worker_name', `%${partnerName}%`)
      .eq('status', 'completed');
      
    if (!printingCompletedError && printingCompleted) {
      completedJobs += printingCompleted;
    }
    
    // Stitching jobs
    const { count: stitchingTotal, error: stitchingTotalError } = await supabase
      .from('stitching_jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('worker_name', `%${partnerName}%`);
      
    if (!stitchingTotalError && stitchingTotal) {
      totalJobs += stitchingTotal;
    }
    
    const { count: stitchingCompleted, error: stitchingCompletedError } = await supabase
      .from('stitching_jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('worker_name', `%${partnerName}%`)
      .eq('status', 'completed');
      
    if (!stitchingCompletedError && stitchingCompleted) {
      completedJobs += stitchingCompleted;
    }
    
    return { total: totalJobs, completed: completedJobs };
  };

  const filteredPartners = partners.filter(partner => {
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      partner.name.toLowerCase().includes(searchLower) ||
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
  
  // Sort by job count (most jobs first)
  filteredPartners.sort((a, b) => 
    (b.jobCounts?.total || 0) - (a.jobCounts?.total || 0)
  );

  const viewPartnerPerformance = (partner: Partner) => {
    navigate(`/partners/${partner.id}/performance?type=${partner.partnerType}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7" />
            Partner Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            View performance metrics for vendors and suppliers
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-elevated overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-primary inline-block"></span>
            Partner Performance Analysis
          </CardTitle>
          <CardDescription>Analyze job performance metrics for your vendors and suppliers</CardDescription>
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
                  All Partners
                </TabsTrigger>
                <TabsTrigger value="vendors" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                  Vendors
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Suppliers
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
            <LoadingSpinner />
          ) : (
            <>
              {filteredPartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground/80" />
                  </div>
                  <h3 className="text-xl font-medium">No matching partners</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Try adjusting your search term or view all partners by clearing the search
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-border/60 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableHead className="font-semibold">Partner Name</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Services/Materials</TableHead>
                        <TableHead className="font-semibold">Total Jobs</TableHead>
                        <TableHead className="font-semibold">Completion Rate</TableHead>
                        <TableHead className="font-semibold w-[150px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner, index) => {
                        // Calculate completion percentage
                        const totalJobs = partner.jobCounts?.total || 0;
                        const completedJobs = partner.jobCounts?.completed || 0;
                        const completionRate = totalJobs > 0 
                          ? Math.round((completedJobs / totalJobs) * 100) 
                          : 0;
                        
                        return (
                          <TableRow 
                            key={`${partner.partnerType}-${partner.id}`}
                            className="group transition-colors duration-150"
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
                            <TableCell>
                              {partner.partnerType === 'supplier' 
                                ? partner.materials_provided || "—"
                                : partner.service_type || "—"
                              }
                            </TableCell>
                            <TableCell>
                              {totalJobs > 0 ? totalJobs : "—"}
                            </TableCell>
                            <TableCell>
                              {totalJobs > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        completionRate >= 80 ? "bg-green-500" :
                                        completionRate >= 60 ? "bg-amber-500" :
                                        "bg-red-500"
                                      }`}
                                      style={{ width: `${completionRate}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">{completionRate}%</span>
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => viewPartnerPerformance(partner)}
                                disabled={partner.partnerType === 'supplier' || totalJobs === 0}
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Analytics
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnersAnalysis;
