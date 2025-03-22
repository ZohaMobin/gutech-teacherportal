import { useState, useEffect } from "react";

export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedData, setStoredData] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  // Helper function to create key for marks
  const getMarksKey = (sectionId, courseId, assessmentId) => {
    return `marks_${sectionId}_${courseId}_${assessmentId}`;
  };
  
  // Save marks locally with section and course context
  const saveMarksLocally = (assessmentId, studentMarks, sectionId, courseId) => {
    const key = getMarksKey(sectionId, courseId, assessmentId);
    setStoredData(prev => ({
      ...prev,
      [key]: studentMarks
    }));
  };
  
  // Get local marks with section and course context
  const getLocalMarks = (assessmentId, sectionId, courseId) => {
    const key = getMarksKey(sectionId, courseId, assessmentId);
    return storedData[key] || {};
  };
  
  // Clear local marks
  const clearLocalMarks = (assessmentId, sectionId, courseId) => {
    const key = getMarksKey(sectionId, courseId, assessmentId);
    setStoredData(prev => {
      const newState = {...prev};
      delete newState[key];
      return newState;
    });
  };
  
  // Check if assessment has unpublished changes
  const hasUnpublishedChanges = (assessmentId, sectionId, courseId) => {
    return Object.keys(getLocalMarks(assessmentId, sectionId, courseId)).length > 0;
  };
  
  // Update local storage when storedData changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedData));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedData]);
  
  // Return all necessary values and functions
  return {
    storedData,
    setStoredData,
    saveMarksLocally,
    getLocalMarks,
    clearLocalMarks,
    hasUnpublishedChanges
  };
};