import * as XLSX from 'xlsx';

/**
 * Utility to export data to Excel (.xlsx) and trigger a browser download.
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 */
export const exportToExcel = (data, fileName) => {
  if (!data || !data.length) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  // 1. Create a worksheet from the data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 2. Create a workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // 3. Generate Excel file and trigger download
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${fileName}_${date}.xlsx`);
};

// Alias for backward compatibility if needed, though we'll update the calls
export const exportToCSV = exportToExcel;
