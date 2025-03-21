import React, { useState } from 'react';
import { X, Download, Upload, Edit, AlertTriangle } from 'lucide-react';
import StudentMarksView from './StudentMarksView';

const TeacherMarksManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState('Quizzes');
  const [activeSubject, setActiveSubject] = useState('Discrete Mathematics');
  const [activeSection, setActiveSection] = useState('sectionA');
  const [assessments, setAssessments] = useState([
    { id: 1, weightage: 15, total: 15, avg: 12.9, status: 'Published', modified: false }
  ]);
  const [students, setStudents] = useState([
    { id: 101, name: 'John Doe', marks: { 1: 14 } },
    { id: 102, name: 'Jane Smith', marks: { 1: 13 } },
    { id: 103, name: 'Alex Johnson', marks: { 1: 12 } },
  ]);
  const [showStudentMarks, setShowStudentMarks] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [newAssessment, setNewAssessment] = useState({ weightage: 15, total: 15 });
  const [showAddForm, setShowAddForm] = useState(false);

  // Tabs and subject options
  const tabs = ['Quizzes', 'Assignments', 'Midterms', 'Finals'];
  const subjects = ['Discrete Mathematics', 'Programming Fundamentals', 'Calculus'];
  const sections = ['sectionA', 'sectionB'];

  // Handle assessment selection to show student marks
  const handleAssessmentClick = (assessment) => {
    setSelectedAssessment(assessment);
    setShowStudentMarks(true);
  };

  // Update assessment after student marks have been edited
  const updateAssessment = (updatedAssessment) => {
    setAssessments(assessments.map(assessment => 
      assessment.id === updatedAssessment.id ? updatedAssessment : assessment
    ));
    setSelectedAssessment(updatedAssessment);
  };

  // Handle CSV import
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target.result;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        // Find the student ID column index
        const studentIdIndex = headers.findIndex(h => h.trim().toLowerCase() === 'student id');
        
        if (studentIdIndex === -1) {
          alert('CSV must contain a "Student ID" column');
          return;
        }
        
        // Get assessment IDs from headers (expected format: "Assessment X")
        const assessmentColumns = headers.map((header, index) => {
          const match = header.trim().match(/assessment\s+(\d+)/i);
          return match ? { index, id: parseInt(match[1]) } : null;
        }).filter(col => col !== null);
        
        // Create or update assessments as needed
        const existingIds = assessments.map(a => a.id);
        const newAssessmentIds = assessmentColumns
          .map(col => col.id)
          .filter(id => !existingIds.includes(id));
        
        // Create new assessments for any new IDs found in CSV
        if (newAssessmentIds.length > 0) {
          const newAssessmentsToAdd = newAssessmentIds.map(id => ({
            id,
            weightage: 15, // Default weightage
            total: 15,     // Default total
            avg: 0,
            status: 'Draft',
            modified: false
          }));
          
          setAssessments([...assessments, ...newAssessmentsToAdd]);
        }
        
        // Update students and their marks
        const updatedStudents = [...students];
        
        lines.slice(1).filter(line => line.trim()).forEach(line => {
          const values = line.split(',');
          const studentId = parseInt(values[studentIdIndex]);
          
          if (!studentId || isNaN(studentId)) return;
          
          // Find student by ID or create new student
          let student = updatedStudents.find(s => s.id === studentId);
          if (!student) {
            // Assuming student name is in the column right after ID
            const nameIndex = studentIdIndex + 1 < values.length ? studentIdIndex + 1 : studentIdIndex;
            student = {
              id: studentId,
              name: values[nameIndex] || `Student ${studentId}`,
              marks: {}
            };
            updatedStudents.push(student);
          }
          
          // Update marks
          assessmentColumns.forEach(col => {
            const mark = values[col.index] ? parseFloat(values[col.index]) : null;
            if (mark !== null && !isNaN(mark)) {
              student.marks[col.id] = mark;
            }
          });
        });
        
        setStudents(updatedStudents);
        
        // Update assessment averages
        const updatedAssessments = assessments.map(assessment => {
          const marks = updatedStudents
            .map(s => s.marks[assessment.id] || 0)
            .filter(mark => mark !== null);
          
          const avg = marks.length > 0 
            ? marks.reduce((sum, mark) => sum + mark, 0) / marks.length
            : 0;
          
          return { 
            ...assessment, 
            avg: Math.round(avg * 10) / 10,
            // Mark modified if already published
            modified: assessment.status === 'Published',
            status: assessment.status === 'Published' ? 'Modified' : assessment.status
          };
        });
        
        setAssessments(updatedAssessments);
      };
      reader.readAsText(file);
    }
  };

  // Handle CSV export
  const handleExport = () => {
    // Create headers with Student ID
    const headers = ['Student ID', 'Student Name', ...assessments.map(a => `Assessment ${a.id}`)];
    
    // Create data rows
    const rows = students.map(student => {
      return [
        student.id,
        student.name,
        ...assessments.map(assessment => student.marks[assessment.id] || '')
      ];
    });
    
    // Combine headers and rows
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeSubject}_${activeTab}.csv`);
    link.click();
  };

  // Add a new assessment
  const addAssessment = () => {
    if (!newAssessment.weightage || !newAssessment.total) {
      alert('Weightage and Total Marks are required');
      return;
    }
    
    const newId = assessments.length > 0 ? Math.max(...assessments.map(a => a.id)) + 1 : 1;
    
    setAssessments([...assessments, {
      id: newId,
      weightage: parseInt(newAssessment.weightage),
      total: parseInt(newAssessment.total),
      avg: 0,
      status: 'Draft',
      modified: false
    }]);
    
    // Reset form
    setNewAssessment({ weightage: 15, total: 15 });
    setShowAddForm(false);
  };

  // Delete an assessment
  const deleteAssessment = (id) => {
    setAssessments(assessments.filter(assessment => assessment.id !== id));
    if (showStudentMarks && selectedAssessment && selectedAssessment.id === id) {
      setShowStudentMarks(false);
    }
  };

  // Toggle assessment status
  const toggleStatus = (id) => {
    setAssessments(assessments.map(assessment => {
      if (assessment.id === id) {
        let newStatus;
        if (assessment.status === 'Published') {
          newStatus = 'Unpublished';
        } else if (assessment.status === 'Modified' || assessment.status === 'Draft' || assessment.status === 'Unpublished') {
          newStatus = 'Published';
        }
        
        return { 
          ...assessment, 
          status: newStatus,
          modified: false // Reset modified flag when explicitly changing status
        };
      }
      return assessment;
    }));
  };

  // Handle showing the add assessment form
  const handleAddClick = () => {
    // Set default weightage based on assessment type
    let defaultWeightage = 15;
    if (activeTab === 'Finals') defaultWeightage = 40;
    else if (activeTab === 'Midterms') defaultWeightage = 25;
    else if (activeTab === 'Assignments') defaultWeightage = 20;
    
    setNewAssessment({ weightage: defaultWeightage, total: 15 });
    setShowAddForm(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Teacher Marks Management</h1>
        <button 
          className="px-4 py-2 bg-red-800 text-white rounded-md flex items-center gap-2"
          onClick={handleAddClick}
        >
          + Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Subject filters */}
      <div className="flex gap-3 mb-4">
        {subjects.map(subject => (
          <button
            key={subject}
            className={`px-4 py-2 rounded-md ${
              activeSubject === subject 
                ? 'bg-red-800 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveSubject(subject)}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Section filters */}
      <div className="flex gap-3 mb-6">
        {sections.map(section => (
          <button
            key={section}
            className={`px-4 py-2 rounded-md ${
              activeSection === section 
                ? 'bg-red-800 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Import/Export buttons */}
      <div className="flex justify-end gap-3 mb-6">
        <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center gap-2 cursor-pointer">
          <Upload size={18} />
          Import
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleImport} 
          />
        </label>
        <button 
          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md flex items-center gap-2"
          onClick={handleExport}
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Assessment type tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`py-2 px-4 ${
                activeTab === tab 
                  ? 'text-red-800 border-b-2 border-red-800 font-medium' 
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Add Assessment Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium mb-3">Add New {activeTab.slice(0, -1)}</h3>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
              <input 
                type="number" 
                value={newAssessment.weightage}
                onChange={(e) => setNewAssessment({...newAssessment, weightage: e.target.value})}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input 
                type="number" 
                value={newAssessment.total}
                onChange={(e) => setNewAssessment({...newAssessment, total: e.target.value})}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-red-800 text-white rounded-md"
              onClick={addAssessment}
            >
              Add {activeTab.slice(0, -1)}
            </button>
            <button 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assessment list or Student marks view */}
      {!showStudentMarks ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weightage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <tr 
                  key={assessment.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAssessmentClick(assessment)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.weightage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.avg}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      assessment.status === 'Published' ? 'bg-green-100 text-green-800' : 
                      assessment.status === 'Modified' ? 'bg-yellow-100 text-yellow-800' :
                      assessment.status === 'Draft' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {assessment.status}
                      {assessment.modified && (
                        <AlertTriangle size={12} className="ml-1 text-yellow-600" />
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssessmentClick(assessment);
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button 
                      className={`${
                        assessment.status === 'Published' ? 'text-red-600 bg-red-50' : 
                        'text-green-600 bg-green-50'
                      } hover:bg-opacity-80 px-3 py-1 rounded`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(assessment.id);
                      }}
                    >
                      {assessment.status === 'Published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button 
                      className="text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAssessment(assessment.id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StudentMarksView 
          assessment={selectedAssessment}
          students={students}
          activeTab={activeTab}
          onBack={() => setShowStudentMarks(false)}
          onUpdate={(updatedAssessment) => updateAssessment(updatedAssessment)}
          onUpdateStudents={setStudents}
          onToggleStatus={toggleStatus}
        />
      )}
    </div>
  );
};

export default TeacherMarksManagement;