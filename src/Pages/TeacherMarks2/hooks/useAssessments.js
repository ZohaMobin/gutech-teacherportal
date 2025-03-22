import { useState, useEffect } from "react";

export const useAssessments = (activeTab, activeSection, activeSubject) => {
  const [assessments, setAssessments] = useState({
    Quizzes: [],
    Assignments: [],
    Midterms: [],
    Finals: [],
  });
  
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  
  // Get current assessments based on active tab, section, and subject
  const getCurrentAssessments = () => {
    if (!activeSection || !activeSubject) return [];
    
    return assessments[activeTab].filter(
      assessment => 
        assessment.sectionId === activeSection._id && 
        assessment.courseId === activeSubject.id
    );
  };
  
  // Add a new assessment to the state
  const addNewAssessment = (assessmentData) => {
    if (!activeTab) return;
    
    setAssessments({
      ...assessments,
      [activeTab]: [
        ...assessments[activeTab],
        assessmentData
      ],
    });
  };
  
  // Update an assessment in the state
  const updateAssessmentInState = (updatedAssessment) => {
    if (!activeTab) return;
    
    setAssessments({
      ...assessments,
      [activeTab]: assessments[activeTab].map((assessment) => 
        (assessment.id === updatedAssessment.id ? updatedAssessment : assessment)
      ),
    });
    
    if (selectedAssessment && selectedAssessment.id === updatedAssessment.id) {
      setSelectedAssessment(updatedAssessment);
    }
  };
  
  // Delete an assessment from the state
  const deleteAssessmentFromState = (id) => {
    if (!activeTab) return;
    
    setAssessments({
      ...assessments,
      [activeTab]: assessments[activeTab].filter((assessment) => assessment.id !== id),
    });
    
    if (selectedAssessment && selectedAssessment.id === id) {
      setSelectedAssessment(null);
    }
  };
  
  // Toggle assessment status
  const toggleAssessmentStatus = (id, newStatus) => {
    if (!activeTab) return;
    
    setAssessments({
      ...assessments,
      [activeTab]: assessments[activeTab].map((a) => {
        if (a.id === id) {
          return {
            ...a,
            status: newStatus,
            modified: false,
          };
        }
        return a;
      }),
    });
    
    if (selectedAssessment && selectedAssessment.id === id) {
      setSelectedAssessment({
        ...selectedAssessment,
        status: newStatus,
        modified: false
      });
    }
  };
  
  // Return all the functions and state
  return {
    assessments,
    setAssessments,
    selectedAssessment,
    setSelectedAssessment,
    getCurrentAssessments,
    addNewAssessment,
    updateAssessmentInState,
    deleteAssessmentFromState,
    toggleAssessmentStatus
  };
};