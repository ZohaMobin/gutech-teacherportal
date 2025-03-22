import React, { useRef } from "react";
import { Download, Upload, Info } from "lucide-react";
import { handleExcelImport, createExcelExport } from "../utils/csvUtils";
import { TeacherMarksProvider, useTeacherMarks } from "./TeacherMarksContext";
import AssessmentTable from "./AssessmentTable";
import StudentMarksView from "./StudentMarksView";
import AssessmentForm from "./AssessmentForm";
import ImportHelpPanel from "./ImportHelpPanel";
import { createNewAssessment } from "./helpers/assessmentHelpers";
import { saveAssessmentMarks } from "./helpers/apiHelpers";

// Loader component
const Loader = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-700"></div>
      <span className="text-gray-700">Processing...</span>
    </div>
  </div>
);

const TeacherMarksManagementContent = () => {
  const { 
    // States
    activeTab,
    isLoading,
    setIsLoading,
    students,
    setStudents,
    activeSection,
    activeSubject,
    showStudentMarks,
    selectedAssessment,
    newAssessment,
    showAddForm,
    showImportHelp,
    tabToApiTypeMap,
    
    // Actions
    setActiveTab,
    setShowStudentMarks,
    setSelectedAssessment,
    setNewAssessment,
    setShowAddForm,
    setShowImportHelp,
    
    // Helper functions
    saveMarksLocally,
    getLocalMarks,
    clearLocalMarks,
    getCurrentAssessments,
    addNewAssessment: addNewAssessmentToState,
    updateAssessmentInState,
    toggleAssessmentStatus,
    deleteAssessmentFromState
  } = useTeacherMarks();
  
  const fileInputRef = useRef(null);
  
  // Tabs for assessment categories
  const tabs = ["Quizzes", "Assignments", "Midterms", "Finals"];
  
  // Handle assessment selection to show student marks
  const handleAssessmentClick = (assessment) => {
    // If we have locally stored marks, load them into the students state
    const localMarks = getLocalMarks(assessment.id, activeSection._id, activeSubject.id);
    
    if (Object.keys(localMarks).length > 0) {
      const updatedStudents = students.map(student => ({
        ...student,
        marks: {
          ...student.marks,
          [assessment.id]: localMarks[student.id] || 0
        }
      }));
      setStudents(updatedStudents);
    }
    
    setSelectedAssessment(assessment);
    setShowStudentMarks(true);
  };
  
  // Update assessment after student marks have been edited
  const updateAssessment = async (updatedAssessment, studentMarks) => {
    // Always save marks locally
    saveMarksLocally(
      updatedAssessment.id, 
      studentMarks, 
      activeSection._id, 
      activeSubject.id
    );
    
    // If publishing, save to API
    if (updatedAssessment.status === "Published") {
      setIsLoading(true);
      
      const type = tabToApiTypeMap[activeTab];
      
      try {
        const success = await saveAssessmentMarks(
          updatedAssessment, 
          studentMarks,
          students,
          type
        );
        
        if (success) {
          // Clear local marks after successful publishing
          clearLocalMarks(updatedAssessment.id, activeSection._id, activeSubject.id);
        } else {
          alert("Failed to save assessment marks. Please try again.");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error publishing marks:", error);
        alert("Failed to publish assessment marks. Please try again.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(false);
    }
    
    // Update the assessment in state
    updateAssessmentInState(updatedAssessment);
  };
  
  // Handle file input click
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

        // Add each assessment to the state
        assessmentsWithContext.forEach(assessment => {
          addNewAssessmentToState(assessment);
          
          // Save marks data to local storage
          const studentMarks = {};
          students.forEach(student => {
            if (student.marks && student.marks[assessment.id] !== undefined) {
              studentMarks[student.id] = student.marks[assessment.id];
            } else {
              studentMarks[student.id] = 0;
            }
          });
          
          // Save to local storage
          saveMarksLocally(
            assessment.id, 
            studentMarks, 
            activeSection._id, 
            activeSubject.id
          );
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
  const addAssessment = () => {
    if (!newAssessment.weightage || !newAssessment.total || !activeSection || !activeSubject) {
      alert("Weightage, Total Marks, and active selections are required");
      return;
    }

    const currentAssessments = getCurrentAssessments();
    const newAssessmentObj = createNewAssessment(
      newAssessment, 
      activeSection._id, 
      activeSubject.id,
      currentAssessments
    );

    // Create empty marks for all students
    const studentMarks = {};
    students.forEach(student => {
      studentMarks[student.id] = 0;
    });

    // Save locally
    saveMarksLocally(
      newAssessmentObj.id, 
      studentMarks, 
      activeSection._id, 
      activeSubject.id
    );
    
    // Add to state
    addNewAssessmentToState(newAssessmentObj);

    // Reset form
    setNewAssessment({ weightage: 15, total: 15 });
    setShowAddForm(false);
  };
  
  // Delete an assessment
  const deleteAssessment = (id) => {
    // Clear any local marks for this assessment
    clearLocalMarks(id, activeSection._id, activeSubject.id);
    
    // Remove from state
    deleteAssessmentFromState(id);
    
    // If currently viewing this assessment, go back to list view
    if (showStudentMarks && selectedAssessment && selectedAssessment.id === id) {
      setShowStudentMarks(false);
    }
  };
  
  // Toggle assessment status
  const toggleStatus = async (id) => {
    const assessment = getCurrentAssessments().find(a => a.id === id);
    if (!assessment) return;
    
    let newStatus;
    if (assessment.status === "Published") {
      // When unpublishing, just change the status
      newStatus = "Unpublished";
      toggleAssessmentStatus(id, newStatus);
    } else if (assessment.status === "Modified" || assessment.status === "Draft" || assessment.status === "Unpublished") {
      // When publishing, send marks to the API
      newStatus = "Published";
      
      setIsLoading(true);
      const studentMarks = getLocalMarks(id, activeSection._id, activeSubject.id);
      const type = tabToApiTypeMap[activeTab];
      
      const success = await saveAssessmentMarks(
        assessment, 
        studentMarks,
        students,
        type
      );
      
      if (success) {
        // Clear local marks
        clearLocalMarks(id, activeSection._id, activeSubject.id);
        toggleAssessmentStatus(id, newStatus);
      } else {
        alert("Failed to publish assessment. Please try again.");
      }
      
      setIsLoading(false);
    }
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

          {/* Section and Subject filters are moved to a separate component */}
          <FilterSection />

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
            <button 
              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs sm:text-sm rounded hover:bg-blue-100 transition-colors flex items-center gap-1" 
              onClick={handleExport}
            >
              <Download size={14} />
              Export
            </button>
          </div>

          {/* Import Help Panel */}
          {showImportHelp && <ImportHelpPanel onClose={toggleImportHelp} />}

          {/* Assessment type tabs */}
          <div className="border-b border-gray-200 mb-3 overflow-x-auto">
            <div className="flex whitespace-nowrap">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`py-1.5 px-3 text-xs sm:text-sm transition-colors ${
                    activeTab === tab ? "text-red-700 border-b-2 border-red-700 font-medium" : "text-gray-500 hover:text-gray-700"
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
            <AssessmentForm 
              newAssessment={newAssessment}
              setNewAssessment={setNewAssessment}
              onAdd={addAssessment}
              onCancel={() => setShowAddForm(false)}
              activeTab={activeTab}
            />
          )}

          {/* Assessment list or Student marks view */}
          {!showStudentMarks ? (
            <AssessmentTable 
              onAssessmentClick={handleAssessmentClick}
              onDeleteAssessment={deleteAssessment}
              onToggleStatus={toggleStatus}
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <StudentMarksView
                onBack={() => setShowStudentMarks(false)}
                onUpdate={updateAssessment}
                onToggleStatus={toggleStatus}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Filter section component for subjects and sections
const FilterSection = () => {
  const {
    subjects,
    activeSubject,
    setActiveSubject,
    getFilteredSections,
    activeSection,
    setActiveSection
  } = useTeacherMarks();
  
  return (
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
              onClick={() => setActiveSubject(subject)}
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
              onClick={() => setActiveSection(section)}
            >
              Section {section.section}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main component that wraps everything with the context provider
const TeacherMarksManagement = () => {
  return (
    <TeacherMarksProvider>
      <TeacherMarksManagementContent />
    </TeacherMarksProvider>
  );
};

export default TeacherMarksManagement;