import { useState, useEffect } from "react";

export const useAssessments = (activeTab, activeSection, activeSubject) => {
  const [assessments, setAssessments] = useState({
    Quizzes: [],
    Assignments: [],
    Midterms: [],
    Finals: [],
  });
  
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  
  // Load assessments from local storage when component mounts or when dependencies change
  useEffect(() => {
    const loadStoredAssessments = () => {
      try {
        // Look for saved assessments in localStorage
        const storedAssessments = localStorage.getItem('assessments');
        if (storedAssessments) {
          setAssessments(JSON.parse(storedAssessments));
        }
      } catch (error) {
        console.error("Error loading assessments from localStorage", error);
      }
    };
    
    loadStoredAssessments();
  }, []);
  
  // Save assessments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('assessments', JSON.stringify(assessments));
  }, [assessments]);
  
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
    
    setAssessments(prev => {
      const newState = {...prev};
      newState[activeTab] = [...prev[activeTab], assessmentData];
      return newState;
    });
  };
  
  // Update an assessment in the state
  const updateAssessmentInState = (updatedAssessment) => {
    if (!activeTab) return;
    
    setAssessments(prev => {
      const newState = {...prev};
      newState[activeTab] = prev[activeTab].map(assessment => 
        assessment.id === updatedAssessment.id ? updatedAssessment : assessment
      );
      return newState;
    });
    
    if (selectedAssessment && selectedAssessment.id === updatedAssessment.id) {
      setSelectedAssessment(updatedAssessment);
    }
  };
  
  // Delete an assessment from the state
  const deleteAssessmentFromState = (id) => {
    if (!activeTab) return;
    
    setAssessments(prev => {
      const newState = {...prev};
      newState[activeTab] = prev[activeTab].filter(assessment => assessment.id !== id);
      return newState;
    });
    
    if (selectedAssessment && selectedAssessment.id === id) {
      setSelectedAssessment(null);
    }
  };
  
  // Toggle assessment status
  const toggleAssessmentStatus = (id, newStatus) => {
    if (!activeTab) return;
    
    setAssessments(prev => {
      const newState = {...prev};
      newState[activeTab] = prev[activeTab].map(a => {
        if (a.id === id) {
          return {
            ...a,
            status: newStatus,
            modified: false,
          };
        }
        return a;
      });
      return newState;
    });
    
    if (selectedAssessment && selectedAssessment.id === id) {
      setSelectedAssessment({
        ...selectedAssessment,
        status: newStatus,
        modified: false
      });
    }
  };
  
  // Add multiple assessments at once (for import)
  const addMultipleAssessments = (newAssessments, tabName) => {
    if (!tabName) tabName = activeTab;
    
    setAssessments(prev => {
      // Create a copy of current assessments
      const newState = {...prev};
      
      // Get existing IDs to avoid duplicates
      const existingIds = new Set(prev[tabName].map(a => a.id));
      
      // Add only assessments that don't already exist
      newState[tabName] = [
        ...prev[tabName],
        ...newAssessments.filter(a => !existingIds.has(a.id))
      ];
      
      return newState;
    });
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
    toggleAssessmentStatus,
    addMultipleAssessments
  };
};