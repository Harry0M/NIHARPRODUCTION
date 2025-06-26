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
function formatNumber(value: unknown): string {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  // Use en-US formatting to avoid PDF rendering issues
  return num.toLocaleString('en-US');
}

/**
 * Safe currency formatting function
 */
function formatCurrency(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Rs. 0';
  const num = Number(value);
  if (isNaN(num)) return 'Rs. 0';
  // Use en-US formatting with "Rs." prefix for better PDF compatibility
  return `Rs. ${num.toLocaleString('en-US')}`;
}

/**
 * Safe string formatting function
 */
function formatString(value: unknown, defaultValue: string = 'N/A'): string {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value);
}

/**
 * Safe date formatting function
 */
function formatDate(value: unknown): string {
  if (!value) return 'N/A';
  try {
    const date = new Date(value as string | number | Date);
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
  vendors?: {
    contact_person?: string;
    phone?: string;
    gst?: string;
    address?: string;
  };
  tax_amount?: number;
  discount_amount?: number;
  payment_terms?: string;
  due_date?: string | Date;
  notes?: string;
  jobs?: Array<{
    job_card_id?: string;
    quantity?: number;
    rate?: number;
    amount?: number;
    description?: string;
    unit?: string;
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
  pdf.text('Nihar Creations', 15, 25);
  
  pdf.setFontSize(PDF_STYLES.fonts.small);
  pdf.setTextColor(...PDF_STYLES.colors.gray);
  pdf.text('30, Yamuna Industrial Estate, Opp. Neo Plast', 15, 32);
  pdf.text('G.I.D.C, Phase-1 Vatva, Ahmedabad, Gujarat - 382445', 15, 37);
  pdf.text('GST: 24IWNPS6583R1Z2', 15, 42);
  
  // Document title
  pdf.setFontSize(PDF_STYLES.fonts.subtitle);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, 60);
  
  if (subtitle) {
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 67);
  }
  
  // Add a horizontal line
  pdf.setDrawColor(...PDF_STYLES.colors.light);
  pdf.setLineWidth(0.5);
  pdf.line(15, 75, pageWidth - 15, 75);
  
  return 80; // Return Y position for content start
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
  
  // Split into two columns for vendor and bill information
  const pageWidth = pdf.internal.pageSize.width;
  const columnWidth = (pageWidth - 45) / 2;
  
  // Vendor information section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Vendor Information:', 15, currentY);
  currentY += 8;
  
  pdf.setFontSize(PDF_STYLES.fonts.body);
  pdf.setTextColor(...PDF_STYLES.colors.black);
  pdf.text(formatString(billData.vendor_name), 15, currentY);
  currentY += 6;
  
  if (billData.vendors?.contact_person) {
    pdf.text(`Contact Person: ${billData.vendors.contact_person}`, 15, currentY);
    currentY += 6;
  }
  
  if (billData.vendors?.phone) {
    pdf.text(`Phone: ${billData.vendors.phone}`, 15, currentY);
    currentY += 6;
  }
  
  if (billData.vendors?.gst) {
    pdf.text(`GST Number: ${billData.vendors.gst}`, 15, currentY);
    currentY += 6;
  }
  
  if (billData.vendors?.address) {
    const addressLines = pdf.splitTextToSize(billData.vendors.address, columnWidth);
    pdf.text(addressLines, 15, currentY);
    currentY += 6 * addressLines.length;
  }
  
  // Bill details (right column)
  let rightColumnY = startY + 18;
  const rightColumnX = 15 + columnWidth + 15;
  
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Bill Details:', rightColumnX, rightColumnY);
  rightColumnY += 8;
  
  const billInfo = [
    ['Bill Number:', formatString(billData.bill_number)],
    ['Service Type:', formatString(billData.job_type?.replace(/_/g, ' ').toUpperCase())],
    ['Bill Date:', formatDate(billData.created_at)],
    ['Status:', formatString(billData.status?.replace(/_/g, ' ').toUpperCase(), 'PENDING')],
    ['Total Amount:', formatCurrency(billData.total_amount)]
  ];
  
  pdf.setFontSize(PDF_STYLES.fonts.body);
  billInfo.forEach(([label, value]) => {
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    pdf.text(label, rightColumnX, rightColumnY);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(value, rightColumnX + 35, rightColumnY);
    rightColumnY += 8;
  });
  
  currentY = Math.max(currentY, rightColumnY) + 15;
  
  // Service/Job details (if available)
  if (billData.jobs && billData.jobs.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Service Details', 15, currentY);
    currentY += 10;
    
    const jobDetails = billData.jobs.map((job, index) => [
      `${index + 1}`,
      formatString(job.job_card_id),
      formatString(job.description || `${billData.job_type || 'Service'} Work`),
      formatNumber(job.quantity),
      formatString(job.unit || 'unit'),
      formatCurrency(job.rate),
      formatCurrency(job.amount)
    ]);
    
    autoTable(pdf, {
      head: [['#', 'Job Card ID', 'Description', 'Quantity', 'Unit', 'Rate', 'Amount']],
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
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' }
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
    
    // Enhanced totals section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Bill Summary', 15, currentY);
    currentY += 10;
    
    const totalsX = pageWidth - 90;
    
    // Calculate totals
    const subtotal = billData.jobs.reduce((sum, job) => sum + (job.amount || 0), 0);
    const taxAmount = billData.tax_amount || 0;
    const discountAmount = billData.discount_amount || 0;
    
    const summaryData = [
      ['Subtotal:', formatCurrency(subtotal)],
      ...(taxAmount > 0 ? [['Tax Amount:', formatCurrency(taxAmount)]] : []),
      ...(discountAmount > 0 ? [['Discount:', formatCurrency(discountAmount)]] : []),
      ['Total Amount:', formatCurrency(billData.total_amount)]
    ];
    
    summaryData.forEach(([label, value], index) => {
      pdf.setFontSize(PDF_STYLES.fonts.body);
      
      if (index === summaryData.length - 1) {
        // Highlight total
        pdf.setFontSize(PDF_STYLES.fonts.heading);
        pdf.setTextColor(...PDF_STYLES.colors.secondary);
        // Add background box for total
        pdf.setFillColor(...PDF_STYLES.colors.light);
        pdf.rect(totalsX - 5, currentY - 4, 80, 10, 'F');
      } else {
        pdf.setTextColor(...PDF_STYLES.colors.gray);
      }
      
      pdf.text(label, totalsX, currentY);
      pdf.text(value, totalsX + 35, currentY);
      currentY += 10;
    });
  } else {
    // If no job details, show basic service information
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Service Summary', 15, currentY);
    currentY += 10;
    
    const serviceData = [
      ['Service Type:', formatString(billData.job_type?.replace(/_/g, ' ').toUpperCase())],
      ['Total Amount:', formatCurrency(billData.total_amount)]
    ];
    
    autoTable(pdf, {
      body: serviceData,
      startY: currentY,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 80, halign: 'right' }
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 4
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }
  
  // Payment terms and conditions
  if (billData.payment_terms || billData.due_date) {
    currentY += 10;
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Payment Information', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    
    if (billData.due_date) {
      pdf.text(`Payment Due Date: ${formatDate(billData.due_date)}`, 15, currentY);
      currentY += 6;
    }
    
    if (billData.payment_terms) {
      pdf.text(`Payment Terms: ${billData.payment_terms}`, 15, currentY);
      currentY += 6;
    }
    
    currentY += 4;
  }
  
  // Notes section if available
  if (billData.notes) {
    currentY += 5;
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Additional Notes:', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const notesLines = pdf.splitTextToSize(billData.notes, pageWidth - 30);
    pdf.text(notesLines, 15, currentY);
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
  const startY = addCompanyHeader(pdf, 'Sales Invoice', `Invoice #${invoiceData.invoiceNumber || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Split into two columns for customer and invoice details
  const pageWidth = pdf.internal.pageSize.width;
  const columnWidth = (pageWidth - 45) / 2;
  
  // Customer/Bill To section (left column)
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Bill To', 15, currentY);
  currentY += 8;
  
  pdf.setFontSize(PDF_STYLES.fonts.body);
  pdf.setTextColor(...PDF_STYLES.colors.black);
  
  // Company name (bold)
  pdf.setFont(undefined, 'bold');
  pdf.text(formatString(invoiceData.companyName), 15, currentY);
  pdf.setFont(undefined, 'normal');
  currentY += 8;
  
  if (invoiceData.customer_address) {
    const addressLines = pdf.splitTextToSize(invoiceData.customer_address, columnWidth);
    pdf.text(addressLines, 15, currentY);
    currentY += 6 * addressLines.length;
  }
  
  // Invoice Information section (right column)
  let rightColumnY = startY + 18;
  const rightColumnX = 15 + columnWidth + 15;
  
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Invoice Information', rightColumnX, rightColumnY);
  rightColumnY += 10;
  
  const invoiceDetails = [
    ['Invoice Number:', formatString(invoiceData.invoiceNumber)],
    ['Company Name:', formatString(invoiceData.companyName)],
    ['Product Name:', formatString(invoiceData.productName)],
    ['Quantity:', formatNumber(invoiceData.quantity)],
    ['Rate:', formatCurrency(invoiceData.rate)],
    ['Created Date:', formatDate(invoiceData.createdAt)]
  ];
  
  autoTable(pdf, {
    body: invoiceDetails,
    startY: rightColumnY,
    margin: { left: rightColumnX },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: PDF_STYLES.colors.gray },
      1: { cellWidth: 50, textColor: PDF_STYLES.colors.black }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 2
    }
  });
  
  currentY = Math.max(currentY, (pdf as jsPDFWithAutoTable).lastAutoTable.finalY) + 15;
  
  // Related Order Information (if available)
  if (invoiceData.order) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Related Order Information', 15, currentY);
    currentY += 10;
    
    const orderDetails = [
      ['Order Number:', formatString(invoiceData.order.orderNumber)],
      ['Order Date:', formatDate(invoiceData.order.orderDate)],
      ['Order Status:', formatString(invoiceData.order.status?.replace(/_/g, ' ').toUpperCase())]
    ];
    
    if (invoiceData.order.deliveryDate) {
      orderDetails.push(['Delivery Date:', formatDate(invoiceData.order.deliveryDate)]);
    }
    
    autoTable(pdf, {
      body: orderDetails,
      startY: currentY,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, textColor: PDF_STYLES.colors.gray },
        1: { cellWidth: 120, textColor: PDF_STYLES.colors.black }
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 3
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }
  
  // Financial Breakdown section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Financial Breakdown', 15, currentY);
  currentY += 10;
  
  // Create comprehensive financial breakdown table
  const financialData = [
    ['Subtotal:', formatCurrency(invoiceData.subtotal)],
    [`GST (${formatNumber(invoiceData.gstPercentage)}%):`, formatCurrency(invoiceData.gstAmount)]
  ];
  
  // Add transport charge if included
  if (invoiceData.transportIncluded && invoiceData.transportCharge > 0) {
    financialData.push(['Transport Charge:', formatCurrency(invoiceData.transportCharge)]);
  }
  
  // Add other expenses if any
  if (invoiceData.otherExpenses > 0) {
    financialData.push(['Other Expenses:', formatCurrency(invoiceData.otherExpenses)]);
  }
  
  // Add total amount
  financialData.push(['Total Amount:', formatCurrency(invoiceData.totalAmount)]);
  
  autoTable(pdf, {
    body: financialData,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80, textColor: PDF_STYLES.colors.gray },
      1: { cellWidth: 100, halign: 'right', textColor: PDF_STYLES.colors.black }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 4
    },
    didParseCell: function(data) {
      // Highlight the total row
      if (data.row.index === financialData.length - 1) {
        data.cell.styles.fillColor = PDF_STYLES.colors.light;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = PDF_STYLES.fonts.heading;
        data.cell.styles.textColor = PDF_STYLES.colors.secondary;
      }
    }
  });
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // Transport Details section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Transport Details', 15, currentY);
  currentY += 10;
  
  const transportDetails = [
    ['Transport Included:', invoiceData.transportIncluded ? 'Yes' : 'No']
  ];
  
  if (invoiceData.transportIncluded && invoiceData.transportCharge > 0) {
    transportDetails.push(['Transport Charge:', formatCurrency(invoiceData.transportCharge)]);
  }
  
  autoTable(pdf, {
    body: transportDetails,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60, textColor: PDF_STYLES.colors.gray },
      1: { cellWidth: 120, textColor: PDF_STYLES.colors.black }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // GST and Tax Information
  if (invoiceData.gstPercentage > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Tax Information', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(`This invoice is subject to ${formatNumber(invoiceData.gstPercentage)}% GST as per applicable tax regulations.`, 15, currentY);
    currentY += 6;
    pdf.text('Please ensure timely payment to avoid any late fees or penalties.', 15, currentY);
    currentY += 10;
  }
  
  // Notes section (if available)
  if (invoiceData.notes && invoiceData.notes.trim()) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Additional Notes', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const notesLines = pdf.splitTextToSize(invoiceData.notes, pageWidth - 30);
    pdf.text(notesLines, 15, currentY);
    currentY += 6 * notesLines.length;
  }
  
  // Payment terms (if space allows)
  if (currentY < 240) {
    currentY += 10;
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Payment Terms & Conditions', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text('• Payment due within 30 days of invoice date', 15, currentY);
    currentY += 6;
    pdf.text('• Late payment charges may apply after due date', 15, currentY);
    currentY += 6;
    pdf.text('• All disputes subject to local jurisdiction', 15, currentY);
  }
  
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
  
  // Supplier Information section (left column)
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Supplier Information', 15, currentY);
  currentY += 8;
  
  pdf.setFontSize(PDF_STYLES.fonts.body);
  pdf.setTextColor(...PDF_STYLES.colors.black);
  
  // Supplier name (bold)
  pdf.setFont(undefined, 'bold');
  pdf.text(formatString(purchaseData.supplier_name), 15, currentY);
  pdf.setFont(undefined, 'normal');
  currentY += 8;
  
  if (purchaseData.supplier_contact) {
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    pdf.text('Contact Person:', 15, currentY);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(purchaseData.supplier_contact), 15, currentY + 6);
    currentY += 12;
  }
  
  if (purchaseData.supplier_phone) {
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    pdf.text('Phone:', 15, currentY);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(purchaseData.supplier_phone), 15, currentY + 6);
    currentY += 12;
  }
  
  if (purchaseData.supplier_gst) {
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    pdf.text('GST Number:', 15, currentY);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(purchaseData.supplier_gst), 15, currentY + 6);
    currentY += 12;
  }
  
  if (purchaseData.supplier_address) {
    pdf.setTextColor(...PDF_STYLES.colors.gray);
    pdf.text('Address:', 15, currentY);
    currentY += 6;
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const addressLines = pdf.splitTextToSize(purchaseData.supplier_address, columnWidth);
    pdf.text(addressLines, 15, currentY);
    currentY += 6 * addressLines.length;
  }
  
  // Purchase Details section (right column)
  let rightColumnY = startY + 18;
  const rightColumnX = 15 + columnWidth + 15;
  
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Purchase Details', rightColumnX, rightColumnY);
  rightColumnY += 10;
  
  const purchaseDetails = [
    ['Purchase Number:', formatString(purchaseData.purchase_number)],
    ['Purchase Date:', formatDate(purchaseData.purchase_date)],
    ['Status:', formatString(purchaseData.status?.replace(/_/g, ' ').toUpperCase())],
    ['Invoice Number:', formatString(purchaseData.invoice_number)],
    ['Created At:', formatDate(purchaseData.created_at)]
  ];
  
  autoTable(pdf, {
    body: purchaseDetails,
    startY: rightColumnY,
    margin: { left: rightColumnX },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35, textColor: PDF_STYLES.colors.gray },
      1: { cellWidth: 50, textColor: PDF_STYLES.colors.black }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 2
    }
  });
  
  currentY = Math.max(currentY, (pdf as jsPDFWithAutoTable).lastAutoTable.finalY) + 15;
  
  // Purchase Items section with comprehensive details matching frontend
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Purchase Items', 15, currentY);
  currentY += 10;
  
  const items = purchaseData.purchase_items || [];
  const itemRows = items.map((item: PDFDataItem) => {
    // Use alt_quantity if available, otherwise calculate from main quantity * conversion rate
    const altQuantity = item.alt_quantity || ((item.quantity || 0) * (item.conversion_rate || 1));
    
    const materialSpecs = [
      item.color ? `Color: ${item.color}` : '',
      item.gsm ? `GSM: ${item.gsm}` : ''
    ].filter(Boolean).join(', ') || '-';
    
    return [
      formatString(item.material_name),
      materialSpecs,
      formatNumber(altQuantity.toFixed(2)),
      formatString(item.alternate_unit),
      formatNumber(item.quantity),
      formatString(item.unit),
      formatNumber(item.actual_meter || 0),
      formatCurrency(item.alt_unit_price || 0),
      formatCurrency(item.unit_price),
      `${formatNumber(item.gst_percentage)}%`,
      formatCurrency(item.gst_amount),
      formatCurrency(item.transport_share || 0),
      formatCurrency(item.line_total)
    ];
  });
  
  autoTable(pdf, {
    head: [['Material', 'Specifications', 'Alt. Qty', 'Alt. Unit', 'Main Qty', 'Main Unit', 'Actual Meter', 'Alt. Unit Price', 'Unit Price', 'GST %', 'GST Amount', 'Transport Share', 'Line Total']],
    body: itemRows,
    startY: currentY,
    theme: 'striped',
    headStyles: {
      fillColor: PDF_STYLES.colors.primary,
      textColor: PDF_STYLES.colors.white,
      fontStyle: 'bold',
      fontSize: PDF_STYLES.fonts.small
    },
    styles: {
      fontSize: PDF_STYLES.fonts.small - 1,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { cellWidth: 18 },                    // Material
      1: { cellWidth: 16 },                    // Specifications
      2: { cellWidth: 12, halign: 'center' },  // Alt. Qty
      3: { cellWidth: 12, halign: 'center' },  // Alt. Unit
      4: { cellWidth: 12, halign: 'center' },  // Main Qty
      5: { cellWidth: 12, halign: 'center' },  // Main Unit
      6: { cellWidth: 12, halign: 'center' },  // Actual Meter
      7: { cellWidth: 15, halign: 'right' },   // Alt. Unit Price
      8: { cellWidth: 15, halign: 'right' },   // Unit Price
      9: { cellWidth: 10, halign: 'center' },  // GST %
      10: { cellWidth: 15, halign: 'right' },  // GST Amount
      11: { cellWidth: 15, halign: 'right' },  // Transport Share
      12: { cellWidth: 15, halign: 'right' }   // Line Total
    }
  });
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  
  // Summary section with comprehensive totals
  const summaryStartY = currentY;
  
  // Left side - Notes (if available)
  if (purchaseData.notes) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Notes', 15, currentY);
    currentY += 8;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const notesLines = pdf.splitTextToSize(purchaseData.notes, columnWidth - 10);
    pdf.text(notesLines, 15, currentY);
  }
  
  // Right side - Financial Summary
  const summaryX = rightColumnX;
  let summaryY = summaryStartY;
  
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Financial Summary', summaryX, summaryY);
  summaryY += 10;
  
  // Create a bordered summary box
  const summaryData = [
    ['Subtotal:', formatCurrency(purchaseData.subtotal)],
    ['Transport Charge:', formatCurrency(purchaseData.transport_charge)],
    ['Total Amount:', formatCurrency(purchaseData.total_amount)]
  ];
  
  autoTable(pdf, {
    body: summaryData,
    startY: summaryY,
    margin: { left: summaryX },
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: PDF_STYLES.colors.gray },
      1: { cellWidth: 40, halign: 'right', textColor: PDF_STYLES.colors.black }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    },
    didParseCell: function(data) {
      // Highlight the total row
      if (data.row.index === summaryData.length - 1) {
        data.cell.styles.fillColor = PDF_STYLES.colors.light;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = PDF_STYLES.fonts.heading;
        data.cell.styles.textColor = PDF_STYLES.colors.secondary;
      }
    }
  });
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Generate bulk orders PDF for order list exports
 */
export function generateBulkOrdersPDF(orders: PDFDataItem[], filename: string = 'orders-list'): void {
  const pdf = new jsPDF();
  
  // Add header
  addCompanyHeader(pdf, 'Orders List Export');
  
  // Add summary
  let currentY = 80;
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.primary);
  pdf.text(`Total Orders: ${orders.length}`, 15, currentY);
  pdf.text(`Export Date: ${formatDate(new Date())}`, 15, currentY + 10);
  
  currentY += 30;
  
  // Prepare table data
  const tableHeaders = [
    'Order Number', 'Company', 'Product', 'Quantity', 
    'Bag Size', 'Rate', 'Total', 'Status', 'Date'
  ];
  
  const tableData = orders.map(order => [
    formatString(order['order_number']),
    formatString(order['company_name']),
    formatString(order['product_name'], 'Standard Bag'),
    formatNumber(order['quantity']),
    formatString(order['bag_size']),
    formatCurrency(order['rate']),
    formatCurrency(order['total_amount']),
    formatString(order['status']),
    formatDate(order['order_date'])
  ]);
  
  // Add table
  autoTable(pdf, {
    head: [tableHeaders],
    body: tableData,
    startY: currentY,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { 
      fillColor: PDF_STYLES.colors.primary,
      textColor: PDF_STYLES.colors.white,
      fontSize: 10,
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 25 }, // Order Number
      1: { cellWidth: 30 }, // Company
      2: { cellWidth: 25 }, // Product
      3: { cellWidth: 20 }, // Quantity
      4: { cellWidth: 25 }, // Bag Size
      5: { cellWidth: 20 }, // Rate
      6: { cellWidth: 25 }, // Total
      7: { cellWidth: 20 }, // Status
      8: { cellWidth: 25 }  // Date
    }
  });
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

/**
 * Generate individual order PDF
 */
export function generateIndividualOrderPDF(orderData: Record<string, unknown>, filename: string): void {
  const pdf = new jsPDF();
  
  // Add header
  addCompanyHeader(pdf, 'Order Details');
  
  let currentY = 85;
  
  // Order header information
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.primary);
  pdf.text(`Order #${formatString(orderData.order_number)}`, 15, currentY);
  
  currentY += 15;
  pdf.setFontSize(PDF_STYLES.fonts.body);
  pdf.setTextColor(...PDF_STYLES.colors.black);
  
  // Customer details
  const leftColumnX = 15;
  const rightColumnX = 110;
  
  pdf.text(`Company: ${formatString(orderData.company_name)}`, leftColumnX, currentY);
  pdf.text(`Order Date: ${formatDate(orderData.order_date)}`, rightColumnX, currentY);
  
  currentY += 10;
  pdf.text(`Status: ${formatString(orderData.status)}`, leftColumnX, currentY);
  pdf.text(`Created: ${formatDate(orderData.created_at)}`, rightColumnX, currentY);
  
  currentY += 20;
  
  // Product details table
  const productHeaders = ['Property', 'Value'];
  const productData = [
    ['Product Type', formatString(orderData.catalog_name || orderData.product_name, 'Standard Bag')],
    ['Quantity', formatNumber(orderData.quantity)],
    ['Bag Length', `${formatNumber(orderData.bag_length)} units`],
    ['Bag Width', `${formatNumber(orderData.bag_width)} units`],
    ['Border Dimension', formatNumber(orderData.border_dimension) + ' units'],
    ['Rate per Unit', formatCurrency(orderData.rate)],
    ['Total Amount', formatCurrency(Number(orderData.rate || 0) * Number(orderData.quantity || 0))]
  ];
  
  autoTable(pdf, {
    head: [productHeaders],
    body: productData,
    startY: currentY,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { 
      fillColor: PDF_STYLES.colors.primary,
      textColor: PDF_STYLES.colors.white,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 80 }
    }
  });
  
  currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 20;
  
  // Cost breakdown if available
  if (orderData.material_cost || orderData.cutting_charge || orderData.printing_charge) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.primary);
    pdf.text('Cost Breakdown', leftColumnX, currentY);
    currentY += 15;
    
    const costHeaders = ['Cost Type', 'Amount'];
    const costData = [];
    
    if (orderData.material_cost) costData.push(['Material Cost', formatCurrency(orderData.material_cost)]);
    if (orderData.cutting_charge) costData.push(['Cutting Charge', formatCurrency(orderData.cutting_charge)]);
    if (orderData.printing_charge) costData.push(['Printing Charge', formatCurrency(orderData.printing_charge)]);
    if (orderData.stitching_charge) costData.push(['Stitching Charge', formatCurrency(orderData.stitching_charge)]);
    if (orderData.transport_charge) costData.push(['Transport Charge', formatCurrency(orderData.transport_charge)]);
    if (orderData.total_cost) costData.push(['Total Cost', formatCurrency(orderData.total_cost)]);
    if (orderData.margin) costData.push(['Margin', formatCurrency(orderData.margin)]);
    
    if (costData.length > 0) {
      autoTable(pdf, {
        head: [costHeaders],
        body: costData,
        startY: currentY,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { 
          fillColor: PDF_STYLES.colors.secondary,
          textColor: PDF_STYLES.colors.white,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' },
          1: { cellWidth: 60, halign: 'right' }
        }
      });
      
      currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
    }
  }
  
  // Special instructions
  if (orderData.special_instructions) {
    currentY += 10;
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.primary);
    pdf.text('Special Instructions:', leftColumnX, currentY);
    currentY += 10;
    
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    const instructionsLines = pdf.splitTextToSize(String(orderData.special_instructions), 180);
    pdf.text(instructionsLines, leftColumnX, currentY);
  }
  
  // Add footer
  addFooter(pdf, 1, 1);
  
  // Save the PDF
  pdf.save(`${filename}.pdf`);
}

// Export the existing functions for backward compatibility
export { downloadAsCSV } from './downloadUtils';
