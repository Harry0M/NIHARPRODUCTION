import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VendorBillsDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDebugQueries = async () => {
    setLoading(true);
    try {
      console.log('=== STARTING VENDOR BILLS DEBUG ===');
      
      // 1. Check all job tables
      const [cuttingResult, printingResult, stitchingResult] = await Promise.all([
        supabase.from('cutting_jobs').select('*', { count: 'exact' }),
        supabase.from('printing_jobs').select('*', { count: 'exact' }),
        supabase.from('stitching_jobs').select('*', { count: 'exact' })
      ]);

      // 2. Check vendors table
      const vendorsResult = await supabase.from('vendors').select('*', { count: 'exact' });

      // 3. Check existing vendor bills
      const billsResult = await supabase.from('vendor_bills').select('*', { count: 'exact' });

      // 4. Check job cards with orders
      const jobCardsResult = await supabase
        .from('job_cards')
        .select(`
          id,
          job_name,
          job_number,
          orders (
            id,
            order_number,
            company_name,
            product_name
          )
        `, { count: 'exact' });

      // 5. Check completed external jobs specifically
      const [completedCutting, completedPrinting, completedStitching] = await Promise.all([
        supabase
          .from('cutting_jobs')
          .select('*')
          .eq('status', 'completed')
          .eq('is_internal', false)
          .not('received_quantity', 'is', null),
        supabase
          .from('printing_jobs')
          .select('*')
          .eq('status', 'completed')
          .eq('is_internal', false)
          .not('received_quantity', 'is', null)
          .not('rate', 'is', null),
        supabase
          .from('stitching_jobs')
          .select('*')
          .eq('status', 'completed')
          .eq('is_internal', false)
          .not('received_quantity', 'is', null)
          .not('rate', 'is', null)
      ]);

      const debugData = {
        totalCuttingJobs: cuttingResult.count || 0,
        totalPrintingJobs: printingResult.count || 0,
        totalStitchingJobs: stitchingResult.count || 0,
        totalVendors: vendorsResult.count || 0,
        totalVendorBills: billsResult.count || 0,
        totalJobCards: jobCardsResult.count || 0,
        
        completedExternalCutting: completedCutting.data?.length || 0,
        completedExternalPrinting: completedPrinting.data?.length || 0,
        completedExternalStitching: completedStitching.data?.length || 0,
        
        sampleCuttingJob: cuttingResult.data?.[0] || null,
        samplePrintingJob: printingResult.data?.[0] || null,
        sampleStitchingJob: stitchingResult.data?.[0] || null,
        sampleVendor: vendorsResult.data?.[0] || null,
        sampleJobCard: jobCardsResult.data?.[0] || null,
        
        errors: {
          cutting: cuttingResult.error,
          printing: printingResult.error,
          stitching: stitchingResult.error,
          vendors: vendorsResult.error,
          bills: billsResult.error,
          jobCards: jobCardsResult.error
        }
      };

      setDebugInfo(debugData);
      console.log('=== DEBUG DATA ===', debugData);
      
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugQueries();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Bills Debug Information</CardTitle>
          <CardDescription>Debugging why available jobs are showing as 0</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runDebugQueries} disabled={loading} className="mb-4">
            {loading ? 'Running Debug...' : 'Refresh Debug Data'}
          </Button>
          
          {debugInfo.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {debugInfo.error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <h4 className="font-semibold">Total Jobs</h4>
                <p>Cutting: {debugInfo.totalCuttingJobs || 0}</p>
                <p>Printing: {debugInfo.totalPrintingJobs || 0}</p>
                <p>Stitching: {debugInfo.totalStitchingJobs || 0}</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded">
                <h4 className="font-semibold">Completed External</h4>
                <p>Cutting: {debugInfo.completedExternalCutting || 0}</p>
                <p>Printing: {debugInfo.completedExternalPrinting || 0}</p>
                <p>Stitching: {debugInfo.completedExternalStitching || 0}</p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-semibold">Other Tables</h4>
                <p>Vendors: {debugInfo.totalVendors || 0}</p>
                <p>Job Cards: {debugInfo.totalJobCards || 0}</p>
                <p>Vendor Bills: {debugInfo.totalVendorBills || 0}</p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded">
                <h4 className="font-semibold">Errors</h4>
                {Object.entries(debugInfo.errors || {}).map(([key, error]) => (
                  error && <p key={key} className="text-red-600 text-sm">{key}: {error.message}</p>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold mb-2">Sample Cutting Job</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo.sampleCuttingJob, null, 2)}
                </pre>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold mb-2">Sample Printing Job</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo.samplePrintingJob, null, 2)}
                </pre>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold mb-2">Sample Stitching Job</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo.sampleStitchingJob, null, 2)}
                </pre>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold mb-2">Sample Vendor</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo.sampleVendor, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorBillsDebug;
