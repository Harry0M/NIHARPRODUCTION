
/**
 * Export data to CSV file
 */
export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle special cases (null, undefined, commas, quotes)
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      }).join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Prepare order consumption data for export
 */
export const prepareOrderConsumptionDataForExport = (orderData: any[]) => {
  return orderData.map(order => ({
    'Order Number': order.name,
    'Company': order.company,
    'Product': order.productName,
    'Order Quantity': order.orderQuantity,
    'Material Cost': order.materialValue.toFixed(2),
    'Production Cost': order.productionCosts.totalProductionCost.toFixed(2),
    'Total Cost': order.totalCost.toFixed(2),
    'Revenue': order.totalRevenue.toFixed(2),
    'Profit': order.profit.toFixed(2),
    'Margin %': order.profitMargin.toFixed(2),
    'Date': order.date ? new Date(order.date).toLocaleDateString() : 'N/A'
  }));
};

/**
 * Prepare detailed consumption data for export
 */
export const prepareDetailedConsumptionDataForExport = (orderData: any[]) => {
  const result: any[] = [];
  
  orderData.forEach(order => {
    order.materials.forEach((material: any) => {
      result.push({
        'Order Number': order.name,
        'Company': order.company,
        'Product': order.productName,
        'Material': material.material_name,
        'Quantity': material.quantity.toFixed(2),
        'Unit': material.unit,
        'Value': material.value.toFixed(2),
        'Total Order Cost': order.totalCost.toFixed(2),
        'Total Order Revenue': order.totalRevenue.toFixed(2)
      });
    });
  });
  
  return result;
};
