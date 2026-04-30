/**
 * Utility to export data to CSV and trigger a browser download.
 * Excel can open these files perfectly.
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 */
export const exportToCSV = (data, fileName) => {
  if (!data || !data.length) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  // 1. Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // 2. Build CSV rows
  const csvRows = [
    headers.join(","), // header row
    ...data.map(row => 
      headers.map(fieldName => {
        let value = row[fieldName] ?? "";
        // Handle strings with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`;
        }
        return value;
      }).join(",")
    )
  ];

  const csvString = csvRows.join("\n");
  
  // 3. Create blob and download link
  // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
