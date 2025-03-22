import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff, AlertTriangle } from "lucide-react";

const StudentMarksView = ({ 
  assessment, 
  students, 
  activeTab, 
  hasLocalChanges, 
  onBack, 
  onUpdate, 
  onUpdateStudents, 
  onToggleStatus 
}) => {
  const [studentMarks, setStudentMarks] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Initialize student marks
  useEffect(() => {
    if (assessment && students) {
      const initialMarks = {};
      students.forEach((student) => {
        initialMarks[student.id] = student.marks?.[assessment.id] || 0;
      });
      
      setStudentMarks(initialMarks);
      setIsModified(assessment.modified || hasLocalChanges);
    }
  }, [assessment, students, hasLocalChanges]);

  // Calculate class average
  const calculateAverage = () => {
    if (!studentMarks || Object.keys(studentMarks).length === 0) return 0;
    
    const sum = Object.values(studentMarks).reduce((acc, mark) => acc + parseFloat(mark || 0), 0);
    return (sum / Object.keys(studentMarks).length).toFixed(1);
  };

  // Handle mark change for a student
  const handleMarkChange = (studentId, value) => {
    const numValue = parseFloat(value) || 0;
    const limitedValue = Math.min(Math.max(numValue, 0), assessment.total);
    
    setStudentMarks({
      ...studentMarks,
      [studentId]: limitedValue,
    });
    
    setIsModified(true);
  };

  // Save changes
  const saveChanges = () => {
    // Update the average in the assessment
    const updatedAssessment = {
      ...assessment,
      avg: calculateAverage(),
      modified: true,
    };
    
    // Update the marks in the students state
    const updatedStudents = students.map((student) => ({
      ...student,
      marks: {
        ...student.marks,
        [assessment.id]: studentMarks[student.id] || 0,
      },
    }));
    
    onUpdateStudents(updatedStudents);
    onUpdate(updatedAssessment, studentMarks);
    setIsEditing(false);
  };

  // Toggle publishing status
  const handleToggleStatus = () => {
    if (isModified && assessment.status !== "Published") {
      saveChanges();
    }
    onToggleStatus(assessment.id);
  };

  // Get class statistics
  const getClassStats = () => {
    if (!studentMarks || Object.keys(studentMarks).length === 0) {
      return { min: 0, max: 0, median: 0, mode: 0 };
    }
    
    const marks = Object.values(studentMarks).map(m => parseFloat(m || 0));
    marks.sort((a, b) => a - b);
    
    const min = marks[0];
    const max = marks[marks.length - 1];
    
    // Calculate median
    let median;
    const mid = Math.floor(marks.length / 2);
    if (marks.length % 2 === 0) {
      median = (marks[mid - 1] + marks[mid]) / 2;
    } else {
      median = marks[mid];
    }
    
    // Calculate mode
    const counts = {};
    let mode = 0;
    let maxCount = 0;
    
    marks.forEach(mark => {
      counts[mark] = (counts[mark] || 0) + 1;
      if (counts[mark] > maxCount) {
        maxCount = counts[mark];
        mode = mark;
      }
    });
    
    return { min, max, median, mode };
  };

  const stats = getClassStats();
  
  return (
    <div className="bg-white rounded-lg">
      {/* Header with back button */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Back to {activeTab}
        </button>
        <div className="flex gap-2">
          {isEditing ? (
            <button
              onClick={saveChanges}
              className="px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Save size={14} /> Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Edit Marks
            </button>
          )}
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded transition-colors flex items-center gap-1 ${
              assessment.status === "Published"
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {assessment.status === "Published" ? (
              <>
                <EyeOff size={14} /> Unpublish
              </>
            ) : (
              <>
                <Eye size={14} /> Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Assessment details */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
              {activeTab.slice(0, -1)} #{assessment.id}
              {(isModified || hasLocalChanges) && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} /> {assessment.status === "Published" ? "Modified" : "Unpublished Changes"}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600">
              Weightage: <span className="font-medium">{assessment.weightage}%</span> • 
              Total Marks: <span className="font-medium">{assessment.total}</span>
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">
              Status: 
              <span className={`ml-1 font-medium ${
                assessment.status === "Published" ? "text-green-600" : 
                assessment.status === "Draft" ? "text-blue-600" : "text-gray-600"
              }`}>
                {assessment.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Class Average: <span className="font-medium">{calculateAverage()} / {assessment.total}</span>
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-gray-500">Minimum</div>
            <div className="font-medium">{stats.min} / {assessment.total}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-gray-500">Maximum</div>
            <div className="font-medium">{stats.max} / {assessment.total}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-gray-500">Median</div>
            <div className="font-medium">{stats.median.toFixed(1)} / {assessment.total}</div>
          </div>
          <div className="bg-white p-2 rounded border border-gray-200">
            <div className="text-gray-500">Mode</div>
            <div className="font-medium">{stats.mode} / {assessment.total}</div>
          </div>
        </div>
      </div>

      {/* Student marks table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider">Student ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 tracking-wider">Name</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 tracking-wider">Marks</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500 tracking-wider">Percentage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">{student.rollNumber}</td>
                <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-800">{student.name}</td>
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      value={studentMarks[student.id] || 0}
                      onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      min="0"
                      max={assessment.total}
                      className="w-16 px-2 py-1 text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-medium">
                      {studentMarks[student.id] || 0} / {assessment.total}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  <span className={`font-medium ${getScoreColor(studentMarks[student.id], assessment.total)}`}>
                    {calculatePercentage(studentMarks[student.id], assessment.total)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Note about unpublished changes */}
      {(isModified || hasLocalChanges) && assessment.status !== "Published" && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs flex items-start gap-1">
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Changes Not Published</p>
            <p>These marks are saved locally but not yet visible to students. Click "Publish" to make them available.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate percentage
const calculatePercentage = (marks, total) => {
  if (!total) return 0;
  return Math.round((marks / total) * 100);
};

// Helper function to get color based on score
const getScoreColor = (marks, total) => {
  const percentage = calculatePercentage(marks, total);
  
  if (percentage >= 85) return "text-green-600";
  if (percentage >= 70) return "text-blue-600";
  if (percentage >= 50) return "text-yellow-600";
  return "text-red-600";
};

export default StudentMarksView;