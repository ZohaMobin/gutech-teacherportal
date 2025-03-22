import React from "react";

const AssessmentForm = ({ newAssessment, setNewAssessment, onAdd, onCancel, activeTab }) => {
  return (
    <div className="bg-gray-50 p-3 rounded-lg mb-4">
      <h3 className="font-medium mb-3 text-sm">Add New {activeTab.slice(0, -1)}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Weightage (%)</label>
          <input
            type="number"
            value={newAssessment.weightage}
            onChange={(e) => setNewAssessment({ ...newAssessment, weightage: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Total Marks</label>
          <input
            type="number"
            value={newAssessment.total}
            onChange={(e) => setNewAssessment({ ...newAssessment, total: e.target.value })}
            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          className="px-3 py-1.5 bg-red-700 text-xs text-white rounded hover:bg-red-800 transition-colors" 
          onClick={onAdd}
        >
          Add {activeTab.slice(0, -1)}
        </button>
        <button 
          className="px-3 py-1.5 bg-gray-200 text-xs text-gray-700 rounded hover:bg-gray-300 transition-colors" 
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AssessmentForm;