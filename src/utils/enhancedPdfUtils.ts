/**
 * Enhanced PDF Generation Utilities
 * Creates professional, well-formatted PDF documents for various application needs
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Types for better type safety
type RGBColor = [number, number, number];

interface PDFDataItem {
  [key: string]: any;
}

interface OrderData extends PDFDataItem {
  order_number?: string;
  company_name?: string;
  product_name?: string;
  order_date?: string | Date;
  quantity?: number;
  rate?: number;
  total_amount?: number;
  status?: string;
  bag_length?: number;
  bag_width?: number;
  material?: string;
  gsm?: string;
}

interface JobCardData extends PDFDataItem {
  job_name?: string;
  job_number?: string;
  status?: string;
  created_at?: string | Date;
  order?: {
    order_number?: string;
    company_name?: string;
  };
  cutting_jobs?: Array<{
    status?: string;
    worker_name?: string;
    received_quantity?: number;
  }>;
  printing_jobs?: Array<{
    status?: string;
    worker_name?: string;
    received_quantity?: number;
  }>;
  stitching_jobs?: Array<{
    status?: string;
    worker_name?: string;
    received_quantity?: number;
  }>;
}

// Company/Brand colors and styling
const PDF_STYLES = {
  colors: {
    primary: [41, 128, 185] as RGBColor,
    secondary: [52, 73, 94] as RGBColor,
    success: [39, 174, 96] as RGBColor,
    warning: [241, 196, 15] as RGBColor,
    danger: [231, 76, 60] as RGBColor,
    light: [236, 240, 241] as RGBColor,
    white: [255, 255, 255] as RGBColor,
    black: [0, 0, 0] as RGBColor,
    gray: [127, 140, 141] as RGBColor
  },
  fonts: {
    title: 20,
    subtitle: 16,
    heading: 14,
    body: 11,
    small: 9
  },
  margins: {
    top: 20,
    bottom: 20,
    left: 15,
    right: 15
  }
};

/**
 * Add company header to PDF
 */
function addCompanyHeader(pdf: jsPDF, title: string, subtitle?: string) {
  const pageWidth = pdf.internal.pageSize.width;
  
  // Company logo space (if you have a logo, you can add it here)
  // pdf.addImage(logoData, 'PNG', 15, 15, 30, 20);
  
  // Company name and details
  pdf.setFontSize(PDF_STYLES.fonts.title);
  pdf.setTextColor(...PDF_STYLES.colors.primary);
  pdf.text('Your Company Name', 15, 25);
  
  pdf.setFontSize(PDF_STYLES.fonts.small);
  pdf.setTextColor(...PDF_STYLES.colors.gray);
  pdf.text('Address Line 1, City, State - Pincode', 15, 32);
  pdf.text('Phone: +91-XXXXXXXXXX | Email: info@company.com', 15, 37);
  
  // Document title
  pdf.setFontSize(PDF_STYLES.fonts.subtitle);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, 55);
  
  if (subtitle) {
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 62);
  }
  
  // Add a horizontal line
  pdf.setDrawColor(...PDF_STYLES.colors.light);
  pdf.setLineWidth(0.5);
  pdf.line(15, 70, pageWidth - 15, 70);
  
  return 75; // Return Y position for content start
}

/**
 * Add footer to PDF
 */
function addFooter(pdf: jsPDF, pageNumber?: number, totalPages?: number) {
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  
  // Footer line
  pdf.setDrawColor(...PDF_STYLES.colors.light);
  pdf.setLineWidth(0.5);
  pdf.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
  
  // Generated timestamp
  pdf.setFontSize(PDF_STYLES.fonts.small);
  pdf.setTextColor(...PDF_STYLES.colors.gray);
  pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 15, pageHeight - 15);
  
  // Page number
  if (pageNumber && totalPages) {
    const pageText = `Page ${pageNumber} of ${totalPages}`;
    const pageTextWidth = pdf.getTextWidth(pageText);
    pdf.text(pageText, pageWidth - 15 - pageTextWidth, pageHeight - 15);
  }
}

/**
 * Create a professional order/invoice PDF
 */
