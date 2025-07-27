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
    quantity?: number;
    bag_length?: number;
    bag_width?: number;
    order_date?: string | Date;
    status?: string;
    components?: Array<{
      id?: string;
      component_type?: string;
      size?: string;
      color?: string;
      gsm?: string;
      custom_name?: string;
      inventory?: {
        material_name?: string;
        color?: string;
        gsm?: string;
      };
    }>;
  };
  cutting_jobs?: Array<{
    id?: string;
    status?: string;
    worker_name?: string;
    received_quantity?: number;
    created_at?: string | Date;
  }>;
  printing_jobs?: Array<{
    id?: string;
    status?: string;
    worker_name?: string;
    received_quantity?: number;
    created_at?: string | Date;
  }>;
  stitching_jobs?: Array<{
    id?: string;
    status?: string;
    worker_name?: string;
    received_quantity?: number;
    created_at?: string | Date;
  }>;
}

interface MaterialSummary {
  material_id: string;
  material_name: string;
  color: string | null;
  gsm: string | null;
  total_consumption: number;
  unit: string;
  purchase_rate: number | null;
  total_cost: number;
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
  console.log("PDF GENERATION - Job Card Data:", jobCardData);
  console.log("PDF GENERATION - Order Components:", jobCardData.order?.components);
  
  const pdf = new jsPDF();
  
  // Header
  const startY = addCompanyHeader(pdf, 'Job Card Details', `${jobCardData.job_name || 'N/A'}`);
  
  let currentY = startY + 10;
  
  // Job Card Information
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Job Card Information', 15, currentY);
  currentY += 10;
  
  const jobInfo = [
    ['Job Name:', formatString(jobCardData.job_name)],
    ['Job Number:', formatString(jobCardData.job_number)],
    ['Status:', formatString(jobCardData.status?.replace(/_/g, ' ').toUpperCase())],
    ['Created Date:', formatDate(jobCardData.created_at)]
  ];
  
