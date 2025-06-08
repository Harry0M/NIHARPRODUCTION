import { SalesBill } from "@/types/salesBill";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { validateSalesBill } from './validation';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Function to format currency amounts
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Function to format dates
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Generate PDF for sales bill
export const generateSalesBillPDF = (bill: SalesBill): jsPDF => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set up constants for positioning
  const pageWidth = doc.internal.pageSize.width;
  const leftMargin = 15;
  const rightMargin = pageWidth - 15;
  
  // Add company logo (if available)
  // doc.addImage(logo, 'PNG', leftMargin, 15, 50, 20);
  
  // Add document title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES BILL', pageWidth / 2, 25, { align: 'center' });
  
  // Add bill number and date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bill #: ${bill.bill_number}`, leftMargin, 40);
  doc.text(`Date: ${formatDate(bill.bill_date)}`, rightMargin, 40, { align: 'right' });
  
  if (bill.due_date) {
    doc.text(`Due Date: ${formatDate(bill.due_date)}`, rightMargin, 47, { align: 'right' });
  }
  
  // Add status information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${bill.status.toUpperCase()}`, leftMargin, 47);
  doc.text(`Payment: ${bill.payment_status.toUpperCase()}`, leftMargin, 54);
  
  // Add company information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', leftMargin, 70);
  
  doc.setFont('helvetica', 'normal');
  doc.text(bill.company_name, leftMargin, 77);
  
  if (bill.company_address) {
    // Split address into lines if it's long
    const addressLines = doc.splitTextToSize(bill.company_address, 100);
    let yPos = 84;
    addressLines.forEach((line: string) => {
      doc.text(line, leftMargin, yPos);
      yPos += 7;
    });
  }
  
  // Add item details in a table
  doc.autoTable({
    startY: 110,
    head: [['Product', 'Quantity', 'Rate', 'Amount']],
    body: [
      [
        bill.catalog_name,
        bill.quantity.toString(),
        formatCurrency(bill.rate),
        formatCurrency(bill.subtotal)
      ]
    ],
    headStyles: {
      fillColor: [75, 75, 75],
      textColor: [255, 255, 255]
    },
    margin: { left: leftMargin, right: leftMargin },
    styles: {
      fontSize: 10
    }
  });
  
  // Calculate Y position after the table
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add summary of charges
  const summaryX = rightMargin - 80;
  
  doc.setFontSize(10);
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(formatCurrency(bill.subtotal), rightMargin, finalY, { align: 'right' });
  finalY += 7;
  
  doc.text(`GST (${bill.gst_percentage}%):`, summaryX, finalY);
  doc.text(formatCurrency(bill.gst_amount), rightMargin, finalY, { align: 'right' });
  finalY += 7;
  
  doc.text('Transport:', summaryX, finalY);
  doc.text(formatCurrency(bill.transport_charge), rightMargin, finalY, { align: 'right' });
  finalY += 7;
  
  // Add total amount with a line above
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY, rightMargin, finalY);
  finalY += 5;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', summaryX, finalY + 2);
  doc.text(formatCurrency(bill.total_amount), rightMargin, finalY + 2, { align: 'right' });
  
  // Add notes if available
  finalY += 20;
  if (bill.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', leftMargin, finalY);
    doc.setFont('helvetica', 'normal');
    
    const notesLines = doc.splitTextToSize(bill.notes, pageWidth - (leftMargin * 2));
    finalY += 7;
    doc.setFontSize(10);
    notesLines.forEach((line: string) => {
      doc.text(line, leftMargin, finalY);
      finalY += 5;
    });
  }
  
  // Add terms and conditions if available
  finalY += 10;
  if (bill.terms_and_conditions) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', leftMargin, finalY);
    doc.setFont('helvetica', 'normal');
    
    const termsLines = doc.splitTextToSize(bill.terms_and_conditions, pageWidth - (leftMargin * 2));
    finalY += 7;
    doc.setFontSize(9);
    termsLines.forEach((line: string) => {
      doc.text(line, leftMargin, finalY);
      finalY += 5;
    });
  }
  
  // Add footer with company details
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Generated on: ' + new Date().toLocaleString(), leftMargin, footerY);
  doc.text('Page 1 of 1', rightMargin, footerY, { align: 'right' });
    return doc;
};

// Function to generate and download sales bill PDF
export const downloadSalesBillPDF = (bill: SalesBill): void => {
  try {
    const validation = validateSalesBill(bill);
    
    if (!validation.isValid) {
      throw new Error(`Invalid bill data: ${validation.errors.join(', ')}`);
    }
    
    const doc = generateSalesBillPDF(bill);
    doc.save(`SalesBill-${bill.bill_number}.pdf`);
    
    // Log success for analytics
    console.log(`PDF downloaded successfully: Bill #${bill.bill_number}`);
  } catch (error) {
    console.error('PDF download failed:', error);
    throw new Error(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to generate and open sales bill PDF in new tab
export const openSalesBillPDF = (bill: SalesBill): void => {
  try {
    const validation = validateSalesBill(bill);
    
    if (!validation.isValid) {
      throw new Error(`Invalid bill data: ${validation.errors.join(', ')}`);
    }
    
    const doc = generateSalesBillPDF(bill);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const newWindow = window.open(pdfUrl, '_blank');
    
    if (!newWindow) {
      throw new Error('Pop-up was blocked. Please allow pop-ups for this site to view the PDF.');
    }
    
    // Clean up the object URL when the tab is closed (prevents memory leaks)
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 30000); // Revoke after 30 seconds
    
    // Log success for analytics
    console.log(`PDF opened in new tab: Bill #${bill.bill_number}`);
  } catch (error) {
    console.error('PDF view failed:', error);
    throw new Error(`Failed to view PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default {
  generateSalesBillPDF,
  downloadSalesBillPDF,
  openSalesBillPDF
};
