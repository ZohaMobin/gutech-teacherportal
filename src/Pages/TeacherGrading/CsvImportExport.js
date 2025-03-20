import React, { useRef } from "react";
import Papa from "papaparse"; // You'll need to install this with npm install papaparse

export const CSVImportExport = ({ onImport, exportData, filename = "marks-data" }) => {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Parse CSV file
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          onImport(results.data);
        } else {
          alert("No valid data found in CSV file");
        }
        
        // Reset file input
        e.target.value = null;
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV file. Please check format and try again.");
        
        // Reset file input
        e.target.value = null;
      }
    });
  };

  const handleExportClick = () => {
    if (!exportData || exportData.length === 0) {
      alert("No data available to export");
      return;
    }

    // Convert data to CSV
    const csv = Papa.unparse(exportData);
    
    // Create download link
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
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: "none" }}
      />
      <button
        className="csv-import-btn"
        onClick={handleImportClick}
        title="Import marks from CSV file"
      >
        Import CSV
      </button>
      <button
        className="csv-export-btn"
        onClick={handleExportClick}
        title="Export marks to CSV file"
      >
        Export CSV
      </button>
    </div>
  );
};