  autoTable(pdf, {
    body: jobInfo,
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
  
  // Order Information Section
  if (jobCardData.order) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Order Information', 15, currentY);
    currentY += 10;
    
    const orderInfo = [
      ['Order Number:', formatString(jobCardData.order.order_number)],
      ['Company:', formatString(jobCardData.order.company_name)],
      ['Quantity:', formatNumber(jobCardData.order.quantity)],
      ['Bag Dimensions:', `${formatNumber(jobCardData.order.bag_length)} × ${formatNumber(jobCardData.order.bag_width)}`],
      ['Order Date:', formatDate(jobCardData.order.order_date)],
      ['Order Status:', formatString(jobCardData.order.status?.replace(/_/g, ' ').toUpperCase())]
    ];
    
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
  }
  
  // Order Components/Materials Section
  if (jobCardData.order?.components && jobCardData.order.components.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Order Components & Materials', 15, currentY);
    currentY += 10;
    
    const componentHeaders = ['Component Type', 'Specifications', 'Material Details'];
    const componentData = jobCardData.order.components.map((component: JobCardData['order']['components'][0]) => [
      formatString(component.component_type?.toUpperCase()),
      [
        component.size ? `Size: ${component.size}` : null,
        component.color ? `Color: ${component.color}` : null,
        component.gsm ? `GSM: ${component.gsm}` : null,
        component.custom_name ? `Name: ${component.custom_name}` : null
      ].filter(Boolean).join('\n') || '-',
      component.inventory ? 
        `${component.inventory.material_name}\n${component.inventory.color ? `Color: ${component.inventory.color}` : ''}\n${component.inventory.gsm ? `GSM: ${component.inventory.gsm}` : ''}`.trim() 
        : '-'
    ]);
    
    autoTable(pdf, {
      head: [componentHeaders],
      body: componentData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { 
        fillColor: PDF_STYLES.colors.secondary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { cellWidth: 75 }
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
  }
  
  // Production Jobs Section
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Production Jobs Details', 15, currentY);
  currentY += 10;
  
  // Cutting Jobs
  if (jobCardData.cutting_jobs && jobCardData.cutting_jobs.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.body + 1);
    pdf.setTextColor(...PDF_STYLES.colors.primary);
    pdf.text('Cutting Jobs', 15, currentY);
    currentY += 8;
    
    const cuttingHeaders = ['Worker', 'Status', 'Quantity', 'Created Date'];
    const cuttingData = jobCardData.cutting_jobs.map(job => [
      formatString(job.worker_name),
      formatString(job.status?.toUpperCase()),
      formatNumber(job.received_quantity),
      formatDate(job.created_at)
    ]);
    
    autoTable(pdf, {
      head: [cuttingHeaders],
      body: cuttingData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { 
        fillColor: PDF_STYLES.colors.primary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 }
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }
  
  // Printing Jobs
  if (jobCardData.printing_jobs && jobCardData.printing_jobs.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.body + 1);
    pdf.setTextColor(...PDF_STYLES.colors.primary);
    pdf.text('Printing Jobs', 15, currentY);
    currentY += 8;
    
    const printingHeaders = ['Worker', 'Status', 'Quantity', 'Created Date'];
    const printingData = jobCardData.printing_jobs.map(job => [
      formatString(job.worker_name),
      formatString(job.status?.toUpperCase()),
      formatNumber(job.received_quantity),
      formatDate(job.created_at)
    ]);
    
    autoTable(pdf, {
      head: [printingHeaders],
      body: printingData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { 
        fillColor: PDF_STYLES.colors.primary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 }
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }
  
  // Stitching Jobs
  if (jobCardData.stitching_jobs && jobCardData.stitching_jobs.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.body + 1);
    pdf.setTextColor(...PDF_STYLES.colors.primary);
    pdf.text('Stitching Jobs', 15, currentY);
    currentY += 8;
    
    const stitchingHeaders = ['Worker', 'Status', 'Quantity', 'Created Date'];
    const stitchingData = jobCardData.stitching_jobs.map(job => [
      formatString(job.worker_name),
      formatString(job.status?.toUpperCase()),
      formatNumber(job.received_quantity),
      formatDate(job.created_at)
    ]);
    
    autoTable(pdf, {
      head: [stitchingHeaders],
      body: stitchingData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { 
        fillColor: PDF_STYLES.colors.primary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 }
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
  }
  
  // Production Summary
  currentY += 5;
  pdf.setFontSize(PDF_STYLES.fonts.heading);
  pdf.setTextColor(...PDF_STYLES.colors.secondary);
  pdf.text('Production Summary', 15, currentY);
  currentY += 10;
  
  const summaryData = [
    ['Total Cutting Jobs:', formatNumber(jobCardData.cutting_jobs?.length || 0)],
    ['Total Printing Jobs:', formatNumber(jobCardData.printing_jobs?.length || 0)],
    ['Total Stitching Jobs:', formatNumber(jobCardData.stitching_jobs?.length || 0)],
    ['Overall Status:', formatString(jobCardData.status?.replace(/_/g, ' ').toUpperCase())]
  ];
  
  autoTable(pdf, {
    body: summaryData,
    startY: currentY,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 50 }
    },
    styles: {
      fontSize: PDF_STYLES.fonts.body,
      cellPadding: 3
    }
  });
  
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
    
    const batchDetails = dispatchData.batches.map((batch: PDFDataItem) => [
      `Batch ${batch.batch_number || 'N/A'}`,
      formatNumber(batch.quantity),
      formatDate(batch.delivery_date),
      formatString(batch.status?.toUpperCase() || 'PENDING'),
      formatString(batch.notes)
    ]);
    
    autoTable(pdf, {
      head: [['Batch #', 'Quantity', 'Delivery Date', 'Status', 'Notes']],
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
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 80 }
      },
      foot: [['Total Quantity:', formatNumber(dispatchData.total_quantity), '', '', '']],
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
  
  // Get the correct values from cost calculation data if available
  const quantity = orderData.order_quantity || orderData.quantity || 0;
  
  // Use selling price from cost calculation if available, otherwise fall back to calculated_selling_price or rate
  const totalSellingPrice = orderData.sellingPrice || orderData.calculated_selling_price || (Number(orderData.rate || 0) * Number(quantity));
  const sellingPricePerPiece = Number(quantity) > 0 ? Number(totalSellingPrice) / Number(quantity) : 0;
  
  const productData = [
    ['Catalog Product', formatString(orderData.catalog_product_name, 'N/A')],
    ['Quantity', formatNumber(quantity)],
    ['Bag Length', `${formatNumber(orderData.bag_length)} units`],
    ['Bag Width', `${formatNumber(orderData.bag_width)} units`],
    ['Border Dimension', formatNumber(orderData.border_dimension) + ' units'],
    ['Selling Price per Piece', formatCurrency(sellingPricePerPiece)],
    ['Total Selling Price', formatCurrency(totalSellingPrice)]
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
  
  // Material consumption table if available
  if (orderData.material_summary && Array.isArray(orderData.material_summary) && orderData.material_summary.length > 0) {
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.primary);
    pdf.text('Material Consumption', leftColumnX, currentY);
    currentY += 15;
    
    const materialHeaders = ['Material', 'Specifications', 'Consumption'];
    const materialData = (orderData.material_summary as MaterialSummary[]).map((material: MaterialSummary) => [
      formatString(material.material_name),
      [
        material.color ? `Color: ${material.color}` : null,
        material.gsm ? `GSM: ${material.gsm}` : null
      ].filter(Boolean).join(', ') || '-',
      `${formatNumber(material.total_consumption)} ${formatString(material.unit)}`
    ]);
    
    autoTable(pdf, {
      head: [materialHeaders],
      body: materialData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { 
        fillColor: PDF_STYLES.colors.secondary,
        textColor: PDF_STYLES.colors.white,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 70 },
        2: { cellWidth: 55 }
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
    
    // Remove the total material cost section since we're not showing costs anymore
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

/**
 * Generate comprehensive job details PDF with all component information
 */
export function generateDetailedJobPDF(jobData: any, filename: string): void {
  try {
    if (!jobData) {
      throw new Error('No job data provided');
    }

    const pdf = new jsPDF();
    
    // Header
    const startY = addCompanyHeader(pdf, 'Job Details', `${jobData.job_card?.job_name || 'N/A'}`);
    
    let currentY = startY + 10;
    
    // Job Overview Section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Job Overview', 15, currentY);
    currentY += 10;
    
    // Job overview grid
    const overviewData = [
      ['Job Name:', formatString(jobData.job_card?.job_name)],
      ['Job Number:', formatString(jobData.job_card?.job_number)],
      ['Created:', formatDate(jobData.created_at)],
      ['Worker:', formatString(jobData.worker_name)],
      ['Type:', formatString(jobData.is_internal ? 'Internal' : 'External')],
      ['Rate:', formatString(jobData.rate ? `₹${jobData.rate}` : 'N/A')]
    ];
    
    autoTable(pdf, {
      body: overviewData,
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
    
    // Components Section
    if (jobData.components && Array.isArray(jobData.components) && jobData.components.length > 0) {
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
      pdf.text('Components Details', 15, currentY);
      currentY += 10;
      
      // Main Components
      const mainComponents = jobData.components.filter((comp: any) => 
        comp.order_component?.component_type === 'part' || 
        comp.order_component?.component_type === 'border' || 
        comp.order_component?.component_type === 'handle'
      );
      
      if (mainComponents.length > 0) {
        pdf.setFontSize(PDF_STYLES.fonts.body);
        pdf.setTextColor(...PDF_STYLES.colors.gray);
        pdf.text('Main Components', 15, currentY);
        currentY += 8;
        
        mainComponents.forEach((component: any, index: number) => {
          // Component header
          pdf.setFontSize(PDF_STYLES.fonts.body);
          pdf.setTextColor(...PDF_STYLES.colors.primary);
          pdf.text(`${index + 1}. ${component.order_component?.component_type?.toUpperCase()} - ${component.width}x${component.height}`, 15, currentY);
          currentY += 6;
          
          // Material info
          if (component.order_component?.inventory) {
            const material = component.order_component.inventory;
            pdf.setTextColor(...PDF_STYLES.colors.black);
            pdf.text(`Material: ${material.material_name} ${material.gsm}gsm ${material.color}`, 20, currentY);
            currentY += 5;
          }
          
          // Component details
          const componentDetails = [
            ['Width:', formatNumber(component.width)],
            ['Height:', formatNumber(component.height)],
            ['Counter:', formatString(component.counter)],
            ['Rewinding:', formatString(component.rewinding)],
            ['Roll Width:', formatNumber(component.roll_width)],
            ['Rate:', formatString(component.rate)],
            ['Consumption:', formatNumber(component.consumption)]
          ];
          
          autoTable(pdf, {
            body: componentDetails,
            startY: currentY,
            theme: 'plain',
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 40 },
              1: { cellWidth: 30 }
            },
            styles: {
              fontSize: PDF_STYLES.fonts.small,
              cellPadding: 2
            },
            margin: { left: 20 }
          });
          
          currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 8;
          
          // Check if we need a new page
          if (currentY > 250) {
            pdf.addPage();
            currentY = 20;
          }
        });
      }
      
      // Small Components
      const smallComponents = jobData.components.filter((comp: any) => 
        comp.order_component?.component_type !== 'part' && 
        comp.order_component?.component_type !== 'border' && 
        comp.order_component?.component_type !== 'handle'
      );
      
      if (smallComponents.length > 0) {
        pdf.setFontSize(PDF_STYLES.fonts.body);
        pdf.setTextColor(...PDF_STYLES.colors.gray);
        pdf.text('Small Components', 15, currentY);
        currentY += 8;
        
        const smallComponentsData = smallComponents.map((component: any) => [
          formatString(component.order_component?.component_type?.toUpperCase()),
          formatString(component.order_component?.inventory?.material_name || 'No material linked'),
          formatNumber(component.consumption || 0)
        ]);
        
        autoTable(pdf, {
          head: [['Component', 'Material', 'Consumption']],
          body: smallComponentsData,
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
          }
        });
        
        currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
      }
    }
    
    // Summary Section
    if (jobData.components && Array.isArray(jobData.components) && jobData.components.length > 0) {
      const totalComponents = jobData.components.length;
      const totalConsumption = jobData.components.reduce((sum: number, comp: any) => 
        sum + (Number(comp.consumption) || 0), 0
      );
      
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
      pdf.text('Summary', 15, currentY);
      currentY += 10;
      
      const summaryData = [
        ['Total Components:', formatNumber(totalComponents)],
        ['Total Consumption:', formatNumber(totalConsumption)]
      ];
      
      autoTable(pdf, {
        body: summaryData,
        startY: currentY,
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { cellWidth: 60 }
        },
        styles: {
          fontSize: PDF_STYLES.fonts.body,
          cellPadding: 4
        }
      });
    }
    
    // Add footer
    addFooter(pdf, 1, 1);
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating detailed job PDF:', error);
    throw error; // Re-throw to allow calling code to handle
  }
}

/**
 * Generate comprehensive printing job details PDF
 */
export function generateDetailedPrintingJobPDF(jobData: any, filename: string): void {
  try {
    if (!jobData) {
      throw new Error('No printing job data provided');
    }

    const pdf = new jsPDF();
    const startY = addCompanyHeader(pdf, 'Printing Job Details', `${jobData.job_card?.job_name || 'N/A'}`);
    let currentY = startY + 10;

    // 1. Printer's Name
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text("Printer's Name", 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(jobData.worker_name), 60, currentY);
    currentY += 10;

    // 2. Job Number
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Job Number', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(jobData.job_card?.job_number), 60, currentY);
    currentY += 10;

    // 3. Date
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Date', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatDate(jobData.created_at), 60, currentY);
    currentY += 15;

    // Separator
    pdf.setDrawColor(...PDF_STYLES.colors.light);
    pdf.setLineWidth(0.5);
    pdf.line(15, currentY, pdf.internal.pageSize.width - 15, currentY);
    currentY += 8;

    // 4. Job Name
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Job Name', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(jobData.job_card?.job_name), 60, currentY);
    currentY += 10;

    // 5. Material
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Material', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    let material = 'N/A';
    
    // Get material from order components - same logic as cutting job
    if (jobData.job_card?.order?.components && Array.isArray(jobData.job_card.order.components)) {
      const partComponent = jobData.job_card.order.components.find((c: any) => 
        c.component_type === 'part' && c.inventory?.material_name
      );
      if (partComponent) {
        material = formatString(partComponent.inventory.material_name);
      }
    }
    // Fallback to direct material fields
    else if (jobData.material) {
      material = formatString(jobData.material);
    } else if (jobData.job_card?.material) {
      material = formatString(jobData.job_card.material);
    }
    
    pdf.text(material, 60, currentY);
    currentY += 10;

    // 6. Pulling
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Pulling', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(jobData.pulling), 60, currentY);
    currentY += 10;

    // 7. Sheet Length
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Sheet Length', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatNumber(jobData.sheet_length), 60, currentY);
    currentY += 10;

    // 8. Sheet Width
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Sheet Width', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatNumber(jobData.sheet_width), 60, currentY);
    currentY += 10;

    // 9. Quantity
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Quantity', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatNumber(jobData.received_quantity), 60, currentY);
    currentY += 10;

    // 10. Rate
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Rate', 15, currentY);
    pdf.setFontSize(PDF_STYLES.fonts.body);
    pdf.setTextColor(...PDF_STYLES.colors.black);
    pdf.text(formatString(jobData.rate), 60, currentY);
    currentY += 15;

    // 11. All other present fields
    // GSM
    if (jobData.gsm) {
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
      pdf.text('GSM', 15, currentY);
      pdf.setFontSize(PDF_STYLES.fonts.body);
      pdf.setTextColor(...PDF_STYLES.colors.black);
      pdf.text(formatString(jobData.gsm), 60, currentY);
      currentY += 10;
    }

    // Expected Completion
    if (jobData.expected_completion_date) {
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
      pdf.text('Expected Completion', 15, currentY);
      pdf.setFontSize(PDF_STYLES.fonts.body);
      pdf.setTextColor(...PDF_STYLES.colors.black);
      pdf.text(formatDate(jobData.expected_completion_date), 75, currentY);
      currentY += 15;
    }

    // Print Design Section (if available)
    if (jobData.print_image) {
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
      pdf.text('Print Design', 15, currentY);
      currentY += 10;
      pdf.setFontSize(PDF_STYLES.fonts.body);
      pdf.setTextColor(...PDF_STYLES.colors.gray);
      pdf.text('Design image is available in the system', 15, currentY);
      currentY += 8;
      pdf.text('Image URL: ' + jobData.print_image, 15, currentY);
      currentY += 15;
    }

    // Summary Section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Summary', 15, currentY);
    currentY += 10;
    const summaryData = [
      ['Total Received:', formatNumber(jobData.received_quantity)],
      ['Job Status:', formatString(jobData.status?.toUpperCase())],
      ['Worker Assigned:', formatString(jobData.worker_name)],
      ['Job Type:', formatString(jobData.is_internal ? 'Internal' : 'External')]
    ];
    autoTable(pdf, {
      body: summaryData,
      startY: currentY,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 60 }
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 4
      }
    });

    // Add footer
    addFooter(pdf, 1, 1);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating detailed printing job PDF:', error);
    throw error;
  }
}

/**
 * Generate comprehensive stitching job details PDF
 */
export function generateDetailedStitchingJobPDF(jobData: any, filename: string): void {
  try {
    if (!jobData) {
      throw new Error('No stitching job data provided');
    }

    const pdf = new jsPDF();
    
    // Header
    const startY = addCompanyHeader(pdf, 'Stitching Job Details', `${jobData.job_card?.job_name || 'N/A'}`);
    
    let currentY = startY + 10;
    
    // Job Overview Section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Job Overview', 15, currentY);
    currentY += 10;
    
    // Job overview grid
    const overviewData = [
      ['Job Name:', formatString(jobData.job_card?.job_name)],
      ['Job Number:', formatString(jobData.job_card?.job_number)],
      ['Job ID:', formatString(jobData.id)],
      ['Status:', formatString(jobData.status?.toUpperCase())],
      ['Created:', formatDate(jobData.created_at)],
      ['Worker:', formatString(jobData.worker_name)],
      ['Type:', formatString(jobData.is_internal ? 'Internal' : 'External')]
    ];
    
    autoTable(pdf, {
      body: overviewData,
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
    
    // Stitching Specifications Section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Stitching Specifications', 15, currentY);
    currentY += 10;
    
    const stitchingSpecs = [
      ['Start Date:', formatDate(jobData.start_date)],
      ['Expected Completion:', formatDate(jobData.expected_completion_date)],
      ['Rate:', formatString(jobData.rate)],
      ['Total Quantity:', formatNumber(jobData.provided_quantity)]
    ];
    
    autoTable(pdf, {
      body: stitchingSpecs,
      startY: currentY,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 110 }
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 4
      }
    });
    
    currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
    
    // Component Quantities Section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Component Quantities', 15, currentY);
    currentY += 10;
    
    const componentQuantities = [];
    
    if (jobData.part_quantity !== null) {
      componentQuantities.push(['Part:', formatNumber(jobData.part_quantity)]);
    }
    if (jobData.border_quantity !== null) {
      componentQuantities.push(['Border:', formatNumber(jobData.border_quantity)]);
    }
    if (jobData.handle_quantity !== null) {
      componentQuantities.push(['Handle:', formatNumber(jobData.handle_quantity)]);
    }
    if (jobData.chain_quantity !== null) {
      componentQuantities.push(['Chain:', formatNumber(jobData.chain_quantity)]);
    }
    if (jobData.piping_quantity !== null) {
      componentQuantities.push(['Piping:', formatNumber(jobData.piping_quantity)]);
    }
    if (jobData.runner_quantity !== null) {
      componentQuantities.push(['Runner:', formatNumber(jobData.runner_quantity)]);
    }
    
    if (componentQuantities.length > 0) {
      autoTable(pdf, {
        body: componentQuantities,
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
      
      currentY = (pdf as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
    }
    
    // Notes Section (if available)
    if (jobData.notes) {
      pdf.setFontSize(PDF_STYLES.fonts.heading);
      pdf.setTextColor(...PDF_STYLES.colors.secondary);
      pdf.text('Additional Notes', 15, currentY);
      currentY += 10;
      
      pdf.setFontSize(PDF_STYLES.fonts.body);
      pdf.setTextColor(...PDF_STYLES.colors.black);
      
      // Split notes into lines that fit the page width
      const maxWidth = pdf.internal.pageSize.width - 30; // 15px margin on each side
      const notesLines = pdf.splitTextToSize(jobData.notes, maxWidth);
      
      notesLines.forEach((line: string) => {
        pdf.text(line, 15, currentY);
        currentY += 6;
      });
      
      currentY += 10;
    }
    
    // Summary Section
    pdf.setFontSize(PDF_STYLES.fonts.heading);
    pdf.setTextColor(...PDF_STYLES.colors.secondary);
    pdf.text('Summary', 15, currentY);
    currentY += 10;
    
    const totalComponents = componentQuantities.length;
    const summaryData = [
      ['Total Components:', formatNumber(totalComponents)],
      ['Total Quantity:', formatNumber(jobData.provided_quantity)],
      ['Job Status:', formatString(jobData.status?.toUpperCase())],
      ['Worker Assigned:', formatString(jobData.worker_name)],
      ['Job Type:', formatString(jobData.is_internal ? 'Internal' : 'External')]
    ];
    
    autoTable(pdf, {
      body: summaryData,
      startY: currentY,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 60 }
      },
      styles: {
        fontSize: PDF_STYLES.fonts.body,
        cellPadding: 4
      }
    });
    
    // Add footer
    addFooter(pdf, 1, 1);
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating detailed stitching job PDF:', error);
    throw error;
  }
}

// Export the existing functions for backward compatibility
export { downloadAsCSV } from './downloadUtils';

/**
 * Unified function to generate PDF for any job type
 * Automatically determines the job type and calls the appropriate function
 */
export function generateJobPDF(jobData: any, filename: string): void {
  try {
    if (!jobData) {
      throw new Error('No job data provided');
    }

    // Determine job type from the data structure or table name
    let jobType = 'unknown';
    
    // Check if it's a cutting job (has components array with detailed component data)
    if (jobData.components && Array.isArray(jobData.components) && jobData.components.length > 0) {
      const hasDetailedComponents = jobData.components.some((comp: any) => 
        comp.width || comp.height || comp.consumption || comp.order_component
      );
      if (hasDetailedComponents) {
        jobType = 'cutting';
      }
    }
    
    // Check if it's a printing job (has printing-specific fields)
    if (jobData.pulling || jobData.gsm || jobData.sheet_length || jobData.sheet_width || jobData.print_image) {
      jobType = 'printing';
    }
    
    // Check if it's a stitching job (has stitching-specific fields)
    if (jobData.total_quantity || jobData.part_quantity || jobData.border_quantity || jobData.handle_quantity) {
      jobType = 'stitching';
    }

    // Call the appropriate function based on job type
    switch (jobType) {
      case 'cutting':
        generateDetailedJobPDF(jobData, filename);
        break;
      case 'printing':
        generateDetailedPrintingJobPDF(jobData, filename);
        break;
      case 'stitching':
        generateDetailedStitchingJobPDF(jobData, filename);
        break;
      default:
        // Fallback to cutting job format for unknown types
        console.warn('Unknown job type, using cutting job format as fallback');
        generateDetailedJobPDF(jobData, filename);
    }
  } catch (error) {
    console.error('Error in unified job PDF generation:', error);
    throw error;
  }
}
