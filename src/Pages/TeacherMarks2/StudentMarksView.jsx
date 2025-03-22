import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, AlertTriangle } from "lucide-react";
import { useTeacherMarks } from "./TeacherMarksContext";
import { calculateAssessmentAverage } from "./helpers/assessmentHelpers";

const StudentMarksView = ({ onBack, onUpdate, onToggleStatus }) => {
  const { 
    students, 
    selectedAssessment,
    activeSection,
    activeSubject,
    getLocalMarks,
    hasUnpublishedChanges,
    activeTab
  } = useTeacherMarks();
  
  const [studentMarks, setStudentMarks] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  
  // Initialize student marks from selected assessment and local storage
  useEffect(() => {
    if (!selectedAssessment) return;
    
    const localMarks = getLocalMarks(
      selectedAssessment.id, 
      activeSection._id, 
      activeSubject.id
    );
    
    const initialMarks = {};
    students.forEach(student => {
      // Check local storage marks first, then fall back to student marks
      if (localMarks && localMarks[student.id] !== undefined) {
        initialMarks[student.id] = localMarks[student.id];
      } else if (student.marks && student.marks[selectedAssessment.id] !== undefined) {
        initialMarks[student.id] = student.marks[selectedAssessment.id];
      } else {
        initialMarks[student.id] = 0;
      }
    });
    
    setStudentMarks(initialMarks);
    setIsDirty(false);
  }, [selectedAssessment, students]);
  
  if (!selectedAssessment) {
    return null;
  }
  
  // Handle marks change
  const handleMarksChange = (studentId, value) => {
    // Parse value - default to 0 if invalid
    const parsedValue = parseFloat(value) || 0;
    
    // Ensure value doesn't exceed total
    const limitedValue = Math.min(parsedValue, selectedAssessment.total);
    
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: limitedValue
    }));
    
    setIsDirty(true);
  };
  
  // Save changes
  const saveChanges = async () => {
    // Calculate new average based on current marks
    const newAvg = calculateAssessmentAverage(
      selectedAssessment, 
      studentMarks, 
      students
    );
    
    // Update assessment with new average
    const updatedAssessment = {
      ...selectedAssessment,
      avg: newAvg,
      modified: selectedAssessment.status === "Published"
    };
    
    await onUpdate(updatedAssessment, studentMarks);
    setIsDirty(false);
  };
  
  // Toggle publish status
  const toggleStatus = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Save now before changing status?")) {
        saveChanges().then(() => {
          onToggleStatus(selectedAssessment.id);
        });
      }
    } else {
      onToggleStatus(selectedAssessment.id);
    }
  };
  
  const hasLocalChanges = hasUnpublishedChanges(
    selectedAssessment.id, 
    activeSection._id, 
    activeSubject.id
  );
  
  return (
    <div className="w-full">
      {/* Header with assessment details */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b">
        <div className="flex items-center">
          <button 
            className="mr-3 p-1 rounded-full hover:bg-gray-100" 
            onClick={onBack}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-base font-semibold">
              {activeTab.slice(0, -1)} {selectedAssessment.id}
            </h2>
            <p className="text-gray-500 text-xs">
              Weightage: {selectedAssessment.weightage}% | 
              Total Marks: {selectedAssessment.total} | 
              Average: {selectedAssessment.avg}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {isDirty && (
            <span className="text-yellow-600 text-xs flex items-center gap-1">
              <AlertTriangle size={12} />
              Unsaved changes
            </span>
          )}
          
          <button 
            className="px-3 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
            onClick={saveChanges}
            disabled={!isDirty}
          >
            <Save size={14} />
            Save
          </button>
          
          <button 
            className={`px-3 py-1 text-xs rounded ${
              selectedAssessment.status === "Published" 
                ? "bg-red-50 text-red-600 hover:bg-red-100" 
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
            onClick={toggleStatus}
          >
            {selectedAssessment.status === "Published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
      
      {/* Display a notice if there are local changes not reflected in the published version */}
      {selectedAssessment.status === "Published" && (hasLocalChanges || selectedAssessment.modified) && (
        <div className="bg-yellow-50 p-2 mb-3 border border-yellow-200 rounded-md flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-yellow-600" />
          <span className="text-yellow-800">
            This assessment has unpublished changes. Click "Publish" to make them visible to students.
          </span>
        </div>
      )}
      
      {/* Student marks table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Marks</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{student.rollNumber}</td>
                <td className="px-3 py-2 whitespace-nowrap">{student.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1 w-32">
                    <input
                      type="number"
                      min="0"
                      max={selectedAssessment.total}
                      value={studentMarks[student.id] || 0}
                      onChange={(e) => handleMarksChange(student.id, e.target.value)}
                      className="w-16 p-1 border rounded text-right"
                    />
                    <span className="text-gray-500">/</span>
                    <span>{selectedAssessment.total}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentMarksView;