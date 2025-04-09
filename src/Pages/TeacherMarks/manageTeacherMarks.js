import React, { useState, useEffect, useRef } from "react";
import { X, Download, Upload, Edit, AlertTriangle, Info } from "lucide-react";
import StudentMarksView from "./StudentMarksView";
import { handleExcelImport, createExcelExport } from "./csvUtils";
import axios from "axios";
import { toast } from "react-hot-toast";

// Assessment status constants
const ASSESSMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  MODIFIED: 'modified'
};

// Error handling utility
const handleApiError = (error, setError) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      setError("Section or students not found. Please refresh the page.");
    } else if (error.response?.status === 403) {
      setError("You don't have permission to perform this action.");
    } else if (error.response?.status === 400) {
      setError(error.response.data.message || "Invalid request. Please check your input.");
    } else {
      setError("Network error. Please check your connection.");
    }
  } else {
    setError("An unexpected error occurred. Please try again.");
  }
  console.error("API Error:", error);
};

const TeacherMarksManagement = () => {
  // API URL from environment variable
  const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  // Get auth token from session storage
  const getAuthToken = () => {
    return sessionStorage.getItem('token');
  };

  // Get teacher ID from session storage
  const getTeacherId = () => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.teacherId;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    return null;
  };

  // Get storage key with teacher ID
  const getStorageKey = (key) => {
    const teacherId = getTeacherId();
    return teacherId ? `${teacherId}_${key}` : key;
  };
  
  // State management
  const [activeTab, setActiveTab] = useState("Quizzes");
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [unpublishedMarks, setUnpublishedMarks] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);

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
    Midterms: "exam",
    Finals: "exam"
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
  
  // Load data from localStorage when component mounts - ONCE only
  useEffect(() => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      setError("Teacher ID not found. Please log in again.");
      return;
    }

    // Load saved assessments
    try {
      const savedAssessments = localStorage.getItem(getStorageKey('savedAssessments'));
      if (savedAssessments) {
        setAssessments(JSON.parse(savedAssessments));
      }
      
      // Load unpublished marks
      const savedMarks = localStorage.getItem(getStorageKey('unpublishedMarks'));
      if (savedMarks) {
        setUnpublishedMarks(JSON.parse(savedMarks));
      }
      
      setDataLoaded(true);
    } catch (e) {
      console.error('Error loading data from localStorage', e);
      setError("Failed to load saved data. Starting fresh.");
    }

    // Cleanup function
    return () => {
      // Only clear data if teacher ID is different
      const currentTeacherId = getTeacherId();
      if (currentTeacherId !== teacherId) {
        localStorage.removeItem(getStorageKey('savedAssessments'));
        localStorage.removeItem(getStorageKey('unpublishedMarks'));
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Save assessments to localStorage whenever they change
  useEffect(() => {
    if (dataLoaded && initialLoadComplete) {
      try {
        localStorage.setItem(getStorageKey('savedAssessments'), JSON.stringify(assessments));
      } catch (err) {
        console.error('Error saving assessments to localStorage:', err);
      }
    }
  }, [assessments, dataLoaded, initialLoadComplete]);

  // Save unpublished marks to localStorage whenever they change
  useEffect(() => {
    if (dataLoaded && initialLoadComplete) {
      try {
        localStorage.setItem(getStorageKey('unpublishedMarks'), JSON.stringify(unpublishedMarks));
      } catch (err) {
        console.error('Error saving unpublished marks to localStorage:', err);
      }
    }
  }, [unpublishedMarks, dataLoaded, initialLoadComplete]);

  // Fetch sections and courses when component mounts
  useEffect(() => {
    const teacherId = getTeacherId();
    if (teacherId) {
      fetchTeacherSections(teacherId);
    } else {
      setError("Teacher ID not found. Please log in again.");
    }
  }, []);

  // Fetch students when active section changes
  useEffect(() => {
    if (activeSection) {
      fetchStudents(activeSection._id);
    }
  }, [activeSection]);

  // Apply stored marks to students when contextual data changes
  useEffect(() => {
    if (students.length > 0 && Object.keys(unpublishedMarks).length > 0 && activeSection && activeSubject) {
      applyStoredMarksToStudents();
    }
    
    // Mark initial load as complete after everything is set up
    if (!initialLoadComplete && activeSection && activeSubject && students.length > 0) {
      setInitialLoadComplete(true);
    }
  }, [unpublishedMarks, activeSection, activeSubject, students.length]);

  // Helper function to apply stored marks to students - fixed to avoid unnecessary state updates
  const applyStoredMarksToStudents = () => {
    const currentAssessments = getCurrentAssessments();
    
    // Create a copy of students to update
    const updatedStudents = [...students];
    let hasChanges = false;
    
    // For each assessment in current section/subject, restore marks to students
    currentAssessments.forEach(assessment => {
      const key = getMarksKey(assessment.id);
      const marksData = unpublishedMarks[key];
      
      if (marksData) {
        // Update students with saved marks
        updatedStudents.forEach(student => {
          if (student.marks === undefined) {
            student.marks = {};
            hasChanges = true;
          }
          
          // Only update if the mark is different or doesn't exist
          if (student.marks[assessment.id] !== marksData[student.id]) {
            student.marks[assessment.id] = marksData[student.id] || 0;
            hasChanges = true;
          }
        });
      }
    });
    
    // Only update students state if there were actual changes
    if (hasChanges) {
      setStudents(updatedStudents);
    }
  };

  // Helper functions for mark management
  const getMarksKey = (assessmentId) => `marks_${activeSection?._id}_${activeSubject?.id}_${assessmentId}`;

  const saveMarksLocally = (assessmentId, studentMarks) => {
    const key = getMarksKey(assessmentId);
    setUnpublishedMarks(prev => ({
      ...prev,
      [key]: studentMarks
    }));
    
    // Direct update of students state without going through the useEffect
    setStudents(prevStudents => prevStudents.map(student => ({
      ...student,
      marks: {
        ...student.marks,
        [assessmentId]: studentMarks[student.id] || 0
      }
    })));
  };

  const getLocalMarks = (assessmentId) => {
    const key = getMarksKey(assessmentId);
    return unpublishedMarks[key] || {};
  };

  const clearLocalMarks = (assessmentId) => {
    const key = getMarksKey(assessmentId);
    setUnpublishedMarks(prev => {
      const newState = {...prev};
      delete newState[key];
      return newState;
    });
  };

  // Fetch teacher sections based on teacher ID
  const fetchTeacherSections = async (teacherId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${apiUrl}/api/section/getSections/${teacherId}`, {
        headers: {
          'x-auth-token': getAuthToken()
        }
      });
      
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
      } else {
        setError("No sections found for this teacher. Please contact the administrator.");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setError("Failed to load sections. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch students based on section ID
  const fetchStudents = async (sectionId) => {
    try {
      const controller = new AbortController();
      const response = await axios.get(`${apiUrl}/api/course-registration/getStudents/${sectionId}`, {
        headers: {
          'x-auth-token': getAuthToken()
        },
        signal: controller.signal
      });
      setStudents(response.data);
      return () => controller.abort();
    } catch (error) {
      if (error.name !== 'AbortError') {
        handleApiError(error, setError);
      }
    }
  };

  // Save assessment marks to the API or locally
  const saveAssessmentMarks = async (assessment, studentMarks, isPublishing = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const type = tabToApiTypeMap[activeTab];
      
      // Prepare grades data for each student
      const grades = students.map(student => {
        if (!student || !student.id) {
          console.error("Error: Invalid student object", student);
          return null;
        }
        
        // Find the registration for this student in this section
        const registration = student.registrationId || null;
        
        if (!registration) {
          console.error(`No registration found for student ${student.id} in section ${activeSection._id}`);
          return null;
        }
        
        return {
          registrationId: registration,
          type: type,
          title: `${assessment.title || activeTab} #${assessment.id}`,
          description: `${activeTab} Assessment for ${activeSubject?.name}`,
          maxMarks: assessment.total || 0,
          obtainedMarks: studentMarks?.[student.id] ?? 0,
          feedback: "",
          weightage: assessment.weightage || 0,
          gradedBy: getTeacherId(),
          status: isPublishing ? 'published' : 'draft'
        };
      }).filter(grade => grade !== null);
      
      if (grades.length === 0) {
        setError("No valid grades to save. Please check student registrations.");
        return false;
      }
      
      // Post grades to API using the teacher-marks endpoint
      const response = await axios.post(`${apiUrl}/api/teacher-marks/section/${activeSection._id}/grades`, { 
        grades,
        isPublishing
      }, {
        headers: {
          'x-auth-token': getAuthToken()
        }
      });
      
      // Clear local marks after successful publishing
      if (isPublishing) {
        clearLocalMarks(assessment.id);
      }
      
      return true;
    } catch (error) {
      handleApiError(error, setError);
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
    // If we have locally stored marks, load them into the students state
    const localMarks = getLocalMarks(assessment.id);
    
    const updatedStudents = students.map(student => ({
      ...student,
      marks: {
        ...student.marks,
        [assessment.id]: localMarks[student.id] || 0
      }
    }));
    
    setStudents(updatedStudents);
    setSelectedAssessment(assessment);
    setShowStudentMarks(true);
  };

  // Update assessment after student marks have been edited
  const updateAssessment = async (updatedAssessment, studentMarks) => {
    // Save to API only if the assessment is published
    const success = await saveAssessmentMarks(
      updatedAssessment, 
      studentMarks,
      updatedAssessment.status === "Published"
    );
    
    if (success) {
      // If the assessment is published, mark it as modified if changes were made
      const isModified = updatedAssessment.status === "Published" && 
                         JSON.stringify(getLocalMarks(updatedAssessment.id)) !== JSON.stringify(studentMarks);
      
      setAssessments({
        ...assessments,
        [activeTab]: assessments[activeTab].map((assessment) => 
          (assessment.id === updatedAssessment.id ? 
            {...updatedAssessment, modified: isModified} 
            : assessment)
        ),
      });
      setSelectedAssessment({...updatedAssessment, modified: isModified});
    } else {
      alert("Failed to save assessment marks. Please try again.");
    }
  };

  // Handle import of Excel file
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file || !activeSection || !activeSubject) return;
    
    setIsLoading(true);
    setError(null);

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
        setError("Failed to import data. Please check the file format and try again.");
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

  // Download template for marks import
  const downloadTemplate = () => {
    if (!activeSection || !activeSubject) {
      alert("Please select a subject and section first");
      return;
    }
    
    setIsLoading(true);
    
    // Create a sample template with required columns
    const sampleAssessment = {
      id: 1,
      weightage: 15,
      total: 20
    };
    
    const sampleStudent = {
      id: "SAMPLE_ID",
      name: "Sample Student",
      marks: { 1: 18 }
    };
    
    // Use the export function with sample data
    createExcelExport(
      [sampleAssessment], 
      [sampleStudent], 
      activeSubject.name, 
      activeTab,
      "marks_template.xlsx"
    );
    
    setIsLoading(false);
  };

  // Toggle import help panel
  const toggleImportHelp = () => {
    setShowImportHelp(!showImportHelp);
  };

  // Add a new assessment
  const addAssessment = async () => {
    if (!newAssessment.weightage || !newAssessment.total || !activeSection || !activeSubject) {
      setError("Weightage, Total Marks, and active selections are required");
      return;
    }

    // Validate weightage
    if (newAssessment.weightage <= 0 || newAssessment.weightage > 100) {
      setError("Weightage must be between 1 and 100");
      return;
    }

    // Validate total marks
    if (newAssessment.total <= 0) {
      setError("Total marks must be greater than 0");
      return;
    }

    // Validate total weightage for the assessment type
    const currentAssessments = getCurrentAssessments();
    const totalWeightage = currentAssessments.reduce((sum, a) => sum + a.weightage, 0);
    if (totalWeightage + newAssessment.weightage > 100) {
      setError(`Total weightage for ${activeTab} cannot exceed 100%. Current total: ${totalWeightage}%`);
      return;
    }

    // Generate a unique title by finding the highest existing number and incrementing it
    const existingNumbers = currentAssessments
      .map(a => {
        const match = a.title.match(/#(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => !isNaN(num));
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const uniqueTitle = `${activeTab.slice(0, -1)} #${nextNumber}`;

    const newAssessmentObj = {
      id: nextNumber,
      title: uniqueTitle,
      weightage: parseInt(newAssessment.weightage),
      total: parseInt(newAssessment.total),
      avg: 0,
      status: ASSESSMENT_STATUS.DRAFT,
      modified: false,
      sectionId: activeSection._id,
      courseId: activeSubject.id,
      type: tabToApiTypeMap[activeTab]
    };

    // Create empty marks for all students
    const studentMarks = {};
    students.forEach(student => {
      studentMarks[student.id] = 0;
    });

    // Don't send to API yet, just store locally
    saveMarksLocally(nextNumber, studentMarks);
    
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
  };

  // Delete an assessment
  const deleteAssessment = (id) => {
    // Clear any local marks for this assessment
    clearLocalMarks(id);
    
    // Remove the assessment from the state
    setAssessments({
      ...assessments,
      [activeTab]: assessments[activeTab].filter((assessment) => assessment.id !== id),
    });

    // If currently viewing this assessment, go back to list view
    if (showStudentMarks && selectedAssessment && selectedAssessment.id === id) {
      setShowStudentMarks(false);
    }
    
    // Note: Should ideally implement API call to delete the assessment if published
  };

  // Toggle assessment status
  const toggleStatus = async (id) => {
    const assessment = assessments[activeTab].find(a => a.id === id);
    if (!assessment) return;
    
    let newStatus;
    if (assessment.status === ASSESSMENT_STATUS.PUBLISHED) {
      // When unpublishing, just change the status
      newStatus = ASSESSMENT_STATUS.MODIFIED;
    } else if (assessment.status === ASSESSMENT_STATUS.MODIFIED || 
               assessment.status === ASSESSMENT_STATUS.DRAFT) {
      // When publishing, ask for confirmation
      if (!window.confirm('Are you sure you want to publish this assessment? Once published, it will be visible to students.')) {
        return;
      }
      
      // When publishing, send marks to the API
      newStatus = ASSESSMENT_STATUS.PUBLISHED;
      
      const studentMarks = getLocalMarks(id);
      const success = await saveAssessmentMarks(assessment, studentMarks, true);
      
      if (!success) {
        setError("Failed to publish assessment. Please try again.");
        return;
      }
    }

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
    
    // Update selected assessment if it's the one being toggled
    if (selectedAssessment && selectedAssessment.id === id) {
      setSelectedAssessment({
        ...selectedAssessment,
        status: newStatus,
        modified: false
      });
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

  // Check if assessment has unpublished changes
  const hasUnpublishedChanges = (assessmentId) => {
    return Object.keys(getLocalMarks(assessmentId)).length > 0;
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

  // Error message component
  const ErrorMessage = () => (
    error ? (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    ) : null
  );

  // Get filtered sections based on active subject
  const getFilteredSections = () => {
    if (!activeSubject) return [];
    
    return sections.filter(
      section => section.courseId === activeSubject.id
    );
  };

  const handlePublish = async () => {
    if (!selectedAssessment) return;
    
    // Get the current marks for the selected assessment
    const currentMarks = getLocalMarks(selectedAssessment.id);
    
    // Save to API as published
    const success = await saveAssessmentMarks(selectedAssessment, currentMarks, true);
    
    if (success) {
      // Update local state
      setAssessments({
        ...assessments,
        [activeTab]: assessments[activeTab].map((a) => {
          if (a.id === selectedAssessment.id) {
            return {
              ...a,
              modified: false,
              status: ASSESSMENT_STATUS.PUBLISHED
            };
          }
          return a;
        }),
      });
      
      // Update selected assessment
      setSelectedAssessment({
        ...selectedAssessment,
        modified: false,
        status: ASSESSMENT_STATUS.PUBLISHED
      });
      
      // Clear local marks since they're now saved in the API
      clearLocalMarks(selectedAssessment.id);
      
      // Show success message
      toast.success('Assessment published successfully');
    }
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

          {/* Error message */}
          <ErrorMessage />

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
            <button 
              className="px-2 py-1 bg-green-50 text-green-600 text-xs sm:text-sm rounded hover:bg-green-100 transition-colors flex items-center gap-1" 
              onClick={downloadTemplate}
              title="Download import template"
            >
              <Download size={14} />
              Template
            </button>
            <button className="px-2 py-1 bg-blue-50 text-blue-600 text-xs sm:text-sm rounded hover:bg-blue-100 transition-colors flex items-center gap-1" onClick={handleExport}>
              <Download size={14} />
              Export
            </button>
          </div>

          {/* Import help panel */}
          {showImportHelp && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-sm text-blue-800">Import Format Help</h3>
                <button onClick={toggleImportHelp} className="text-blue-500 hover:text-blue-700">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-blue-700 mb-2">
                Your Excel file should contain the following columns:
              </p>
              <ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
                {requiredColumns.map((col, index) => (
                  <li key={index}>
                    <span className="font-medium">{col.name}</span> ({col.type}): {col.description}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                Download the template for the correct format.
              </p>
            </div>
          )}

          {/* Assessment tabs */}
          <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-2 border-red-700 text-red-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Add assessment form */}
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
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={newAssessment.total}
                    onChange={(e) => setNewAssessment({ ...newAssessment, total: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="1"
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
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            assessment.status === "Published" 
                              ? "bg-green-100 text-green-800" 
                              : assessment.status === "Modified"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatus(assessment.id);
                              }}
                            >
                              {assessment.status === "Published" ? "Unpublish" : "Publish"}
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAssessment(assessment.id);
                              }}
                            >
                              Delete
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
                hasLocalChanges={hasUnpublishedChanges(selectedAssessment?.id)}
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