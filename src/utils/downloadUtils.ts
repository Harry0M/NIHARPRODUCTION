
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadAsCSV = (data: any[], filename: string) => {
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

export const downloadAsPDF = (data: any[], filename: string, title: string) => {
  // Create new PDF document
  const pdf = new jsPDF();
  
  // Add title
  pdf.setFontSize(18);
  pdf.text(title, 14, 22);
  pdf.setFontSize(11);
  pdf.setTextColor(100);
  
  // Convert data to appropriate format for autoTable
  const headers = Object.keys(data[0]);
  const tableData = data.map(item => 
    headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );
  
  // Create table in PDF
  autoTable(pdf, {
    head: [headers.map(h => h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))],
    body: tableData,
    startY: 30,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    margin: { top: 30 }
  });
  
  // Save PDF file
  pdf.save(`${filename}.pdf`);
};

export const formatDataForCSV = (data: any) => {
  // Remove sensitive or unnecessary fields
  const excludeFields = ['id', 'created_at', 'updated_at', 'created_by'];
  
  return Object.keys(data)
    .filter(key => !excludeFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {} as any);
};

export const formatOrdersForDownload = (orders: any[]) => {
  return orders.map(order => ({
    order_number: order.order_number,
    company_name: order.company_name,
    quantity: order.quantity,
    bag_size: `${order.bag_length}x${order.bag_width}`,
    rate: order.rate || 'N/A',
    status: order.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A',
    order_date: new Date(order.order_date).toLocaleDateString(),
    total_amount: order.rate ? (order.rate * order.quantity).toFixed(2) : 'N/A'
  }));
};

export const formatJobCardForDownload = (jobCard: any) => {
  if (!jobCard) return [];
  
  return [{
    job_name: jobCard.job_name,
    job_number: jobCard.job_number || 'N/A',
    order_number: jobCard.order?.order_number || 'N/A',
    company_name: jobCard.order?.company_name || 'N/A',
    status: jobCard.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A',
    order_quantity: jobCard.order?.quantity || 0,
    bag_size: jobCard.order ? `${jobCard.order.bag_length}x${jobCard.order.bag_width}` : 'N/A',
    cutting_status: jobCard.cutting_jobs?.[0]?.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not started',
    printing_status: jobCard.printing_jobs?.[0]?.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not started',
    stitching_status: jobCard.stitching_jobs?.[0]?.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not started',
    created_date: new Date(jobCard.created_at).toLocaleDateString()
  }];
};
