import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle, Edit } from "lucide-react";
import axios from "axios";

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
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get auth token from session storage
  const getAuthToken = () => {
    return sessionStorage.getItem('token');
  };

  // Fetch latest marks from API
  const fetchLatestMarks = async () => {
    if (!assessment || !students) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/teacher-marks/assessment/${assessment.id}/marks`, {
        headers: {
          'x-auth-token': getAuthToken()
        }
      });

      if (response.data && response.data.marks) {
        setStudentMarks(response.data.marks);
        setIsModified(false);
      }
    } catch (error) {
      console.error('Error fetching latest marks:', error);
      setErrorMessage("Failed to fetch latest marks. Using cached data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize student marks
  useEffect(() => {
    if (assessment && students) {
      // First set initial marks from props
      const initialMarks = {};
      students.forEach((student) => {
        initialMarks[student.id] = student.marks?.[assessment.id] || 0;
      });
      
      setStudentMarks(initialMarks);
      setIsModified(assessment.modified || hasLocalChanges);
      setSaveStatus(null);
      setErrorMessage("");
      setIsPublished(assessment.status === "Published");

      // Then fetch latest marks from API
      fetchLatestMarks();
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
    setSaveStatus(null);
  };

  // Save marks
  const handleSave = async (saveAsDraft = false) => {
    setSaveStatus('saving');
    
    try {
      // Create a copy of the assessment with the appropriate status
      const updatedAssessment = {
        ...assessment,
        status: saveAsDraft ? "Draft" : assessment.status
      };
      
      // Update the assessment with the new marks
      await onUpdate(updatedAssessment, studentMarks);
      
      // Update the students state with the new marks
      const updatedStudents = students.map(student => ({
        ...student,
        marks: {
          ...student.marks,
          [assessment.id]: studentMarks[student.id] || 0
        }
      }));
      
      onUpdateStudents(updatedStudents);
      
      setIsModified(false);
      setSaveStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving marks:', error);
      setSaveStatus('error');
      setErrorMessage("Failed to save marks. Please try again.");
    }
  };

  // Toggle assessment status
  const handleToggleStatus = () => {
    if (isPublished) {
      setShowUnpublishConfirm(true);
    } else {
      onToggleStatus(assessment.id);
    }
  };
  
  // Confirm unpublishing
  const confirmUnpublish = () => {
    setShowUnpublishConfirm(false);
    onToggleStatus(assessment.id);
  };

  // Format student name
  const formatStudentName = (student) => {
    return `${student.name} (${student.rollNumber})`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button 
            className="p-1 rounded-full hover:bg-gray-100 transition-colors" 
            onClick={onBack}
            title="Back to assessments"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {activeTab.slice(0, -1)} #{assessment.id}
            </h2>
            <p className="text-sm text-gray-500">
              {assessment.weightage}% weightage, {assessment.total} total marks
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-sm text-gray-500">Loading latest marks...</span>
          )}
          
          {saveStatus === 'saving' && (
            <span className="text-sm text-gray-500">Saving...</span>
          )}
          
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm">Saved successfully</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle size={16} />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
          
          {isPublished ? (
            <>
              <button
                className="px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm rounded hover:bg-yellow-200 transition-colors flex items-center gap-1"
                onClick={handleToggleStatus}
              >
                <EyeOff size={14} />
                Unpublish
              </button>
              <button
                className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                onClick={() => handleSave(true)}
                disabled={!isModified || saveStatus === 'saving' || isLoading}
              >
                <Save size={14} />
                Save as Draft
              </button>
            </>
          ) : (
            <button
              className="px-3 py-1.5 bg-green-100 text-green-800 text-sm rounded hover:bg-green-200 transition-colors flex items-center gap-1"
              onClick={handleToggleStatus}
            >
              <Eye size={14} />
              Publish
            </button>
          )}
          
          <button
            className="px-3 py-1.5 bg-red-700 text-white text-sm rounded hover:bg-red-800 transition-colors flex items-center gap-1"
            onClick={() => handleSave(false)}
            disabled={!isModified || saveStatus === 'saving' || isLoading}
          >
            <Save size={14} />
            Save
          </button>
        </div>
      </div>
      
      {/* Published status banner */}
      {isPublished && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                This assessment is published and visible to students. Any changes will be saved as a draft until you publish again.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Unpublish confirmation dialog */}
      {showUnpublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unpublish Assessment</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to unpublish this assessment? This will hide it from students and allow you to make changes without affecting their view.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 transition-colors"
                onClick={() => setShowUnpublishConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                onClick={confirmUnpublish}
              >
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Class average */}
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm text-blue-800">Class Average</h3>
          <span className="text-lg font-semibold text-blue-800">{calculateAverage()} / {assessment.total}</span>
        </div>
      </div>
      
      {/* Student marks table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{student.rollNumber}</td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900">{student.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={studentMarks[student.id] || 0}
                    onChange={(e) => handleMarkChange(student.id, e.target.value)}
                    className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isPublished && isModified ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                    }`}
                    min="0"
                    max={assessment.total}
                  />
                  <span className="ml-1 text-gray-500">/ {assessment.total}</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                  {((studentMarks[student.id] || 0) / assessment.total * 100).toFixed(1)}%
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