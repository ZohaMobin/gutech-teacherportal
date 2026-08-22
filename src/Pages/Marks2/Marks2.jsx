import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, Download, Plus, Trash2, Save, X, FileSpreadsheet, AlertCircle, Edit2, Search, Table2, ClipboardList } from 'lucide-react';
import * as XLSX from 'xlsx';
import './Marks2.css';

const sortStudentsAscending = (studentsList = []) =>
  [...studentsList].sort((a, b) =>
    (a.rollNumber || '').localeCompare(b.rollNumber || '', undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );

const getSafeSheetName = (name, fallback) => {
  const cleaned = (name || fallback || 'Sheet').replace(/[\\/?*[\]:]/g, '').trim();
  return (cleaned || fallback || 'Sheet').slice(0, 31);
};

const formatAssessmentColumnLabel = (assessment) => `${assessment.title} (${assessment.maxMarks})`;

const getSectionFileLabel = (section) => {
  const courseName = section?.courseId?.name || section?.courseName || 'Section';
  const sectionName = section?.section ? `Section_${section.section}` : section?.name || 'Section';

  return `${courseName}_${sectionName}`
    .replace(/\s+/g, '_')
    .replace(/[\\/?*[\]:]/g, '');
};

const Marks2 = () => {
  // State variables
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [studentMarks, setStudentMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    type: 'quiz',
    maxMarks: 100,
    weightage: 10,
    description: ''
  });
  const [showEditAssessmentModal, setShowEditAssessmentModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [activeMarksView, setActiveMarksView] = useState('entry');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [minMarks, setMinMarks] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // API URL from environment variable
  const apiUrl = process.env.REACT_APP_BACKEND_URL;
  
  // Get auth token from session storage
  const getAuthToken = () => {
    return sessionStorage.getItem('token');
  };

  // Get teacher ID from session storage
  const getTeacherId = () => {
    const userData = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');

    if (!userData || !token) {
      console.error('Missing user data or token in session');
      return null;
    }

    try {
      const user = JSON.parse(userData);
      if (!user || !user.teacherId) {
        console.error('Invalid user data structure:', user);
        return null;
      }
      return user.teacherId;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  };

  // Error handling utility
  const handleApiError = (error) => {
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

  // Fetch teacher sections
  const fetchTeacherSections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const teacherId = getTeacherId();
      if (!teacherId) {
        setError("Teacher ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${apiUrl}/api/sections/getSections/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data) {
        setSections(response.data);
        
        // Set the first section as active if available
        if (response.data.length > 0 && !activeSection) {
          setActiveSection(response.data[0]);
          fetchStudents(response.data[0]._id);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for a section
  const fetchStudents = async (sectionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/api/teacher-marks/section/${sectionId}/students`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data) {
        const sortedStudents = sortStudentsAscending(response.data);
        setStudents(sortedStudents);
        
        // Initialize student marks
        const initialMarks = {};
        sortedStudents.forEach(student => {
          initialMarks[student.id] = {};
        });
        setStudentMarks(initialMarks);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assessments for a section
  const fetchAssessments = async (sectionId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/api/assessments/section/${sectionId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data && response.data.assessments) {
        setAssessments(response.data.assessments);
        
        // Set the first assessment as active if available
        if (response.data.assessments.length > 0 && !activeAssessment) {
          setActiveAssessment(response.data.assessments[0]);
          fetchAssessmentMarks(response.data.assessments[0]._id);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch marks for a specific assessment
  const fetchAssessmentMarks = async (assessmentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/api/teacher-marks/assessment/${assessmentId}/marks`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data && response.data.marks) {
        // Update student marks with the fetched marks
        setStudentMarks(prevMarks => {
          const updatedMarks = { ...prevMarks };
          
          // Initialize marks for all students if not already done
          students.forEach(student => {
            if (!updatedMarks[student.id]) {
              updatedMarks[student.id] = {};
            }
          });
          
          // Update with fetched marks
          Object.entries(response.data.marks).forEach(([studentId, mark]) => {
            if (updatedMarks[studentId]) {
              updatedMarks[studentId][assessmentId] = mark;
            }
          });
          
          return updatedMarks;
        });
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle section change
  const handleSectionChange = (section) => {
    // Reset states when changing sections
    setActiveSection(section);
    setActiveAssessment(null);
    setStudentMarks({});
    setAssessments([]);
    setSearchTerm('');
    setMinMarks('');
    setMaxMarks('');
    
    // Fetch new data for the selected section
    fetchStudents(section._id);
    fetchAssessments(section._id);
  };

  // Handle assessment change
  const handleAssessmentChange = (assessment) => {
    setActiveAssessment(assessment);
    fetchAssessmentMarks(assessment._id);
  };

  // Filter students based on search term and marks range
  useEffect(() => {
    if (!students.length || !activeAssessment) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      // Filter by name search term
      const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by marks range
      const studentMark = studentMarks[student.id]?.[activeAssessment._id] || 0;
      const minMatch = minMarks === '' || studentMark >= parseFloat(minMarks);
      const maxMatch = maxMarks === '' || studentMark <= parseFloat(maxMarks);
      
      return nameMatch && minMatch && maxMatch;
    });
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, minMarks, maxMarks, activeAssessment, studentMarks]);

  // Handle mark change
  const handleMarkChange = (studentId, value) => {
    if (!activeAssessment) return;
    
    setStudentMarks(prevMarks => {
      const updatedMarks = { ...prevMarks };
      
      if (!updatedMarks[studentId]) {
        updatedMarks[studentId] = {};
      }
      
      // Convert to number and validate
      const numValue = value === '' ? '' : Number(value);
      
      // Validate against max marks
      if (numValue !== '' && (isNaN(numValue) || numValue < 0 || numValue > activeAssessment.maxMarks)) {
        toast.error(`Mark must be between 0 and ${activeAssessment.maxMarks}`);
        return prevMarks;
      }
      
      updatedMarks[studentId][activeAssessment._id] = numValue;
      return updatedMarks;
    });
  };

  // Save marks
  const saveMarks = async () => {
    if (!activeAssessment || !activeSection) {
      toast.error('Please select an assessment and section first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const teacherId = getTeacherId();
      if (!teacherId) {
        toast.error('Teacher ID not found. Please log in again.');
        return;
      }

      // Prepare grades data
      const grades = [];
      
      // Only include marks that have actual values (not empty strings or undefined)
      Object.entries(studentMarks).forEach(([studentId, assessments]) => {
        const mark = assessments[activeAssessment._id];
        if (mark !== undefined && mark !== '' && !isNaN(Number(mark))) {
          // Find the student's registration ID
          const student = students.find(s => s.id === studentId);
          if (student && student.registrationId) {
            grades.push({
              registrationId: student.registrationId,
              obtainedMarks: Number(mark),
              feedback: ''
            });
          }
        }
      });

      // Validate that we have grades to save
      if (grades.length === 0) {
        toast.error('No valid marks to save');
        return;
      }

      // Use PUT method to update existing grades or create new ones
      const response = await axios.put(`${apiUrl}/api/teacher-marks/section/${activeSection._id}/assessment/${activeAssessment._id}/grades`, {
        grades: grades
      }, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data) {
        toast.success('Marks saved successfully');
        
        // Clear localStorage after successful save
        const storageKey = `marks_${activeSection.name}_${activeAssessment._id}`;
        localStorage.removeItem(storageKey);

        // Refresh the marks display
        fetchAssessmentMarks(activeAssessment._id);
      }
    } catch (error) {
      console.error('Error saving marks:', error.response?.data || error.message);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Add new assessment
  const addAssessment = async () => {
    if (!activeSection) {
      toast.error('Please select a section first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const teacherId = getTeacherId();
      if (!teacherId) {
        toast.error('Teacher ID not found. Please log in again.');
        return;
      }

      // Validate required fields
      if (!newAssessment.title || !newAssessment.maxMarks || !newAssessment.weightage) {
        toast.error('Please fill in all required fields');
        return;
      }

      const assessmentData = {
        title: newAssessment.title,
        type: newAssessment.type,
        maxMarks: Number(newAssessment.maxMarks),
        weightage: Number(newAssessment.weightage),
        description: newAssessment.description || `${newAssessment.type} Assessment`,
        sectionId: activeSection._id,
        courseId: activeSection.courseId,
        createdBy: teacherId
      };

      const response = await axios.post(`${apiUrl}/api/assessments`, assessmentData, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data) {
        setAssessments(prevAssessments => [...prevAssessments, response.data]);
        setActiveAssessment(response.data);
        setShowAddAssessmentModal(false);
        setNewAssessment({
          title: '',
          type: 'quiz',
          maxMarks: 100,
          weightage: 10,
          description: ''
        });
        toast.success('Assessment added successfully');
      }
    } catch (error) {
      console.error('Error creating assessment:', error.response?.data || error.message);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete assessment
  const deleteAssessment = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`${apiUrl}/api/assessments/${assessmentId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      
      setAssessments(prevAssessments => prevAssessments.filter(a => a._id !== assessmentId));
      
      if (activeAssessment && activeAssessment._id === assessmentId) {
        setActiveAssessment(null);
      }
      
      toast.success('Assessment deleted successfully');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file import
  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    
    setImportFile(file);
    
    // Preview the file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Read the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        setImportPreview(jsonData);
        setShowImportModal(true);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Error reading file. Please check the format.');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Process imported data
  const processImportData = () => {
    if (!importPreview || !activeAssessment) return;
    
    try {
      // Update student marks with imported data
      setStudentMarks(prevMarks => {
        const updatedMarks = { ...prevMarks };
        
        importPreview.forEach(row => {
          const rollNumber = row['Roll Number'];
          const mark = row['Obtained Marks'];
          
          // Find student by roll number
          const student = students.find(s => s.rollNumber === rollNumber);
          
          if (student && mark !== undefined) {
            if (!updatedMarks[student.id]) {
              updatedMarks[student.id] = {};
            }
            
            // Convert to number and validate
            const numValue = mark === '' ? '' : Number(mark);
            
            // Validate against max marks
            if (numValue !== '' && (isNaN(numValue) || numValue < 0 || numValue > activeAssessment.maxMarks)) {
              toast.error(`Invalid mark for student ${student.name} (${rollNumber}): ${mark}`);
              return prevMarks;
            }
            
            updatedMarks[student.id][activeAssessment._id] = numValue;
          } else {
            toast.error(`Student with Roll Number ${rollNumber} not found`);
          }
        });
        
        return updatedMarks;
      });
      
      // Save marks to localStorage for persistence
      const storageKey = `marks_${activeSection.name}_${activeAssessment._id}`;
      localStorage.setItem(storageKey, JSON.stringify(studentMarks));
      
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview(null);
      toast.success('Data imported successfully');
    } catch (error) {
      console.error('Error processing import data:', error);
      toast.error('Error processing import data');
    }
  };

  const fetchAssessmentMarksMap = async (assessmentId) => {
    const response = await axios.get(`${apiUrl}/api/teacher-marks/assessment/${assessmentId}/marks`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    return response.data?.marks || {};
  };

  const loadGradebookMarks = async (assessmentList = assessments) => {
    if (!students.length || !assessmentList.length) return;

    try {
      const assessmentMarkMaps = await Promise.all(
        assessmentList.map(async (assessment) => ({
          assessmentId: assessment._id,
          marks: await fetchAssessmentMarksMap(assessment._id),
        }))
      );

      setStudentMarks((prevMarks) => {
        const updatedMarks = { ...prevMarks };

        students.forEach((student) => {
          if (!updatedMarks[student.id]) {
            updatedMarks[student.id] = {};
          }
        });

        assessmentMarkMaps.forEach(({ assessmentId, marks }) => {
          Object.entries(marks).forEach(([studentId, mark]) => {
            if (!updatedMarks[studentId]) {
              updatedMarks[studentId] = {};
            }
            updatedMarks[studentId][assessmentId] = mark;
          });
        });

        return updatedMarks;
      });
    } catch (error) {
      console.error('Error loading gradebook workspace:', error);
      toast.error('Unable to load complete gradebook workspace');
    }
  };

  const calculateWeightedScore = (studentId, assessment) => {
    const mark = studentMarks[studentId]?.[assessment._id];
    const numericMark = mark === '' || mark === undefined || mark === null ? null : Number(mark);
    const maxMarks = Number(assessment.maxMarks) || 0;
    const weightage = Number(assessment.weightage) || 0;

    if (numericMark === null || Number.isNaN(numericMark) || maxMarks <= 0) {
      return null;
    }

    return (numericMark / maxMarks) * weightage;
  };

  const getEstimatedGrade = (percentage) => {
    if (percentage === null || percentage === undefined || Number.isNaN(percentage)) return 'N/A';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 71) return 'B';
    if (percentage >= 68) return 'B-';
    if (percentage >= 64) return 'C+';
    if (percentage >= 61) return 'C';
    if (percentage >= 58) return 'C-';
    if (percentage >= 54) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const getPerformanceClass = (percentage) => {
    if (percentage === null || percentage === undefined || Number.isNaN(percentage)) return 'missing';
    if (percentage >= 80) return 'strong';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'watch';
    return 'risk';
  };

  const coveredWeightage = useMemo(
    () => assessments.reduce((sum, assessment) => sum + (Number(assessment.weightage) || 0), 0),
    [assessments]
  );

  const gradebookRows = useMemo(() => {
    const visibleStudents = sortStudentsAscending(students).filter((student) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return (
        (student.name || '').toLowerCase().includes(query) ||
        (student.rollNumber || '').toLowerCase().includes(query)
      );
    });

    return visibleStudents.map((student) => {
      const weightedTotal = assessments.reduce((sum, assessment) => {
        const weightedScore = calculateWeightedScore(student.id, assessment);
        return sum + (weightedScore || 0);
      }, 0);
      const percentage = coveredWeightage > 0 ? (weightedTotal / coveredWeightage) * 100 : null;

      return {
        ...student,
        weightedTotal,
        percentage,
        estimatedGrade: getEstimatedGrade(percentage),
        performanceClass: getPerformanceClass(percentage),
      };
    });
  }, [students, assessments, studentMarks, searchTerm, coveredWeightage]);

  const gradebookSummary = useMemo(() => {
    const rowsWithScores = gradebookRows.filter((row) => row.percentage !== null);
    const classAverage = rowsWithScores.length
      ? rowsWithScores.reduce((sum, row) => sum + row.percentage, 0) / rowsWithScores.length
      : 0;
    const missingMarks = students.reduce((count, student) => {
      const missingForStudent = assessments.filter((assessment) => {
        const mark = studentMarks[student.id]?.[assessment._id];
        return mark === undefined || mark === null || mark === '';
      }).length;
      return count + missingForStudent;
    }, 0);

    return {
      classAverage,
      missingMarks,
      studentCount: students.length,
      assessmentCount: assessments.length,
    };
  }, [gradebookRows, students, assessments, studentMarks]);

  const handleWorkspaceMarkChange = (studentId, assessment, value) => {
    const numValue = value === '' ? '' : Number(value);

    if (numValue !== '' && (Number.isNaN(numValue) || numValue < 0 || numValue > Number(assessment.maxMarks))) {
      toast.error(`Mark must be between 0 and ${assessment.maxMarks}`);
      return;
    }

    setStudentMarks((prevMarks) => ({
      ...prevMarks,
      [studentId]: {
        ...(prevMarks[studentId] || {}),
        [assessment._id]: numValue,
      },
    }));
  };

  const handleGradebookCellKeyDown = (event) => {
    const navigationKeys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter'];
    if (!navigationKeys.includes(event.key)) return;

    const currentInput = event.currentTarget;
    const rowIndex = Number(currentInput.dataset.rowIndex);
    const colIndex = Number(currentInput.dataset.colIndex);
    let nextRow = rowIndex;
    let nextCol = colIndex;

    if (event.key === 'ArrowRight') nextCol += 1;
    if (event.key === 'ArrowLeft') nextCol -= 1;
    if (event.key === 'ArrowDown' || event.key === 'Enter') nextRow += 1;
    if (event.key === 'ArrowUp') nextRow -= 1;

    const nextInput = document.querySelector(
      `[data-gradebook-cell="true"][data-row-index="${nextRow}"][data-col-index="${nextCol}"]`
    );

    if (nextInput) {
      event.preventDefault();
      nextInput.focus();
      nextInput.select();
    }
  };

  const exportGradebookWorkspace = () => {
    if (!activeSection || !assessments.length || !students.length) {
      toast.error('No gradebook workspace available to export');
      return;
    }

    const exportRows = gradebookRows.map((student) => {
      const row = {
        'Roll No': student.rollNumber || '',
        'Student Name': student.name || '',
      };

      assessments.forEach((assessment) => {
        const mark = studentMarks[student.id]?.[assessment._id] ?? '';
        const weightedScore = calculateWeightedScore(student.id, assessment);
        row[`${assessment.title} Marks (Total Marks: ${assessment.maxMarks})`] = mark;
        row[`${assessment.title} Weighted (Weightage: ${assessment.weightage}%)`] =
          weightedScore === null ? '' : Number(weightedScore.toFixed(2));
      });

      row[`Total (Weightage: ${coveredWeightage})`] = Number(student.weightedTotal.toFixed(2));
      row['Estimated Grade'] = student.estimatedGrade;
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      ...assessments.flatMap(() => [{ wch: 22 }, { wch: 24 }]),
      { wch: 18 },
      { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gradebook Workspace');
    XLSX.writeFile(workbook, `${getSectionFileLabel(activeSection)}_gradebook_workspace.xlsx`);
    toast.success('Gradebook workspace exported successfully');
  };

  const saveGradebookWorkspace = async () => {
    if (!activeSection || !assessments.length) {
      toast.error('Please select a section with assessments first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const saveRequests = assessments.map((assessment) => {
        const grades = students
          .map((student) => {
            const mark = studentMarks[student.id]?.[assessment._id];
            if (mark === undefined || mark === '' || Number.isNaN(Number(mark)) || !student.registrationId) {
              return null;
            }

            return {
              registrationId: student.registrationId,
              obtainedMarks: Number(mark),
              feedback: '',
            };
          })
          .filter(Boolean);

        if (!grades.length) return null;

        return axios.put(`${apiUrl}/api/teacher-marks/section/${activeSection._id}/assessment/${assessment._id}/grades`, {
          grades,
        }, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
      }).filter(Boolean);

      if (!saveRequests.length) {
        toast.error('No valid marks to save');
        return;
      }

      await Promise.all(saveRequests);
      toast.success('Gradebook workspace saved successfully');
      await loadGradebookMarks();
    } catch (error) {
      console.error('Error saving gradebook workspace:', error.response?.data || error.message);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSectionData = async () => {
    if (!activeSection) return null;

    const sectionId = activeSection._id || activeSection.id;
    const response = await axios.get(`${apiUrl}/api/teachers/attendance?sectionId=${sectionId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });

    const attendanceArray = response.data?.attendance;
    if (!Array.isArray(attendanceArray)) {
      return null;
    }

    return attendanceArray.find((item) => item.sectionId === sectionId || item.sectionId?.toString() === sectionId.toString()) || null;
  };

  const buildAssessmentRows = (assessment, marksMap) => {
    const sortedStudents = sortStudentsAscending(students);

    return sortedStudents.map((student) => ({
      'Roll Number': student.rollNumber,
      'Student Name': student.name,
      'Assessment': assessment.title,
      'Type': assessment.type,
      'Max Marks': assessment.maxMarks,
      'Obtained Marks': marksMap?.[student.id] ?? '',
      'Weightage (%)': assessment.weightage,
      'Obtained Weightage (%)':
        marksMap?.[student.id] !== '' &&
        marksMap?.[student.id] !== undefined &&
        marksMap?.[student.id] !== null &&
        Number(assessment.maxMarks) > 0
          ? Number((((Number(marksMap[student.id]) / Number(assessment.maxMarks)) * Number(assessment.weightage || 0))).toFixed(2))
          : ''
    }));
  };

  const buildAssessmentRegisterSheet = async () => {
    const sortedStudents = sortStudentsAscending(students);
    const assessmentMarkMaps = {};

    for (const assessment of assessments) {
      assessmentMarkMaps[assessment._id] = await fetchAssessmentMarksMap(assessment._id);
    }

    const totalWeightage = assessments.reduce((sum, assessment) => sum + (Number(assessment.weightage) || 0), 0);
    const totalMaxMarks = assessments.reduce((sum, assessment) => sum + (Number(assessment.maxMarks) || 0), 0);

    const registerRows = sortedStudents.map((student) => {
      const row = {
        'Roll Number': student.rollNumber,
        'Student Name': student.name,
      };

      let grandTotal = 0;
      let grandMaxTotal = 0;
      let weightedTotal = 0;

      assessments.forEach((assessment) => {
        const rawMark = assessmentMarkMaps[assessment._id]?.[student.id];
        const numericMark = rawMark === '' || rawMark === undefined || rawMark === null ? null : Number(rawMark);

        row[formatAssessmentColumnLabel(assessment)] = numericMark ?? '';

        if (numericMark !== null && !Number.isNaN(numericMark)) {
          grandTotal += numericMark;
          grandMaxTotal += Number(assessment.maxMarks) || 0;

          if (Number(assessment.maxMarks) > 0) {
            weightedTotal += (numericMark / Number(assessment.maxMarks)) * (Number(assessment.weightage) || 0);
          }
        }
      });

      row[`Total Obtained Marks (${totalMaxMarks})`] = grandTotal;
      row['Total Weightage'] = totalWeightage;
      row['Grand Obtained Weightage'] = totalWeightage > 0 ? Number(weightedTotal.toFixed(2)) : 0;

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(registerRows);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 28 },
      ...assessments.map(() => ({ wch: 18 })),
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
    ];

    return worksheet;
  };

  const appendAttendanceSheet = (workbook, sectionAttendanceData) => {
    if (!sectionAttendanceData?.dates) return;

    const allDateSlots = [];
    Object.keys(sectionAttendanceData.dates)
      .sort()
      .forEach((dateKey) => {
        const dateEntry = sectionAttendanceData.dates[dateKey];
        if (dateEntry?.slots && Array.isArray(dateEntry.slots)) {
          dateEntry.slots
            .slice()
            .sort((a, b) => a.slotNumber - b.slotNumber)
            .forEach((slot) => {
              allDateSlots.push({
                key: `${dateKey}__slot-${slot.slotNumber}`,
                label: `${dateKey} (S${slot.slotNumber})`,
                students: slot.students || [],
              });
            });
        } else if (dateEntry?.students) {
          allDateSlots.push({
            key: `${dateKey}__slot-1`,
            label: `${dateKey} (S1)`,
            students: dateEntry.students || [],
          });
        }
      });

    const attendanceRows = [
      ['Roll Number', 'Student Name', ...allDateSlots.map((entry) => entry.label)],
      ...sortStudentsAscending(students).map((student) => {
        const studentId = student.id?.toString() || student.id;
        return [
          student.rollNumber || '',
          student.name || '',
          ...allDateSlots.map((dateSlot) => {
            const record = (dateSlot.students || []).find((entry) => {
              const recordStudentId = entry.studentId?.toString() || entry.studentId;
              return recordStudentId === studentId;
            });

            if (record?.status === 'present') return 'P';
            if (record?.status === 'absent') return 'A';
            if (record?.status === 'late') return 'L';
            if (record?.status === 'leave') return 'LV';
            return '';
          }),
        ];
      }),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(attendanceRows);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 28 },
      ...allDateSlots.map(() => ({ wch: 14 })),
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  };

  // Export active assessment to Excel
  const exportMarks = async () => {
    if (!activeAssessment || !students.length) return;

    try {
      const marksMap = await fetchAssessmentMarksMap(activeAssessment._id);
      const exportData = buildAssessmentRows(activeAssessment, marksMap);
      
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, getSafeSheetName(activeAssessment.title, 'Marks'));
      
      const filename = `${getSectionFileLabel(activeSection)}_${activeAssessment.title.replace(/\s+/g, '_')}_marks.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      toast.success('Marks exported successfully');
    } catch (error) {
      console.error('Error exporting marks:', error);
      toast.error('Error exporting marks');
    }
  };

  const exportAllAssessments = async () => {
    if (!activeSection || !assessments.length || !students.length) {
      toast.error('No assessments available to export');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      const assessmentRegisterSheet = await buildAssessmentRegisterSheet();
      XLSX.utils.book_append_sheet(workbook, assessmentRegisterSheet, 'Assessment Register');

      const summaryRows = assessments.map((assessment) => ({
        'Assessment Title': assessment.title,
        Type: assessment.type,
        'Max Marks': assessment.maxMarks,
        'Weightage (%)': assessment.weightage,
        Description: assessment.description || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Assessments');

      for (const assessment of assessments) {
        const marksMap = await fetchAssessmentMarksMap(assessment._id);
        const worksheet = XLSX.utils.json_to_sheet(buildAssessmentRows(assessment, marksMap));
        XLSX.utils.book_append_sheet(workbook, worksheet, getSafeSheetName(assessment.title, `Assessment-${assessment.type}`));
      }

      XLSX.writeFile(workbook, `${getSectionFileLabel(activeSection)}_all_assessments.xlsx`);
      toast.success('All assessments exported successfully');
    } catch (error) {
      console.error('Error exporting all assessments:', error);
      toast.error('Error exporting all assessments');
    }
  };

  const exportAllSectionData = async () => {
    if (!activeSection || !students.length) {
      toast.error('No section data available to export');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      const overviewRows = sortStudentsAscending(students).map((student) => ({
        'Roll Number': student.rollNumber,
        'Student Name': student.name,
        Section: activeSection.section,
        Course: activeSection.courseId?.name || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(overviewRows), 'Students');

      if (assessments.length > 0) {
        const assessmentRegisterSheet = await buildAssessmentRegisterSheet();
        XLSX.utils.book_append_sheet(workbook, assessmentRegisterSheet, 'Assessment Register');

        const assessmentSummaryRows = assessments.map((assessment) => ({
          'Assessment Title': assessment.title,
          Type: assessment.type,
          'Max Marks': assessment.maxMarks,
          'Weightage (%)': assessment.weightage,
          Description: assessment.description || '',
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(assessmentSummaryRows), 'Assessment Summary');

        for (const assessment of assessments) {
          const marksMap = await fetchAssessmentMarksMap(assessment._id);
          const worksheet = XLSX.utils.json_to_sheet(buildAssessmentRows(assessment, marksMap));
          XLSX.utils.book_append_sheet(workbook, worksheet, getSafeSheetName(assessment.title, `Assessment-${assessment.type}`));
        }
      }

      const sectionAttendanceData = await fetchAttendanceSectionData();
      appendAttendanceSheet(workbook, sectionAttendanceData);

      XLSX.writeFile(workbook, `${getSectionFileLabel(activeSection)}_full_section_data.xlsx`);
      toast.success('Full section data exported successfully');
    } catch (error) {
      console.error('Error exporting full section data:', error);
      toast.error('Error exporting full section data');
    }
  };

  // Download template
  const downloadTemplate = () => {
    try {
      // Create template data
      const templateData = students.map(student => ({
        'Roll Number': student.rollNumber,
        'Student Name': student.name,
        'Assessment': activeAssessment ? activeAssessment.title : 'Assessment Title',
        'Max Marks': activeAssessment ? activeAssessment.maxMarks : 100,
        'Obtained Marks': ''
      }));
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
      
      // Save file
      XLSX.writeFile(workbook, 'marks_template.xlsx');
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Error downloading template');
    }
  };

  // Update assessment
  const updateAssessment = async () => {
    if (!editingAssessment) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${apiUrl}/api/assessments/${editingAssessment._id}`, {
        title: editingAssessment.title,
        maxMarks: Number(editingAssessment.maxMarks),
        weightage: Number(editingAssessment.weightage),
        description: editingAssessment.description
      }, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.data) {
        setAssessments(prevAssessments => 
          prevAssessments.map(a => 
            a._id === editingAssessment._id ? response.data : a
          )
        );
        
        if (activeAssessment?._id === editingAssessment._id) {
          setActiveAssessment(response.data);
        }
        
        setShowEditAssessmentModal(false);
        setEditingAssessment(null);
        toast.success('Assessment updated successfully');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit assessment
  const handleEditAssessment = (assessment) => {
    setEditingAssessment({...assessment});
    setShowEditAssessmentModal(true);
  };

  // Initialize component
  useEffect(() => {
    fetchTeacherSections();
  }, []);

  // Fetch assessments when section changes
  useEffect(() => {
    if (activeSection) {
      fetchAssessments(activeSection._id);
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeMarksView === 'workspace' && students.length && assessments.length) {
      loadGradebookMarks();
    }
  }, [activeMarksView, students.length, assessments.length, activeSection?._id]);

  return (
    <div className="marks2-container">
      <div className="marks2-header">
        <div>
          <h1>Marks</h1>
          <p className="marks2-subtitle">Enter assessment marks or manage the full gradebook workspace.</p>
        </div>
        <div className="marks2-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddAssessmentModal(true)}
            disabled={!activeSection}
          >
            <Plus size={16} /> Add Assessment
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={exportMarks}
            disabled={!activeAssessment || !students.length}
          >
            <Download size={16} /> Export Assessment
          </button>
          <button
            className="btn btn-secondary"
            onClick={exportAllAssessments}
            disabled={!activeSection || !assessments.length || !students.length}
          >
            <Download size={16} /> Export All Assessments
          </button>
          <button
            className="btn btn-secondary"
            onClick={exportAllSectionData}
            disabled={!activeSection || !students.length}
          >
            <FileSpreadsheet size={16} /> Export Full Data
          </button>
          <label className="btn btn-secondary">
            <Upload size={16} /> Import
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileImport} 
              style={{ display: 'none' }} 
            />
          </label>
          <button 
            className="btn btn-secondary" 
            onClick={downloadTemplate}
            disabled={!activeAssessment}
          >
            <FileSpreadsheet size={16} /> Template
          </button>
        </div>
      </div>

      <div className="marks-view-tabs" role="tablist" aria-label="Marks views">
        <button
          type="button"
          className={`marks-view-tab ${activeMarksView === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveMarksView('entry')}
        >
          <ClipboardList size={16} />
          Assessment Entry
        </button>
        <button
          type="button"
          className={`marks-view-tab ${activeMarksView === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveMarksView('workspace')}
        >
          <Table2 size={16} />
          Gradebook Workspace
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="marks2-content">
        <div className="marks2-sidebar">
          <div className="section-selector">
            <h3>Sections</h3>
            <div className="section-list">
              {sections.map(section => (
                <div 
                  key={section._id}
                  className={`section-item ${activeSection?._id === section._id ? 'active' : ''}`}
                  onClick={() => handleSectionChange(section)}
                >
                  {section.courseId.name} - Section {section.section}
                </div>
              ))}
            </div>
          </div>

          <div className="assessment-selector">
            <h3>Assessments</h3>
            <div className="assessment-list">
              {assessments.map(assessment => (
                <div 
                  key={assessment._id}
                  className={`assessment-item ${activeAssessment?._id === assessment._id ? 'active' : ''}`}
                  onClick={() => handleAssessmentChange(assessment)}
                >
                  <div className="assessment-title">{assessment.title}</div>
                  <div className="assessment-actions">
                    <button 
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditAssessment(assessment);
                      }}
                      data-tooltip="Edit Assessment"
                    >
                      <Edit2 size={14} data-icon="edit" />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAssessment(assessment._id);
                      }}
                      data-tooltip="Delete Assessment"
                    >
                      <Trash2 size={14} data-icon="trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="marks2-main">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : !activeSection ? (
            <div className="empty-state">
              <p>Select a section to view and manage marks</p>
            </div>
          ) : activeMarksView === 'workspace' ? (
            <>
              <div className="workspace-header">
                <div>
                  <p className="workspace-eyebrow">Gradebook Workspace</p>
                  <h2>{activeSection.courseId?.name || 'Selected Course'} - Section {activeSection.section || activeSection.name || '-'}</h2>
                  <p>Use this sheet to enter marks across assessments and review weighted totals instantly.</p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={exportGradebookWorkspace}
                  disabled={!assessments.length || !students.length}
                >
                  <Download size={16} /> Export Workspace
                </button>
                <button
                  className="btn btn-primary save-btn"
                  onClick={saveGradebookWorkspace}
                  disabled={!assessments.length || !students.length}
                >
                  <Save size={16} /> Save Workspace
                </button>
              </div>

              <div className="workspace-summary-grid">
                <div className="workspace-summary-card">
                  <span>Class Average</span>
                  <strong>{gradebookSummary.classAverage.toFixed(1)}%</strong>
                </div>
                <div className="workspace-summary-card">
                  <span>Weightage Covered</span>
                  <strong className={coveredWeightage > 100 ? 'summary-warning' : ''}>{coveredWeightage} / 100</strong>
                </div>
                <div className="workspace-summary-card">
                  <span>Students</span>
                  <strong>{gradebookSummary.studentCount}</strong>
                </div>
                <div className="workspace-summary-card">
                  <span>Missing Marks</span>
                  <strong className={gradebookSummary.missingMarks ? 'summary-warning' : ''}>{gradebookSummary.missingMarks}</strong>
                </div>
              </div>

              <div className="workspace-toolbar">
                <div className="workspace-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search student or roll number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="workspace-note">
                  Marks cells are editable. Weighted, total, and grade cells recalculate automatically.
                </div>
              </div>

              {!assessments.length ? (
                <div className="empty-state">
                  <p>Create assessments first, then the workspace will show marks and weighted columns.</p>
                </div>
              ) : (
                <div className="gradebook-table-shell">
                  <table className="gradebook-table">
                    <thead>
                      <tr>
                        <th className="sticky-col roll-col" rowSpan="2">Roll No</th>
                        <th className="sticky-col name-col" rowSpan="2">Student Name</th>
                        {assessments.map((assessment) => (
                          <React.Fragment key={assessment._id}>
                            <th>{assessment.title} Marks</th>
                            <th className="weighted-header">{assessment.title} Weighted</th>
                          </React.Fragment>
                        ))}
                        <th className="total-header" rowSpan="2">Total</th>
                        <th className="grade-header" rowSpan="2">Estimated Grade</th>
                      </tr>
                      <tr>
                        {assessments.map((assessment) => (
                          <React.Fragment key={`${assessment._id}-meta`}>
                            <th className="meta-header">Total Marks: {assessment.maxMarks}</th>
                            <th className="meta-header weighted-meta">Weightage: {assessment.weightage}%</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradebookRows.length > 0 ? (
                        gradebookRows.map((student) => (
                          <tr key={student.id}>
                            <td className="sticky-col roll-col">{student.rollNumber || '-'}</td>
                            <td className="sticky-col name-col">{student.name || 'Unnamed Student'}</td>
                            {assessments.map((assessment) => {
                              const mark = studentMarks[student.id]?.[assessment._id] ?? '';
                              const weightedScore = calculateWeightedScore(student.id, assessment);
                              const markPercentage = weightedScore === null || Number(assessment.weightage) <= 0
                                ? null
                                : (weightedScore / Number(assessment.weightage)) * 100;

                              return (
                                <React.Fragment key={`${student.id}-${assessment._id}`}>
                                  <td className="marks-entry-cell">
                                    <input
                                      type="number"
                                      min="0"
                                      max={assessment.maxMarks}
                                      value={mark}
                                      onChange={(e) => handleWorkspaceMarkChange(student.id, assessment, e.target.value)}
                                      onKeyDown={handleGradebookCellKeyDown}
                                      onFocus={(e) => e.target.select()}
                                      data-gradebook-cell="true"
                                      data-row-index={gradebookRows.indexOf(student)}
                                      data-col-index={assessments.indexOf(assessment)}
                                      aria-label={`${student.name || 'Student'} ${assessment.title} marks`}
                                    />
                                  </td>
                                  <td className={`weighted-cell ${getPerformanceClass(markPercentage)}`}>
                                    <strong>{weightedScore === null ? '-' : weightedScore.toFixed(2)}</strong>
                                    <span>/ {Number(assessment.weightage) || 0}</span>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            <td className={`total-cell ${student.performanceClass}`}>
                              <strong>{student.weightedTotal.toFixed(2)}</strong>
                              <span>/ {coveredWeightage || 0}</span>
                            </td>
                            <td className={`grade-cell ${student.performanceClass}`}>
                              {student.estimatedGrade}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={(assessments.length * 2) + 4} className="no-results">
                            No students match your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : !activeAssessment ? (
            <div className="empty-state">
              <p>Select or create an assessment to manage marks</p>
            </div>
          ) : (
            <>
              <div className="assessment-header">
                <h2>{activeAssessment.title}</h2>
                <div className="assessment-details">
                  <span>Type: {activeAssessment.type}</span>
                  <span>Max Marks: {activeAssessment.maxMarks}</span>
                  <span>Weightage: {activeAssessment.weightage}%</span>
                </div>
                <button 
                  className="btn btn-primary save-btn"
                  onClick={saveMarks}
                >
                  <Save size={16} /> Save Marks
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="search-filter-container">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-box">
                  <div className="filter-group">
                    <label>Min Marks:</label>
                    <input
                      type="number"
                      min="0"
                      max={activeAssessment.maxMarks}
                      value={minMarks}
                      onChange={(e) => setMinMarks(e.target.value)}
                      placeholder="Min"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-group">
                    <label>Max Marks:</label>
                    <input
                      type="number"
                      min="0"
                      max={activeAssessment.maxMarks}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      placeholder="Max"
                      className="filter-input"
                    />
                  </div>
                  <button 
                    className="btn btn-secondary clear-filters"
                    onClick={() => {
                      setSearchTerm('');
                      setMinMarks('');
                      setMaxMarks('');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="marks-table-container">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <tr key={student.id}>
                          <td>{student.rollNumber}</td>
                          <td>{student.name}</td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              max={activeAssessment.maxMarks}
                              value={studentMarks[student.id]?.[activeAssessment._id] ?? ''}
                              onChange={(e) => handleMarkChange(student.id, e.target.value)}
                              placeholder="Enter marks"
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="no-results">
                          No students match your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Assessment Modal */}
      {showAddAssessmentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Assessment</h3>
              <button 
                className="btn-icon"
                onClick={() => setShowAddAssessmentModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({...newAssessment, title: e.target.value})}
                  placeholder="Assessment Title"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={newAssessment.type}
                  onChange={(e) => setNewAssessment({...newAssessment, type: e.target.value})}
                >
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="form-group">
                <label>Max Marks</label>
                <input 
                  type="number" 
                  min="1"
                  value={newAssessment.maxMarks}
                  onChange={(e) => setNewAssessment({...newAssessment, maxMarks: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Weightage (%)</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={newAssessment.weightage}
                  onChange={(e) => setNewAssessment({...newAssessment, weightage: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newAssessment.description}
                  onChange={(e) => setNewAssessment({...newAssessment, description: e.target.value})}
                  placeholder="Assessment Description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddAssessmentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={addAssessment}
                disabled={!newAssessment.title || !newAssessment.maxMarks || !newAssessment.weightage}
              >
                Add Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Import Marks</h3>
              <button 
                className="btn-icon"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="import-preview">
                <h4>Preview</h4>
                <p>Review the data before importing. Make sure the student IDs match.</p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {importPreview && importPreview.length > 0 && Object.keys(importPreview[0]).map(key => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview && importPreview.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview && importPreview.length > 5 && (
                    <p className="preview-note">Showing 5 of {importPreview.length} rows</p>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={processImportData}
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assessment Modal */}
      {showEditAssessmentModal && editingAssessment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Assessment</h3>
              <button 
                className="btn-icon"
                onClick={() => {
                  setShowEditAssessmentModal(false);
                  setEditingAssessment(null);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  value={editingAssessment.title}
                  onChange={(e) => setEditingAssessment({
                    ...editingAssessment, 
                    title: e.target.value
                  })}
                  placeholder="Assessment Title"
                />
              </div>
              <div className="form-group">
                <label>Max Marks</label>
                <input 
                  type="number" 
                  min="1"
                  value={editingAssessment.maxMarks}
                  onChange={(e) => setEditingAssessment({
                    ...editingAssessment, 
                    maxMarks: Number(e.target.value)
                  })}
                />
              </div>
              <div className="form-group">
                <label>Weightage (%)</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={editingAssessment.weightage}
                  onChange={(e) => setEditingAssessment({
                    ...editingAssessment, 
                    weightage: Number(e.target.value)
                  })}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={editingAssessment.description}
                  onChange={(e) => setEditingAssessment({
                    ...editingAssessment, 
                    description: e.target.value
                  })}
                  placeholder="Assessment Description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowEditAssessmentModal(false);
                  setEditingAssessment(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={updateAssessment}
                disabled={!editingAssessment.title || !editingAssessment.maxMarks || !editingAssessment.weightage}
              >
                Update Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marks2; 
