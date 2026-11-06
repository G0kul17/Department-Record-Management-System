// Utility: exportData
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function downloadBlob(blob, filename) {
  try {
    if (typeof saveAs === "function") {
      saveAs(blob, filename);
      return;
    }
  } catch (_) {
    // fallback below
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportToXlsxOrCsv(arg1, arg2, arg3, arg4) {
  let rows = [];
  let filenameBase = "export";
  let columns = [];
  let format = "xlsx";

  // Flexible argument handling:
  // Signature A: exportToXlsxOrCsv(rows, filename, format, columns)
  // Signature B: exportToXlsxOrCsv(filename, rows, columns, format)
  if (Array.isArray(arg1)) {
    rows = arg1;
    if (typeof arg2 === "string" && arg2.trim()) {
      filenameBase = arg2.trim();
    }
    if (typeof arg3 === "string" && arg3.trim()) {
      format = arg3.trim().toLowerCase();
    } else if (Array.isArray(arg3)) {
      columns = arg3;
    }
    if (Array.isArray(arg4)) {
      columns = arg4;
    } else if (typeof arg4 === "string" && arg4.trim()) {
      format = arg4.trim().toLowerCase();
    }
  } else if (typeof arg1 === "string") {
    if (arg1.trim()) filenameBase = arg1.trim();
    if (Array.isArray(arg2)) {
      rows = arg2;
    }
    if (Array.isArray(arg3)) {
      columns = arg3;
    } else if (typeof arg3 === "string" && arg3.trim()) {
      format = arg3.trim().toLowerCase();
    }
    if (typeof arg4 === "string" && arg4.trim()) {
      format = arg4.trim().toLowerCase();
    } else if (Array.isArray(arg4)) {
      columns = arg4;
    }
  }

  // Deduce columns from rows if columns were not explicitly passed
  if ((!columns || columns.length === 0) && rows.length > 0) {
    const keySet = new Set();
    const detectedKeys = [];
    rows.forEach((r) => {
      if (r && typeof r === "object") {
        Object.keys(r).forEach((k) => {
          if (!keySet.has(k)) {
            keySet.add(k);
            detectedKeys.push(k);
          }
        });
      }
    });
    columns = detectedKeys.map((k) => ({ key: k, header: k }));
  }

  const getCellValue = (r, col) => {
    if (!r || typeof r !== "object") return "";
    let val = undefined;
    if (col.key !== undefined && r[col.key] !== undefined) {
      val = r[col.key];
    } else if (col.header !== undefined && r[col.header] !== undefined) {
      val = r[col.header];
    }
    if (val === null || val === undefined) return "";
    if (typeof val === "object") {
      if (Array.isArray(val)) return val.join(", ");
      return JSON.stringify(val);
    }
    return val;
  };

  const cleanFilename = filenameBase.replace(/\.(xlsx|csv)$/i, "");

  const makeCsv = () => {
    const headerLine = (columns || [])
      .map((c) => `"${String(c.header || c.key || "").replace(/"/g, '""')}"`)
      .join(",");
    const bodyLines = (rows || []).map((r) =>
      (columns || [])
        .map((c) => {
          const v = getCellValue(r, c);
          const s = typeof v === "string" ? v : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    return [headerLine, ...bodyLines].join("\n");
  };

  if (format === "csv") {
    const csv = makeCsv();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${cleanFilename}.csv`);
    return { type: "csv" };
  }

  // Try XLSX export first using ExcelJS
  try {
    const WorkbookClass =
      ExcelJS.Workbook ||
      ExcelJS.default?.Workbook ||
      (typeof window !== "undefined" && window.ExcelJS?.Workbook);
    const workbook = new (WorkbookClass || ExcelJS.Workbook)();
    const worksheet = workbook.addWorksheet("Report");

    worksheet.columns = (columns || []).map((col) => {
      const headerText = String(col.header || col.key || "Column");
      return {
        header: headerText,
        key: String(col.key || col.header || "col"),
        width: Math.max(14, headerText.length + 4),
      };
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };

    (rows || []).forEach((r) => {
      const rowData = {};
      (columns || []).forEach((col) => {
        const colKey = String(col.key || col.header || "col");
        rowData[colKey] = getCellValue(r, col);
      });
      worksheet.addRow(rowData);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, `${cleanFilename}.xlsx`);
    return { type: "xlsx" };
  } catch (err) {
    console.error("ExcelJS export failed, falling back to CSV:", err);
    const csv = makeCsv();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${cleanFilename}.csv`);
    return { type: "csv" };
  }
}

export default exportToXlsxOrCsv;
