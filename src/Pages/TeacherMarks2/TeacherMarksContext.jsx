import React, { createContext, useContext, useState, useEffect } from "react";
import { useAssessments } from "./hooks/useAssessments";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { fetchTeacherSections, fetchStudents } from "./helpers/apiHelpers";

const TeacherMarksContext = createContext();

export const useTeacherMarks = () => {
  return useContext(TeacherMarksContext);
};

export const TeacherMarksProvider = ({ children }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState("Quizzes");
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  
  // Assessment state using custom hook
  const { 
    assessments, 
    setAssessments, 
    selectedAssessment, 
    setSelectedAssessment,
    getCurrentAssessments,
    addNewAssessment,
    updateAssessmentInState,
    deleteAssessmentFromState,
    toggleAssessmentStatus
  } = useAssessments(activeTab, activeSection, activeSubject);
  
  // Local storage hook for unpublished marks
  const { 
    storedData: unpublishedMarks, 
    setStoredData: setUnpublishedMarks,
    saveMarksLocally,
    getLocalMarks,
    clearLocalMarks,
    hasUnpublishedChanges
  } = useLocalStorage("unpublishedMarks", {});
  
  // UI states
  const [showStudentMarks, setShowStudentMarks] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  
  // New assessment form state
  const [newAssessment, setNewAssessment] = useState({ weightage: 15, total: 15 });
  
  // Constants
  const tabToApiTypeMap = {
    Quizzes: "quiz",
    Assignments: "assignment",
    Midterms: "midterm",
    Finals: "final",
  };
  
  const teacherId = "67dde7b0cadf2777c7a12567";
  
  // Fetch sections and courses when component mounts
  useEffect(() => {
    if (teacherId) {
      loadTeacherData(teacherId);
    }
  }, [teacherId]);
  
  // Fetch students when active section changes
 // Modify the useEffect for loading student data in TeacherMarksContext.jsx

// Fetch students when active section changes
useEffect(() => {
    if (activeSection) {
      loadStudents(activeSection._id);
    }
  }, [activeSection]);
  
  // Also add this effect to restore marks from localStorage
  useEffect(() => {
    if (students.length > 0 && activeSection && activeSubject) {
      // Restore student marks from unpublished marks in localStorage
      const updatedStudents = [...students];
      let hasUpdates = false;
      
      // Get all assessment IDs for the current section/subject
      const currentAssessments = getCurrentAssessments();
      
      currentAssessments.forEach(assessment => {
        const localMarks = getLocalMarks(
          assessment.id, 
          activeSection._id, 
          activeSubject.id
        );
        
        if (Object.keys(localMarks).length > 0) {
          // Update each student with their marks
          updatedStudents.forEach(student => {
            if (localMarks[student.id] !== undefined) {
              if (!student.marks) student.marks = {};
              student.marks[assessment.id] = localMarks[student.id];
              hasUpdates = true;
            }
          });
        }
      });
      
      if (hasUpdates) {
        setStudents(updatedStudents);
      }
    }
  }, [students, activeSection, activeSubject, assessments]);
  
  // Load teacher data (sections and subjects)
  const loadTeacherData = async (teacherId) => {
    setIsLoading(true);
    try {
      const data = await fetchTeacherSections(teacherId);
      
      setSections(data.formattedSections);
      setSubjects(data.uniqueSubjects);
      
      // Set defaults
      if (data.uniqueSubjects.length > 0) {
        setActiveSubject(data.uniqueSubjects[0]);
        
        // Filter sections by the first subject
        const filteredSections = data.formattedSections.filter(
          section => section.courseName === data.uniqueSubjects[0].name
        );
        
        if (filteredSections.length > 0) {
          setActiveSection(filteredSections[0]);
        }
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load students for a section
  const loadStudents = async (sectionId) => {
    setIsLoading(true);
    try {
      const formattedStudents = await fetchStudents(sectionId);
      setStudents(formattedStudents);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setIsLoading(false);
    }
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
  
  // Get filtered sections based on active subject
  const getFilteredSections = () => {
    if (!activeSubject) return [];
    
    return sections.filter(
      section => section.courseId === activeSubject.id
    );
  };
  
  // Value object that will be passed to consumers
  const value = {
    // States
    activeTab,
    isLoading,
    setIsLoading,
    sections,
    students,
    setStudents,
    activeSection,
    subjects,
    activeSubject,
    assessments,
    showStudentMarks,
    selectedAssessment,
    newAssessment,
    showAddForm,
    showImportHelp,
    unpublishedMarks,
    tabToApiTypeMap,
    
    // Actions
    setActiveTab: handleTabChange,
    setActiveSection: handleSectionChange,
    setActiveSubject: handleSubjectChange,
    setShowStudentMarks,
    setSelectedAssessment,
    setNewAssessment,
    setShowAddForm,
    setShowImportHelp,
    setUnpublishedMarks,
    
    // Helper functions
    saveMarksLocally,
    getLocalMarks,
    clearLocalMarks,
    getCurrentAssessments,
    getFilteredSections,
    hasUnpublishedChanges,
    addNewAssessment,
    updateAssessmentInState,
    deleteAssessmentFromState,
    toggleAssessmentStatus
  };
  
  return (
    <TeacherMarksContext.Provider value={value}>
      {children}
    </TeacherMarksContext.Provider>
  );
};