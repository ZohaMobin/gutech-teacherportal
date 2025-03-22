import React from "react";
import { X, AlertTriangle } from "lucide-react";

const ImportHelpPanel = ({ onClose }) => {
  // Required columns for import
  const requiredColumns = [
    { name: "Assessment ID", type: "Number", description: "Unique identifier for the assessment" },
    { name: "Weightage", type: "Number", description: "Percentage weight of the assessment" },
    { name: "Total Marks", type: "Number", description: "Maximum possible marks" },
    { name: "Student ID", type: "Number", description: "Unique identifier for the student" },
    { name: "Student Name", type: "Text", description: "Full name of the student" },
    { name: "Obtained Marks", type: "Number", description: "Marks scored by the student" },
  ];
  
  return (
    <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200 text-xs sm:text-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-blue-800">Excel Import Format</h3>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <p className="text-gray-700 mb-2">Your Excel file must include the following columns:</p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-blue-200 text-xs">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-2 py-1 text-left border-b border-blue-200">Column Name</th>
              <th className="px-2 py-1 text-left border-b border-blue-200">Data Type</th>
              <th className="px-2 py-1 text-left border-b border-blue-200">Description</th>
            </tr>
          </thead>
          <tbody>
            {requiredColumns.map((column, index) => (
              <tr key={index} className="border-b border-blue-100">
                <td className="px-2 py-1 font-medium">{column.name}</td>
                <td className="px-2 py-1">{column.type}</td>
                <td className="px-2 py-1">{column.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-gray-600">
        <p className="text-xs">
          Example row: <span className="font-mono bg-blue-100 px-1 rounded">1, 15, 20, 101, "John Doe", 18</span>
        </p>
      </div>
      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 flex items-start gap-1">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Important</p>
          <p>Imported assessments will be added to the current tab.</p>
        </div>
      </div>
    </div>
  );
};

export default ImportHelpPanel;