export function generateOrderPDF(orderData: any, filename: string) {
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Order Details', `Order #${orderData.order_number || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Order information section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Order Information', 15, currentY);
  currentY += 10;
  
  const orderInfo = [
    ['Order Number:', orderData.order_number || 'N/A'],
    ['Company:', orderData.company_name || 'N/A'],
    ['Product:', orderData.product_name || 'N/A'],
    ['Order Date:', orderData.order_date ? format(new Date(orderData.order_date), 'dd MMM yyyy') : 'N/A'],
    ['Quantity:', orderData.quantity?.toLocaleString() || 'N/A'],
    ['Rate:', orderData.rate ? `₹${orderData.rate}` : 'N/A'],
    ['Total Amount:', orderData.total_amount ? `₹${orderData.total_amount.toLocaleString()}` : 'N/A'],
    ['Status:', orderData.status?.replace(/_/g, ' ').toUpperCase() || 'N/A']
  ];
  
  // Create info table
  autoTable(pdf, {
    body: orderInfo,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 100 }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 15;
  
  // Product specifications (if available)
  if (orderData.bag_length && orderData.bag_width) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Product Specifications', 15, currentY);
    currentY += 10;
    
    const specifications = [
      ['Bag Dimensions:', `${orderData.bag_length} x ${orderData.bag_width} cm`],
      ['Material:', orderData.material || 'Canvas'],
      ['GSM:', orderData.gsm || 'N/A']
    ];
    
    autoTable(pdf, {
      body: specifications,
      startY: currentY,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 3
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Create a professional job card PDF
 */
export function generateJobCardPDF(jobCardData: any, filename: string) {
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Job Card', `${jobCardData.job_name || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Basic job information
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Job Information', 15, currentY);
  currentY += 10;
  
  const jobInfo = [
    ['Job Name:', jobCardData.job_name || 'N/A'],
    ['Job Number:', jobCardData.job_number || 'N/A'],
    ['Order Number:', jobCardData.order?.order_number || 'N/A'],
    ['Company:', jobCardData.order?.company_name || 'N/A'],
    ['Status:', jobCardData.status?.replace(/_/g, ' ').toUpperCase() || 'N/A'],
    ['Created Date:', jobCardData.created_at ? format(new Date(jobCardData.created_at), 'dd MMM yyyy') : 'N/A']
  ];
  
  autoTable(pdf, {
    body: jobInfo,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 15;
  
  // Production stages summary (if available)
  if (jobCardData.cutting_jobs || jobCardData.printing_jobs || jobCardData.stitching_jobs) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Production Summary', 15, currentY);
    currentY += 10;
    
    const productionData = [];
    
    // Cutting jobs
    if (jobCardData.cutting_jobs?.length > 0) {
      const cuttingJob = jobCardData.cutting_jobs[0];
      productionData.push([
        'Cutting',
        cuttingJob.status?.toUpperCase() || 'N/A',
        cuttingJob.worker_name || 'N/A',
        cuttingJob.received_quantity || 'N/A'
      ]);
    }
    
    // Printing jobs
    if (jobCardData.printing_jobs?.length > 0) {
      const printingJob = jobCardData.printing_jobs[0];
      productionData.push([
        'Printing',
        printingJob.status?.toUpperCase() || 'N/A',
        printingJob.worker_name || 'N/A',
        printingJob.received_quantity || 'N/A'
      ]);
    }
    
    // Stitching jobs
    if (jobCardData.stitching_jobs?.length > 0) {
      const stitchingJob = jobCardData.stitching_jobs[0];
      productionData.push([
        'Stitching',
        stitchingJob.status?.toUpperCase() || 'N/A',
        stitchingJob.worker_name || 'N/A',
        stitchingJob.received_quantity || 'N/A'
      ]);
    }
    
    if (productionData.length > 0) {
      autoTable(pdf, {
        head: [['Stage', 'Status', 'Worker', 'Quantity']],
        body: productionData,
        startY: currentY,
        theme: 'striped',
        headStyles: {
          fillColor: PDF_STYLES.colors.primary,
          textColor: PDF_STYLES.colors.white,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: PDF_STYLES.fonts.body,
          cellPadding: 4
        }
      });
    }
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Create a professional vendor bill PDF
 */
export function generateVendorBillPDF(billData: any, filename: string) {
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Vendor Bill', `Bill #${billData.bill_number || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Vendor and bill information
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Bill Information', 15, currentY);
  currentY += 10;
  
  const billInfo = [
    ['Bill Number:', billData.bill_number || 'N/A'],
    ['Vendor Name:', billData.vendor_name || 'N/A'],
    ['Service Type:', billData.job_type?.toUpperCase() || 'N/A'],
    ['Bill Date:', billData.created_at ? format(new Date(billData.created_at), 'dd MMM yyyy') : 'N/A'],
    ['Total Amount:', billData.total_amount ? `₹${billData.total_amount.toLocaleString()}` : 'N/A'],
    ['Status:', billData.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING']
  ];
  
  autoTable(pdf, {
    body: billInfo,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 15;
  
  // Job details (if available)
  if (billData.jobs && billData.jobs.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Job Details', 15, currentY);
    currentY += 10;
    
    const jobDetails = billData.jobs.map((job: any, index: number) => [
      `Job ${index + 1}`,
      job.job_card_id || 'N/A',
      job.quantity || 'N/A',
      job.rate ? `₹${job.rate}` : 'N/A',
      job.amount ? `₹${job.amount.toLocaleString()}` : 'N/A'
    ]);
    
    autoTable(pdf, {
      head: [['Job', 'Job Card ID', 'Quantity', 'Rate', 'Amount']],
      body: jobDetails,
      startY: currentY,
      theme: 'striped',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 4
      },
      foot: [['', '', '', 'Total:', `₹${billData.total_amount?.toLocaleString() || '0'}`]],
      footStyles: {
        fillColor: PDF_STYLES.colors.light,
        textColor: PDF_STYLES.colors.secondary,
        fontStyle: 'bold'
      }
    });
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Create a professional dispatch receipt PDF
 */
export function generateDispatchReceiptPDF(dispatchData: any, filename: string) {
  const pdf = new jsPDF();
    // Header
  const startY = addCompanyHeader(pdf, 'Dispatch Receipt', `Order #${dispatchData.order_number || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Dispatch information
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Dispatch Information', 15, currentY);
  currentY += 10;
  
  const dispatchInfo = [
    ['Order Number:', dispatchData.order_number || 'N/A'],
    ['Company:', dispatchData.company_name || 'N/A'],
    ['Recipient:', dispatchData.recipient_name || 'N/A'],
    ['Delivery Address:', dispatchData.delivery_address || 'N/A'],
    ['Delivery Date:', dispatchData.delivery_date ? format(new Date(dispatchData.delivery_date), 'dd MMM yyyy') : 'N/A'],
    ['Tracking Number:', dispatchData.tracking_number || 'N/A'],
    ['Quality Checked:', dispatchData.quality_checked ? 'Yes' : 'No'],
    ['Quantity Checked:', dispatchData.quantity_checked ? 'Yes' : 'No']
  ];
  
  autoTable(pdf, {
    body: dispatchInfo,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 15;
  
  // Batch details (if available)
  if (dispatchData.batches && dispatchData.batches.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Batch Details', 15, currentY);
    currentY += 10;
    
    const batchDetails = dispatchData.batches.map((batch: any, index: number) => [
      `Batch ${index + 1}`,
      batch.quantity || 'N/A',
      batch.notes || 'N/A'
    ]);
    
    autoTable(pdf, {
      head: [['Batch', 'Quantity', 'Notes']],
      body: batchDetails,
      startY: currentY,
      theme: 'striped',
      headStyles: {
        fillColor: PDF_STYLES.colors.primary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 4
      },
      foot: [['Total Quantity:', dispatchData.total_quantity?.toLocaleString() || '0', '']],
      footStyles: {
        fillColor: PDF_STYLES.colors.light,
        textColor: PDF_STYLES.colors.secondary,
        fontStyle: 'bold'
      }
    });
  }
  
  // Notes section
  if (dispatchData.notes) {
    currentY = (pdf as any).lastAutoTable.finalY + 15;
    
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Additional Notes', 15, currentY);
    currentY += 10;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const splitNotes = pdf.splitTextToSize(dispatchData.notes, 180);
    pdf.text(splitNotes, 15, currentY);
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Create a comprehensive sales invoice PDF
 */
export function generateSalesInvoicePDF(invoiceData: any, filename: string) {
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Sales Invoice', `Invoice #${invoiceData.invoice_number || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Split into two columns for billing details
  const pageWidth = pdf.internal.pageSize.width;
  const columnWidth = (pageWidth - 45) / 2;
  
  // Bill To section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Bill To:', 15, currentY);
  currentY += 8;
  
  pdf.setFontSize(PDF_STYLES.fonts.body);
  pdf.setTextColor(...PDF_STYLES.colors.black);
  pdf.text(invoiceData.customer_name || 'N/A', 15, currentY);
  currentY += 6;
  
  if (invoiceData.customer_address) {
    const addressLines = pdf.splitTextToSize(invoiceData.customer_address, columnWidth);
    pdf.text(addressLines, 15, currentY);
    currentY += 6 * addressLines.length;
  }
  
  // Invoice details (right column)
  let rightColumnY = startY + 18;
  const rightColumnX = 15 + columnWidth + 15;
  
  const invoiceDetails = [
    ['Invoice Date:', invoiceData.invoice_date ? format(new Date(invoiceData.invoice_date), 'dd MMM yyyy') : 'N/A'],
    ['Due Date:', invoiceData.due_date ? format(new Date(invoiceData.due_date), 'dd MMM yyyy') : 'N/A'],
    ['Order Reference:', invoiceData.order_reference || 'N/A']
  ];
  
  invoiceDetails.forEach(([label, value]) => {
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    pdf.text(label, rightColumnX, rightColumnY);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(value, rightColumnX + 40, rightColumnY);
    rightColumnY += 8;
  });
  
  currentY = Math.max(currentY, rightColumnY) + 15;
  
  // Items table
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Items', 15, currentY);
  currentY += 10;
  
  const items = invoiceData.items || [];
  const itemRows = items.map((item: any) => [
    item.description || 'N/A',
    item.quantity?.toString() || '0',
    item.rate ? `₹${item.rate}` : '₹0',
    item.amount ? `₹${item.amount.toLocaleString()}` : '₹0'
  ]);
  
  autoTable(pdf, {
    head: [['Description', 'Quantity', 'Rate', 'Amount']],
    body: itemRows,
    startY: currentY,
    theme: 'striped',
    headStyles: {
      fillColor: PDF_STYLES.colors.primary,
      textColor: PDF_STYLES.colors.white,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 10;
  
  // Totals section
  const totalsX = pageWidth - 90;
  const totalsData = [
    ['Subtotal:', invoiceData.subtotal ? `₹${invoiceData.subtotal.toLocaleString()}` : '₹0'],
    ['Tax:', invoiceData.tax ? `₹${invoiceData.tax.toLocaleString()}` : '₹0'],
    ['Total:', invoiceData.total ? `₹${invoiceData.total.toLocaleString()}` : '₹0']
  ];
  
  totalsData.forEach(([label, value], index) => {
    pdf.setFontSize(PDF_STYLES.fonts.body);
    
    if (index === totalsData.length - 1) {
      // Highlight total
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
    } else {
      pdf.setTextColor(...PDF_STYLES.colors.gray);
    }
    
    pdf.text(label, totalsX, currentY);
    pdf.text(value, totalsX + 30, currentY);
    currentY += 8;
  });
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Create a professional order consumption analysis PDF
 */
export function generateOrderConsumptionPDF(orderData: any[], filename: string) {
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Order Consumption Analysis', 'Material and Production Cost Report');
  
  let currentY = startY + 10;
  
  // Summary section
  const totalOrders = orderData.length;
  const totalRevenue = orderData.reduce((sum, order) => sum + (order.totalRevenue || 0), 0);
  const totalCost = orderData.reduce((sum, order) => sum + (order.materialValue || 0) + (order.productionCosts?.totalProductionCost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Summary', 15, currentY);
  currentY += 10;
  
  const summaryData = [
    ['Total Orders:', totalOrders.toString()],
    ['Total Revenue:', `₹${totalRevenue.toLocaleString()}`],
    ['Total Cost:', `₹${totalCost.toLocaleString()}`],
    ['Total Profit:', `₹${totalProfit.toLocaleString()}`],
    ['Profit Margin:', `${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0}%`]
  ];
  
  autoTable(pdf, {
    body: summaryData,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 80 }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
  currentY = (pdf as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 220) {
    pdf.addPage();
    currentY = 30;
  }
  
  // Detailed orders table
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Order Details', 15, currentY);
  currentY += 10;
  
  const orderRows = orderData.map(order => [
    order.name || 'N/A',
    order.company || 'N/A',
    order.orderQuantity?.toLocaleString() || '0',
    `₹${(order.materialValue || 0).toLocaleString()}`,
    `₹${(order.productionCosts?.totalProductionCost || 0).toLocaleString()}`,
    `₹${(order.totalRevenue || 0).toLocaleString()}`,
    `₹${((order.totalRevenue || 0) - (order.materialValue || 0) - (order.productionCosts?.totalProductionCost || 0)).toLocaleString()}`
  ]);
  
  autoTable(pdf, {
    head: [['Order', 'Company', 'Quantity', 'Material Cost', 'Production Cost', 'Revenue', 'Profit']],
    body: orderRows,
    startY: currentY,
    theme: 'striped',
    headStyles: {
      fillColor: PDF_STYLES.colors.primary,
      textColor: PDF_STYLES.colors.white,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: PDF_STYLES.fonts.small,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    }
  });
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

// Export the existing functions with enhanced versions
export { downloadAsCSV } from './downloadUtils';

// Export all the new PDF generation functions
export {
  generateOrderPDF,
  generateJobCardPDF,
  generateVendorBillPDF,
  generateDispatchReceiptPDF,
  generateSalesInvoicePDF,
  generateOrderConsumptionPDF
};

// Backward compatibility - enhanced version of the original function
export const downloadAsPDF = (data: any[], filename: string, title: string) => {
  const pdf = new jsPDF();
  
  // Add professional header
  const startY = addCompanyHeader(pdf, title);
  
  // If data is complex, try to format it better
  const headers = Object.keys(data[0]);
  const tableData = data.map(item => 
    headers.map(header => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );
  
  // Create professional table
  autoTable(pdf, {
    head: [headers.map(h => h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))],
    body: tableData,
    startY: startY + 10,
    theme: 'striped',
    headStyles: { 
      fillColor: PDF_STYLES.colors.primary, 
      textColor: PDF_STYLES.colors.white,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 4
    },
    margin: { top: PDF_STYLES.margins.top }
  });
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
};
