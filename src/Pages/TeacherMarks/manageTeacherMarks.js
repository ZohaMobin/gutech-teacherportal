import React, { useState, useEffect } from "react";
import { X, Download, Upload, Edit, AlertTriangle, Info } from "lucide-react";
import StudentMarksView from "./StudentMarksView";
import { handleExcelImport, createExcelExport } from "./csvUtils";
import axios from "axios";

const TeacherMarksManagement = () => {
  // State management
  const [activeTab, setActiveTab] = useState("Quizzes");
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const fileInputRef = React.useRef(null);

  // Assessment states
  const [assessments, setAssessments] = useState({
    Quizzes: [],
    Assignments: [],
    Midterms: [],
    Finals: [],
  });
  const [showStudentMarks, setShowStudentMarks] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [newAssessment, setNewAssessment] = useState({ weightage: 15, total: 15 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);

  // Tabs mapping to API assessment types
  const tabToApiTypeMap = {
    Quizzes: "quiz",
    Assignments: "assignment",
    Midterms: "midterm",
    Finals: "final",
  };

  // Tabs for assessment categories
  const tabs = ["Quizzes", "Assignments", "Midterms", "Finals"];

  // Required columns for import
  const requiredColumns = [
    { name: "Assessment ID", type: "Number", description: "Unique identifier for the assessment" },
    { name: "Weightage", type: "Number", description: "Percentage weight of the assessment" },
    { name: "Total Marks", type: "Number", description: "Maximum possible marks" },
    { name: "Student ID", type: "Number", description: "Unique identifier for the student" },
    { name: "Student Name", type: "Text", description: "Full name of the student" },
    { name: "Obtained Marks", type: "Number", description: "Marks scored by the student" },
  ];
  const teacherId="67dde7b0cadf2777c7a12567";
  // Fetch sections and courses when component mounts
 useEffect(() => {
    if (teacherId) {
      fetchTeacherSections(teacherId);
    }
  }, [teacherId]);

  // Fetch students when active section changes
  useEffect(() => {
    if (activeSection) {
      fetchStudents(activeSection._id);
    }
  }, [activeSection]);

  // Fetch teacher sections based on teacher ID
  const fetchTeacherSections = async (teacherId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/section/getSections/${teacherId}`);
      
      if (response.data && response.data.length > 0) {
        // Format sections and extract unique subjects
        const formattedSections = response.data.map(section => ({
          _id: section._id,
          section: section.section,
          courseId: section.courseId._id,
          courseName: section.courseId.name,
          courseCode: section.courseId.code
        }));
        
        setSections(formattedSections);
        
        // Extract unique subjects from the sections
        const uniqueSubjects = Array.from(
          new Set(formattedSections.map(section => section.courseName))
        ).map(courseName => {
          const section = formattedSections.find(s => s.courseName === courseName);
          return {
            id: section.courseId,
            name: courseName,
            code: section.courseCode
          };
        });
        
        setSubjects(uniqueSubjects);
        
        // Set defaults
        if (uniqueSubjects.length > 0) {
          setActiveSubject(uniqueSubjects[0]);
          
          // Filter sections by the first subject
          const filteredSections = formattedSections.filter(
            section => section.courseName === uniqueSubjects[0].name
          );
          
          if (filteredSections.length > 0) {
            setActiveSection(filteredSections[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students based on section ID
  const fetchStudents = async (sectionId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/enrollment/getStudents/${sectionId}`);
      
      if (response.data) {
        // Format students data to match the component's expected structure
        // We'll need to fetch more user details to get the full name
        const formattedStudents = response.data.map(student => ({
          id: student._id,
          userId: student.userId,
          rollNumber: student.rollNumber,
          name: student.rollNumber, // Placeholder, ideally would fetch student name
          marks: {}
        }));
        
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save assessment marks to the API
  const saveAssessmentMarks = async (assessment, studentMarks) => {
    setIsLoading(true);
    try {
      const date = new Date().toISOString();
      const type = tabToApiTypeMap[activeTab];
      const enrollmentId="67de03190ad325dc130689b6";
      
      // Prepare grades data for each student
      const grades = students.map(student => {
        if (!student || !student.id) {
            console.error("Error: Invalid student object", student);
            return null; // Skip invalid entries
        }
        return {
            enrollmentId: enrollmentId, // Ensuring it is always sent
            studentId: student.id, // Keeping student ID if needed
            type: type,
            title: assessment.id?.toString() || "Unknown",
            maxMarks: assessment.total || 0,
            obtainedMarks: studentMarks?.[student.id] ?? 0,
            date: date,
            feedback: "",
            weightage: assessment.weightage || 0
        };
    }).filter(grade => grade !== null); // Remove any invalid entries
      
      // Post grades to API
      for (const grade of grades) {
        await axios.post("http://localhost:5000/api/grade/", grade);
      }
      
      return true;
    } catch (error) {
      console.error("Error saving grades:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputClick = () => {
    // Reset the file input value before clicking it
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get current assessments based on active tab and section
  const getCurrentAssessments = () => {
    if (!activeSection || !activeSubject) return [];
    
    return assessments[activeTab].filter(
      assessment => 
        assessment.sectionId === activeSection._id && 
        assessment.courseId === activeSubject.id
    );
  };

  // Handle assessment selection to show student marks
  const handleAssessmentClick = (assessment) => {
    setSelectedAssessment(assessment);
    setShowStudentMarks(true);
  };

  // Update assessment after student marks have been edited
  const updateAssessment = async (updatedAssessment, studentMarks) => {
    // Save to API
    const success = await saveAssessmentMarks(updatedAssessment, studentMarks);
    
    if (success) {
      setAssessments({
        ...assessments,
        [activeTab]: assessments[activeTab].map((assessment) => 
          (assessment.id === updatedAssessment.id ? updatedAssessment : assessment)
        ),
      });
      setSelectedAssessment(updatedAssessment);
    } else {
      alert("Failed to save assessment marks. Please try again.");
    }
  };

  // Handle import of Excel file
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file || !activeSection || !activeSubject) return;
    
    setIsLoading(true);

    handleExcelImport(
      file,
      getCurrentAssessments(),
      students,
      (updatedAssessments) => {
        // Add active section and subject to imported assessments
        const assessmentsWithContext = updatedAssessments.map((assessment) => ({
          ...assessment,
          sectionId: activeSection._id,
          courseId: activeSubject.id,
          type: activeTab,
        }));

        setAssessments({
          ...assessments,
          [activeTab]: [...assessments[activeTab], ...assessmentsWithContext],
        });
      },
      setStudents,
      activeSubject.name,
      activeSection.section,
      activeTab
    )
      .then(() => {
        alert("Successfully imported!");
      })
      .catch((error) => {
        console.error("Error during import:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Handle export of Excel file
  const handleExport = () => {
    if (!activeSection || !activeSubject) return;
    
    setIsLoading(true);
    createExcelExport(getCurrentAssessments(), students, activeSubject.name, activeTab);
    setIsLoading(false);
  };

  // Toggle import help panel
  const toggleImportHelp = () => {
    setShowImportHelp(!showImportHelp);
  };

  // Add a new assessment
  const addAssessment = async () => {
    if (!newAssessment.weightage || !newAssessment.total || !activeSection || !activeSubject) {
      alert("Weightage, Total Marks, and active selections are required");
      return;
    }

    const currentAssessments = getCurrentAssessments();
    const newId = currentAssessments.length > 0 
      ? Math.max(...currentAssessments.map((a) => a.id)) + 1 
      : 1;

    const newAssessmentObj = {
      id: newId,
      weightage: parseInt(newAssessment.weightage),
      total: parseInt(newAssessment.total),
      avg: 0,
      status: "Draft",
      modified: false,
      sectionId: activeSection._id,
      courseId: activeSubject.id,
    };

    // Create empty marks for all students
    const studentMarks = {};
    students.forEach(student => {
      studentMarks[student.id] = 0;
    });

    // Save to API first
    const success = await saveAssessmentMarks(newAssessmentObj, studentMarks);
    
    if (success) {
      setAssessments({
        ...assessments,
        [activeTab]: [
          ...assessments[activeTab],
          newAssessmentObj
        ],
      });

      // Reset form
      setNewAssessment({ weightage: 15, total: 15 });
      setShowAddForm(false);
    } else {
      alert("Failed to create assessment. Please try again.");
    }
  };

  // Delete an assessment
  const deleteAssessment = (id) => {
    // Note: Should ideally implement API call to delete the assessment
    setAssessments({
      ...assessments,
      [activeTab]: assessments[activeTab].filter((assessment) => assessment.id !== id),
    });

    if (showStudentMarks && selectedAssessment && selectedAssessment.id === id) {
      setShowStudentMarks(false);
    }
  };

  // Toggle assessment status
  const toggleStatus = (id) => {
    // Note: Should ideally implement API call to update the assessment status
    setAssessments({
      ...assessments,
      [activeTab]: assessments[activeTab].map((assessment) => {
        if (assessment.id === id) {
          let newStatus;
          if (assessment.status === "Published") {
            newStatus = "Unpublished";
          } else if (assessment.status === "Modified" || assessment.status === "Draft" || assessment.status === "Unpublished") {
            newStatus = "Published";
          }

          return {
            ...assessment,
            status: newStatus,
            modified: false,
          };
        }
        return assessment;
      }),
    });
  };

  // Handle showing the add assessment form
  const handleAddClick = () => {
    if (!activeSection || !activeSubject) {
      alert("Please select a subject and section first");
      return;
    }
    
    // Set default weightage based on assessment type
    let defaultWeightage = 15;
    if (activeTab === "Finals") defaultWeightage = 40;
    else if (activeTab === "Midterms") defaultWeightage = 25;
    else if (activeTab === "Assignments") defaultWeightage = 20;

    setNewAssessment({ weightage: defaultWeightage, total: 15 });
    setShowAddForm(true);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowStudentMarks(false);
  };

  // Handle subject change
  const handleSubjectChange = (subject) => {
    setActiveSubject(subject);
    
    // Reset section when subject changes
    const filteredSections = sections.filter(
      section => section.courseId === subject.id
    );
    
    if (filteredSections.length > 0) {
      setActiveSection(filteredSections[0]);
    } else {
      setActiveSection(null);
    }
    
    setShowStudentMarks(false);
  };

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setShowStudentMarks(false);
  };

  // Loader component
  const Loader = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-700"></div>
        <span className="text-gray-700">Processing...</span>
      </div>
    </div>
  );

  // Get filtered sections based on active subject
  const getFilteredSections = () => {
    if (!activeSubject) return [];
    
    return sections.filter(
      section => section.courseId === activeSubject.id
    );
  };

  return (
    <div className="w-full h-full min-w-0">
      {isLoading && <Loader />}
      <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 md:p-4 max-w-full">
          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Teacher Marks Management</h1>
            <button 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-700 text-white text-sm rounded hover:bg-red-800 transition-colors flex items-center gap-2" 
              onClick={handleAddClick}
            >
              + Add {activeTab.slice(0, -1)}
            </button>
          </div>

          {/* Subject and Section Filters */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Subject selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Subject</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                      activeSubject && activeSubject.id === subject.id 
                        ? "bg-red-700 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => handleSubjectChange(subject)}
                  >
                    {subject.code} - {subject.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Section selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Section</label>
              <div className="flex flex-wrap gap-2">
                {getFilteredSections().map((section) => (
                  <button
                    key={section._id}
                    className={`px-4 py-1.5 text-xs sm:text-sm rounded-md transition-colors font-medium ${
                      activeSection && activeSection._id === section._id 
                        ? "bg-red-700 text-white shadow-sm" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                    onClick={() => handleSectionChange(section)}
                  >
                    Section {section.section}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Import/Export buttons */}
          <div className="flex justify-end gap-2 mb-2">
            <div className="relative flex items-center gap-1">
              <label
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                onClick={handleFileInputClick}
              >
                <Upload size={14} />
                Import
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
              </label>
              <button className="text-gray-500 hover:text-blue-600" onClick={toggleImportHelp} title="Import Format Help">
                <Info size={14} />
              </button>
            </div>
            <button className="px-2 py-1 bg-blue-50 text-blue-600 text-xs sm:text-sm rounded hover:bg-blue-100 transition-colors flex items-center gap-1" onClick={handleExport}>
              <Download size={14} />
              Export
            </button>
          </div>

          {/* Import Format Help Panel */}
          {showImportHelp && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200 text-xs sm:text-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-blue-800">Excel Import Format</h3>
                <button className="text-gray-500 hover:text-gray-700" onClick={toggleImportHelp}>
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
          )}

          {/* Assessment type tabs */}
          <div className="border-b border-gray-200 mb-3 overflow-x-auto">
            <div className="flex whitespace-nowrap">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`py-1.5 px-3 text-xs sm:text-sm transition-colors ${
                    activeTab === tab ? "text-red-700 border-b-2 border-red-700 font-medium" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => handleTabChange(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Add Assessment Form */}
          {showAddForm && (
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
                <button className="px-3 py-1.5 bg-red-700 text-xs text-white rounded hover:bg-red-800 transition-colors" onClick={addAssessment}>
                  Add {activeTab.slice(0, -1)}
                </button>
                <button className="px-3 py-1.5 bg-gray-200 text-xs text-gray-700 rounded hover:bg-gray-300 transition-colors" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Assessment list or Student marks view */}
          {!showStudentMarks ? (
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
                  {!activeSection || !activeSubject || getCurrentAssessments().length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-3 text-center text-gray-500">
                        {!activeSection || !activeSubject 
                          ? "Please select a subject and section"
                          : `No ${activeTab.toLowerCase()} found for ${activeSubject.name} (Section ${activeSection.section}).`
                        }
                      </td>
                    </tr>
                  ) : (
                    getCurrentAssessments().map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleAssessmentClick(assessment)}>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.weightage}%</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.total}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{assessment.avg}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              assessment.status === "Published"
                                ? "bg-green-100 text-green-800"
                                : assessment.status === "Modified"
                                ? "bg-yellow-100 text-yellow-800"
                                : assessment.status === "Draft"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {assessment.status}
                            {assessment.modified && <AlertTriangle size={10} className="ml-1 text-yellow-600" />}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium space-x-1">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              className="text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-0.5 text-xs rounded flex items-center gap-1 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssessmentClick(assessment);
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
                                toggleStatus(assessment.id);
                              }}
                            >
                              {assessment.status === "Published" ? "Unpublish" : "Publish"}
                            </button>
                            <button
                              className="text-gray-500 hover:text-red-500 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAssessment(assessment.id);
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <StudentMarksView
                assessment={selectedAssessment}
                students={students}
                activeTab={activeTab}
                onBack={() => setShowStudentMarks(false)}
                onUpdate={(updatedAssessment, studentMarks) => updateAssessment(updatedAssessment, studentMarks)}
                onUpdateStudents={setStudents}
                onToggleStatus={toggleStatus}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMarksManagement;