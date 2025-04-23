
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
  const link = document.createElement('link');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
