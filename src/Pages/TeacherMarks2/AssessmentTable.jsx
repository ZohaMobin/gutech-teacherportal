import React from "react";
import { Edit, X, AlertTriangle } from "lucide-react";
import { useTeacherMarks } from "./TeacherMarksContext";
import { getStatusClasses } from "./helpers/assessmentHelpers";

const AssessmentTable = ({ onAssessmentClick, onDeleteAssessment, onToggleStatus }) => {
  const {
    activeSection,
    activeSubject,
    activeTab,
    getCurrentAssessments,
    hasUnpublishedChanges
  } = useTeacherMarks();
  
  const currentAssessments = getCurrentAssessments();
  
  if (!activeSection || !activeSubject || currentAssessments.length === 0) {
    return (
      <div className="bg-white border rounded-md p-6 text-center text-gray-500">
        {!activeSection || !activeSubject 
          ? "Please select a subject and section"
          : `No ${activeTab.toLowerCase()} found for ${activeSubject.name} (Section ${activeSection.section}).`
        }
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">#</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Weightage</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Avg</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {currentAssessments.map((assessment) => (
            <tr 
              key={assessment.id} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onAssessmentClick(assessment)}
            >
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.id}</td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.weightage}%</td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.total}</td>
              <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.avg}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span
                  className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${
                    getStatusClasses(assessment.status, assessment.modified)
                  }`}
                >
                  {assessment.status}
                  {(assessment.modified || 
                    hasUnpublishedChanges(
                      assessment.id, 
                      activeSection._id, 
                      activeSubject.id
                    )) && 
                    <AlertTriangle size={10} className="ml-1 text-yellow-600" />}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap font-medium space-x-1">
                <div className="flex gap-1 flex-wrap">
                  <button
                    className="text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-0.5 text-xs rounded flex items-center gap-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssessmentClick(assessment);
                    }}
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    className={`${
                      assessment.status === "Published" ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"
                    } hover:bg-opacity-80 px-2 py-0.5 text-xs rounded transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(assessment.id);
                    }}
                  >
                    {assessment.status === "Published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAssessment(assessment.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssessmentTable;