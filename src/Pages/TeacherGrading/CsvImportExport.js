import React, { useRef, useEffect } from "react";
import Papa from "papaparse";
import { UploadCloud, Download } from "lucide-react";

export const CSVImportExport = ({ onImport, exportData, filename = "marks-data" }) => {
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fileInput = fileInputRef.current;
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            onImport(results.data);
          } else {
            alert("No valid data found in CSV file");
          }
          e.target.value = null;
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          alert("Error parsing CSV file. Please check format and try again.");
          e.target.value = null;
        }
      });
    };

    fileInput.addEventListener("change", handleFileChange);
    return () => fileInput.removeEventListener("change", handleFileChange);
  }, [onImport]);

  const handleImportClick = () => fileInputRef.current.click();

  const handleExportClick = () => {
    if (!exportData || exportData.length === 0) {
      alert("No data available to export");
      return;
    }

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="csv-actions">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: "none" }}
      />
      <button
        className="csv-btn import-btn"
        onClick={handleImportClick}
        title="Import marks from CSV file"
      >
        <UploadCloud size={18} />
        <span>Import</span>
      </button>
      <button
        className="csv-btn export-btn"
        onClick={handleExportClick}
        title="Export marks to CSV file"
      >
        <Download size={18} />
        <span>Export</span>
      </button>
    </div>
  );
};