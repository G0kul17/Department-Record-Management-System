// Utility: exportData
// Uses static imports for `xlsx` and `file-saver` to avoid Vite dynamic import issues.
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export async function exportToXlsxOrCsv(filenameBase, rows, columns) {
  // rows: array of objects
  // columns: array of { key, header }
  const makeCsv = () => {
    const header = columns
      .map((c) => `"${(c.header || c.key).replace(/"/g, '""')}"`)
      .join(",");
    const body = rows
      .map((r) =>
        columns
          .map((c) => {
            const v = r[c.key] ?? "";
            const s = typeof v === "string" ? v : String(v);
            return `"${s.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const csv = [header, body].join("\n");
    return csv;
  };

  // Try XLSX export first using static imports
  try {
    const wsData = [columns.map((c) => c.header || c.key)];
    rows.forEach((r) => {
      wsData.push(columns.map((c) => r[c.key] ?? ""));
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // attempt to set header styles (bold) and reasonable column widths
    try {
      // set bold for header row
      for (let c = 0; c < (columns.length || 0); c++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = ws[cellRef].s || {};
        ws[cellRef].s.font = ws[cellRef].s.font || {};
        ws[cellRef].s.font.bold = true;
      }
      // auto column widths (approximate by header length)
      ws["!cols"] = columns.map((col) => ({
        wch: Math.max(12, String(col.header || col.key).length + 4),
      }));
    } catch (e) {
      // ignore styling errors; fallback still works
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `${filenameBase}.xlsx`);
    return { type: "xlsx" };
  } catch (err) {
    // fallback: CSV
    const csv = makeCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { type: "csv" };
  }
}

export default exportToXlsxOrCsv;
