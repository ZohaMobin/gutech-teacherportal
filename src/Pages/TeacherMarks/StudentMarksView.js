import React from 'react';
import { AlertTriangle } from 'lucide-react';

const StudentMarksView = ({ 
  assessment, 
  students, 
  activeTab, 
  onBack, 
  onUpdate, 
  onUpdateStudents,
  onToggleStatus 
}) => {
  // Handle mark updates
  const updateMark = (studentId, mark) => {
    const updatedStudents = students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          marks: { ...student.marks, [assessment.id]: Number(mark) }
        };
      }
      return student;
    });
    
    onUpdateStudents(updatedStudents);
    
    // Calculate new average
    const marks = updatedStudents.map(s => s.marks[assessment.id] || 0);
    const avg = marks.reduce((sum, mark) => sum + mark, 0) / marks.length;
    
    // Mark as modified if it was published
    const modified = assessment.status === 'Published';
    const updatedAssessment = { 
      ...assessment, 
      avg: Math.round(avg * 10) / 10,
      modified: modified, 
      status: modified ? 'Modified' : assessment.status
    };
    
    onUpdate(updatedAssessment);
  };

  // Handle publish changes
  const handlePublish = () => {
    const publishedAssessment = {
      ...assessment,
      status: 'Published',
      modified: false
    };
    
    onUpdate(publishedAssessment);
    onToggleStatus(assessment.id);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-medium">
            Student Marks for {activeTab.slice(0, -1)} {assessment.id}
          </h2>
          <p className="text-sm text-gray-500">
            Weightage: {assessment.weightage}% | Total Marks: {assessment.total}
          </p>
          
          {assessment.status === 'Modified' && (
            <div className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
              <AlertTriangle size={14} />
              This assessment has been modified and needs to be published again
            </div>
          )}
        </div>
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
          onClick={onBack}
        >
          Back to {activeTab}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mark (out of {assessment.total})
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="number" 
                    min="0" 
                    max={assessment.total}
                    value={student.marks[assessment.id] || ''}
                    onChange={(e) => updateMark(student.id, e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Publish changes button */}
      {assessment.status === 'Modified' && (
        <div className="mt-4 flex justify-end">
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            onClick={handlePublish}
          >
            Publish Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentMarksView;