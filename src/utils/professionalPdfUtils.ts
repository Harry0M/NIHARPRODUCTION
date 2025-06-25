/**
 * Enhanced PDF Generation Utilities
 * Creates professional, well-formatted PDF documents for various application needs
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Safe number formatting function
 */
function formatNumber(value: any): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

/**
 * Safe currency formatting function
 */
function formatCurrency(value: any): string {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = Number(value);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Safe string formatting function
 */
function formatString(value: any, defaultValue: string = 'N/A'): string {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value);
}

/**
 * Safe date formatting function
 */
function formatDate(value: any): string {
  if (!value) return 'N/A';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'dd MMM yyyy');
  } catch {
    return 'N/A';
  }
}

// Type extension for jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Types for better type safety
type RGBColor = [number, number, number];

interface PDFDataItem {
  [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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

interface VendorBillData extends PDFDataItem {
  bill_number?: string;
  vendor_name?: string;
  job_type?: string;
  created_at?: string | Date;
  total_amount?: number;
  status?: string;
  jobs?: Array<{
    job_card_id?: string;
    quantity?: number;
    rate?: number;
    amount?: number;
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
function addCompanyHeader(pdf: jsPDF, title: string, subtitle?: string): number {
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
function addFooter(pdf: jsPDF, pageNumber?: number, totalPages?: number): void {
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
export function generateOrderPDF(orderData: OrderData, filename: string): void {
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
    ['Order Number:', formatString(orderData.order_number)],
    ['Company:', formatString(orderData.company_name)],
    ['Product:', formatString(orderData.product_name)],
    ['Order Date:', formatDate(orderData.order_date)],
    ['Quantity:', formatNumber(orderData.quantity)],
    ['Rate:', formatCurrency(orderData.rate)],
    ['Total Amount:', formatCurrency(orderData.total_amount)],
    ['Status:', formatString(orderData.status?.replace(/_/g, ' ').toUpperCase())]
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
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // Product specifications (if available)
  if (orderData.bag_length && orderData.bag_width) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Product Specifications', 15, currentY);
    currentY += 10;
    
    const specifications = [
      ['Bag Dimensions:', `${formatNumber(orderData.bag_length)} x ${formatNumber(orderData.bag_width)} cm`],
      ['Material:', formatString(orderData.material, 'Canvas')],
      ['GSM:', formatString(orderData.gsm)]
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
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Create a professional job card PDF
 */
export function generateJobCardPDF(jobCardData: JobCardData, filename: string): void {
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
    ['Job Name:', formatString(jobCardData.job_name)],
    ['Job Number:', formatString(jobCardData.job_number)],
    ['Order Number:', formatString(jobCardData.order?.order_number)],
    ['Company:', formatString(jobCardData.order?.company_name)],
    ['Status:', formatString(jobCardData.status?.replace(/_/g, ' ').toUpperCase())],
    ['Created Date:', formatDate(jobCardData.created_at)]
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
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // Production stages summary (if available)
  if (jobCardData.cutting_jobs || jobCardData.printing_jobs || jobCardData.stitching_jobs) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Production Summary', 15, currentY);
    currentY += 10;
    
    const productionData: string[][] = [];
    
    // Cutting jobs
    if (jobCardData.cutting_jobs?.length && jobCardData.cutting_jobs.length > 0) {
      const cuttingJob = jobCardData.cutting_jobs[0];
      productionData.push([
        'Cutting',
        formatString(cuttingJob.status?.toUpperCase()),
        formatString(cuttingJob.worker_name),
        formatNumber(cuttingJob.received_quantity)
      ]);
    }
    
    // Printing jobs
    if (jobCardData.printing_jobs?.length && jobCardData.printing_jobs.length > 0) {
      const printingJob = jobCardData.printing_jobs[0];
      productionData.push([
        'Printing',
        formatString(printingJob.status?.toUpperCase()),
        formatString(printingJob.worker_name),
        formatNumber(printingJob.received_quantity)
      ]);
    }
    
    // Stitching jobs
    if (jobCardData.stitching_jobs?.length && jobCardData.stitching_jobs.length > 0) {
      const stitchingJob = jobCardData.stitching_jobs[0];
      productionData.push([
        'Stitching',
        formatString(stitchingJob.status?.toUpperCase()),
        formatString(stitchingJob.worker_name),
        formatNumber(stitchingJob.received_quantity)
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
export function generateVendorBillPDF(billData: VendorBillData, filename: string): void {
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
    ['Bill Number:', formatString(billData.bill_number)],
    ['Vendor Name:', formatString(billData.vendor_name)],
    ['Service Type:', formatString(billData.job_type?.toUpperCase())],
    ['Bill Date:', formatDate(billData.created_at)],
    ['Total Amount:', formatCurrency(billData.total_amount)],
    ['Status:', formatString(billData.status?.replace(/_/g, ' ').toUpperCase(), 'PENDING')]
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
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // Job details (if available)
  if (billData.jobs && billData.jobs.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Job Details', 15, currentY);
    currentY += 10;
    
    const jobDetails = billData.jobs.map((job, index) => [
      `Job ${index + 1}`,
      formatString(job.job_card_id),
      formatNumber(job.quantity),
      formatCurrency(job.rate),
      formatCurrency(job.amount)
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
      foot: [['', '', '', 'Total:', formatCurrency(billData.total_amount)]],
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
export function generateDispatchReceiptPDF(dispatchData: PDFDataItem, filename: string): void {
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
    ['Order Number:', formatString(dispatchData.order_number)],
    ['Company:', formatString(dispatchData.company_name)],
    ['Recipient:', formatString(dispatchData.recipient_name)],
    ['Delivery Address:', formatString(dispatchData.delivery_address)],
    ['Delivery Date:', formatDate(dispatchData.delivery_date)],
    ['Tracking Number:', formatString(dispatchData.tracking_number)],
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
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // Batch details (if available)
  if (dispatchData.batches && Array.isArray(dispatchData.batches) && dispatchData.batches.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Batch Details', 15, currentY);
    currentY += 10;
    
    const batchDetails = dispatchData.batches.map((batch: PDFDataItem, index: number) => [
      `Batch ${index + 1}`,
      formatNumber(batch.quantity),
      formatString(batch.notes)
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
      foot: [['Total Quantity:', formatNumber(dispatchData.total_quantity), '']],
      footStyles: {
        fillColor: PDF_STYLES.colors.light,
        textColor: PDF_STYLES.colors.secondary,
        fontStyle: 'bold'
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }
  
  // Notes section
  if (dispatchData.notes) {
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
export function generateSalesInvoicePDF(invoiceData: PDFDataItem, filename: string): void {
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
  pdf.text(formatString(invoiceData.customer_name), 15, currentY);
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
    ['Invoice Date:', formatDate(invoiceData.invoice_date)],
    ['Due Date:', formatDate(invoiceData.due_date)],
    ['Order Reference:', formatString(invoiceData.order_reference)]
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
  const itemRows = items.map((item: PDFDataItem) => [
    formatString(item.description),
    formatNumber(item.quantity),
    formatCurrency(item.rate),
    formatCurrency(item.amount)
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
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  
  // Totals section
  const totalsX = pageWidth - 90;
  const totalsData = [
    ['Subtotal:', formatCurrency(invoiceData.subtotal)],
    ['Tax:', formatCurrency(invoiceData.tax)],
    ['Total:', formatCurrency(invoiceData.total)]
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
export function generateOrderConsumptionPDF(orderData: PDFDataItem[], filename: string): void {
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
    ['Total Orders:', formatNumber(totalOrders)],
    ['Total Revenue:', formatCurrency(totalRevenue)],
    ['Total Cost:', formatCurrency(totalCost)],
    ['Total Profit:', formatCurrency(totalProfit)],
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
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
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
    formatString(order.name),
    formatString(order.company),
    formatNumber(order.orderQuantity),
    formatCurrency(order.materialValue),
    formatCurrency(order.productionCosts?.totalProductionCost),
    formatCurrency(order.totalRevenue),
    formatCurrency((order.totalRevenue || 0) - (order.materialValue || 0) - (order.productionCosts?.totalProductionCost || 0))
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

/**
 * Create a comprehensive purchase PDF
 */
export function generatePurchasePDF(purchaseData: PDFDataItem, filename: string = 'purchase'): void {
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Purchase Order', `Purchase #${purchaseData.purchase_number || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Split into two columns for supplier and purchase details
  const pageWidth = pdf.internal.pageSize.width;
  const columnWidth = (pageWidth - 45) / 2;
  
  // Supplier section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Supplier:', 15, currentY);
  currentY += 8;
  
  pdf.setFontSize(PDF_STYLES.fonts.body);
  pdf.setTextColor(...PDF_STYLES.colors.black);
  pdf.text(purchaseData.supplier_name || 'N/A', 15, currentY);
  currentY += 6;
  
  if (purchaseData.supplier_contact) {
    pdf.text(`Contact: ${purchaseData.supplier_contact}`, 15, currentY);
    currentY += 6;
  }
  
  if (purchaseData.supplier_phone) {
    pdf.text(`Phone: ${purchaseData.supplier_phone}`, 15, currentY);
    currentY += 6;
  }
  
  if (purchaseData.supplier_address) {
    const addressLines = pdf.splitTextToSize(purchaseData.supplier_address, columnWidth);
    pdf.text(addressLines, 15, currentY);
    currentY += 6 * addressLines.length;
  }
  
  // Purchase details (right column)
  let rightColumnY = startY + 18;
  const rightColumnX = 15 + columnWidth + 15;
  
  const purchaseDetails = [
    ['Purchase Date:', purchaseData.purchase_date ? format(new Date(purchaseData.purchase_date), 'dd MMM yyyy') : 'N/A'],
    ['Status:', purchaseData.status || 'N/A'],
    ['Invoice Number:', purchaseData.invoice_number || 'N/A'],
    ['Transport Charge:', purchaseData.transport_charge ? `₹${purchaseData.transport_charge.toLocaleString()}` : '₹0']
  ];
  
  purchaseDetails.forEach(([label, value]) => {
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
  pdf.text('Purchase Items', 15, currentY);
  currentY += 10;
    const items = purchaseData.purchase_items || [];
  const itemRows = items.map((item: PDFDataItem) => [
    item.material_name || 'N/A',
    item.quantity?.toString() || '0',
    item.unit || 'unit',
    item.unit_price ? `₹${item.unit_price.toFixed(2)}` : '₹0',
    item.line_total ? `₹${item.line_total.toLocaleString()}` : '₹0'
  ]);
  
  autoTable(pdf, {
    head: [['Material', 'Quantity', 'Unit', 'Unit Price', 'Total']],
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
      0: { cellWidth: 60 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    }
  });
  
  currentY = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Totals section
  const totalsX = pageWidth - 90;
  const totalsData = [
    ['Subtotal:', purchaseData.subtotal ? `₹${purchaseData.subtotal.toLocaleString()}` : '₹0'],
    ['Transport:', purchaseData.transport_charge ? `₹${purchaseData.transport_charge.toLocaleString()}` : '₹0'],
    ['Total Amount:', purchaseData.total_amount ? `₹${purchaseData.total_amount.toLocaleString()}` : '₹0']
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
  
  // Notes section if available
  if (purchaseData.notes) {
    currentY += 10;
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Notes:', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const notesLines = pdf.splitTextToSize(purchaseData.notes, pageWidth - 30);
    pdf.text(notesLines, 15, currentY);
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

// Export the existing functions for backward compatibility
export { downloadAsCSV } from './downloadUtils';
