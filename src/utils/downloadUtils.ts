
// CSV download utilities with proper TypeScript types

export const downloadAsCSV = (data: Record<string, unknown>[], filename: string) => {
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle null, undefined, and format objects/arrays
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return `"${value}"` // Escape values with quotes to handle commas
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Fix: Create an anchor element instead of a link element
  const anchor = document.createElement('a');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', `${filename}.csv`);
  anchor.style.visibility = 'hidden';
  
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url); // Clean up the URL object
};

export const formatDataForCSV = (data: Record<string, unknown>) => {
  // Remove sensitive or unnecessary fields
  const excludeFields = ['id', 'created_at', 'updated_at', 'created_by'];
  
  return Object.keys(data)
    .filter(key => !excludeFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {} as Record<string, unknown>);
};

export const formatOrdersForDownload = (orders: Record<string, unknown>[]) => {
  return orders.map(order => ({
    order_number: order.order_number,
    company_name: order.company_name,
    quantity: order.quantity,
    bag_size: `${order.bag_length}x${order.bag_width}`,
    rate: order.rate || 'N/A',
    status: order.status?.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A',
    order_date: new Date(order.order_date as string).toLocaleDateString(),
    total_amount: order.rate ? ((order.rate as number) * (order.quantity as number)).toFixed(2) : 'N/A'
  }));
};

export const formatJobCardForDownload = (jobCard: Record<string, unknown>) => {
  if (!jobCard) return [];
  
  const order = jobCard.order as Record<string, unknown> | null;
  const cuttingJobs = jobCard.cutting_jobs as Record<string, unknown>[] | null;
  const printingJobs = jobCard.printing_jobs as Record<string, unknown>[] | null;
  const stitchingJobs = jobCard.stitching_jobs as Record<string, unknown>[] | null;
  
  return [{
    job_name: jobCard.job_name,
    job_number: jobCard.job_number || 'N/A',
    order_number: order?.order_number || 'N/A',
    company_name: order?.company_name || 'N/A',
    status: jobCard.status?.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A',
    order_quantity: order?.quantity || 0,
    bag_size: order ? `${order.bag_length}x${order.bag_width}` : 'N/A',
    cutting_status: cuttingJobs?.[0]?.status?.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not started',
    printing_status: printingJobs?.[0]?.status?.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not started',
    stitching_status: stitchingJobs?.[0]?.status?.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not started',
    created_date: new Date(jobCard.created_at as string).toLocaleDateString()
  }];
};
