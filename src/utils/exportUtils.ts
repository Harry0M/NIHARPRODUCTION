/**
 * Utilities for exporting data to different formats
 */

/**
 * Generate and download a CSV file from array data
 * @param data Array of objects to export
 * @param filename Filename without extension
 * @param headers Optional custom headers (if not provided, will use Object.keys of first item)
 */
export const exportToCSV = (
  data: any[],
  filename: string,
  headers?: string[]
) => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  // Get headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  let csvContent = csvHeaders.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = csvHeaders.map(header => {
      // Get the value or use empty string if undefined
      const value = item[header] !== undefined ? item[header] : '';
      
      // Format the value properly for CSV
      // - Wrap strings with quotes and escape existing quotes
      // - Format objects/arrays as JSON strings, also wrapped with quotes
      // - Format dates
      // - Convert numbers directly 
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap with quotes
        return `"${value.replace(/"/g, '""')}"`;
      } else if (value instanceof Date) {
        return `"${value.toLocaleDateString()}"`;
      } else if (typeof value === 'object') {
        // Convert objects/arrays to JSON string and wrap in quotes
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else {
        // Numbers, booleans, etc.
        return value;
      }
    }).join(',');
    
    csvContent += row + '\n';
  });
  
  // Create a download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Set download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Add to document, trigger download, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Prepare order consumption data for export
 * Formats the data into a flat structure suitable for CSV export
 */
export const prepareOrderConsumptionDataForExport = (orderData: any[]) => {
  if (!orderData || !orderData.length) return [];
  
  // Create a flattened version of the order data
  return orderData.map(order => {
    // Calculate totals
    const totalMaterialCost = order.materialValue || 0;
    const totalProductionCost = order.productionCosts?.totalProductionCost || 0;
    const totalCost = totalMaterialCost + totalProductionCost;
    const totalRevenue = order.totalRevenue || 0;
    const profit = order.profit || 0;
    const profitMargin = order.profitMargin || 0;
    
    // Create flattened export object
    return {
      'Order Number': order.name,
      'Company': order.company,
      'Product': order.productName,
      'Date': order.date instanceof Date ? order.date.toLocaleDateString() : '',
      'Quantity': order.orderQuantity,
      'Material Cost': totalMaterialCost.toFixed(2),
      'Cutting Cost': (order.productionCosts?.cuttingCost || 0).toFixed(2),
      'Printing Cost': (order.productionCosts?.printingCost || 0).toFixed(2),
      'Stitching Cost': (order.productionCosts?.stitchingCost || 0).toFixed(2),
      'Transport Cost': (order.productionCosts?.transportCost || 0).toFixed(2),
      'Total Production Cost': totalProductionCost.toFixed(2),
      'Total Cost': totalCost.toFixed(2),
      'Revenue': totalRevenue.toFixed(2),
      'Profit': profit.toFixed(2),
      'Profit Margin (%)': profitMargin.toFixed(2),
      'Applied Margin (%)': (order.marginPercent || 0).toFixed(2),
      'Material Count': order.materials?.length || 0
    };
  });
};

/**
 * Prepare detailed material consumption data for export
 * Creates a row for each material used in each order
 */
export const prepareDetailedConsumptionDataForExport = (orderData: any[]) => {
  if (!orderData || !orderData.length) return [];
  
  // Create detailed breakdown with one row per material per order
  const detailedData: any[] = [];
  
  orderData.forEach(order => {
    // Add details for each material
    if (order.materials && order.materials.length > 0) {
      order.materials.forEach((material: any) => {
        detailedData.push({
          'Order Number': order.name,
          'Company': order.company,
          'Product': order.productName,
          'Date': order.date instanceof Date ? order.date.toLocaleDateString() : '',
          'Material Name': material.material_name,
          'Quantity': material.quantity.toFixed(2),
          'Unit': material.unit,
          'Value': material.value.toFixed(2),
          'Percentage of Order Cost': ((material.value / order.totalCost) * 100).toFixed(2)
        });
      });
    } else {
      // Include order even if it has no materials
      detailedData.push({
        'Order Number': order.name,
        'Company': order.company,
        'Product': order.productName,
        'Date': order.date instanceof Date ? order.date.toLocaleDateString() : '',
        'Material Name': 'No materials',
        'Quantity': '0',
        'Unit': '',
        'Value': '0.00',
        'Percentage of Order Cost': '0.00'
      });
    }
  });
  
  return detailedData;
};
