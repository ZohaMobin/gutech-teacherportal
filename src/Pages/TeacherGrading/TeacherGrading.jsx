import React, { useState, useEffect } from "react";
import { CSVImportExport } from "./CsvImportExport";
import "./TeacherGrading.css";

const TeacherGrading = () => {
  // Simplified state management
  const [activeTab, setActiveTab] = useState("quizzes");
  const [activeCourse, setActiveCourse] = useState("discrete");
  const [activeSection, setActiveSection] = useState("sectionA");
  const [marksData, setMarksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentModal, setCurrentModal] = useState({
    type: null, // "add", "edit", "view", null
    data: null
  });

  // Fetch data on component mount
  useEffect(() => {
    // Simulate API call - replace with your actual API
    const fetchData = async () => {
      try {
        // Replace with your API call
        setTimeout(() => {
          setMarksData(sampleData);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handler for editing an item
  const handleEdit = (item) => {
    setCurrentModal({
      type: "edit",
      data: { ...item }
    });
  };

  // Handler for toggling publish status
  const handlePublishToggle = (id) => {
    setMarksData(prevData => {
      return {
        ...prevData,
        [activeTab]: {
          ...prevData[activeTab],
          [activeCourse]: {
            ...prevData[activeTab][activeCourse],
            [activeSection]: prevData[activeTab][activeCourse][activeSection].map(item =>
              item.id === id ? { ...item, published: !item.published } : item
            )
          }
        }
      };
    });
  };
  

  // Handler for deleting an item
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this assessment? This action cannot be undone.")) {
      setMarksData(prevData => {
        const newData = { ...prevData };
        newData[activeTab][activeCourse][activeSection] = 
          newData[activeTab][activeCourse][activeSection].filter(item => item.id !== id);
        return newData;
      });
    }
  };

  // Handler for viewing student marks
  const handleViewMarks = (item) => {
    setCurrentModal({
      type: "view",
      data: { ...item }
    });
  };

  // Handler for saving form data (both new and edit)
  const handleSaveForm = (formData) => {
    if (currentModal.type === "add") {
      // Add new assessment
      const newItem = {
        id: Date.now(),
        ...formData,
        uploadDate: new Date().toISOString().split('T')[0],
      };

      setMarksData(prevData => {
        const newData = { ...prevData };
        newData[activeTab][activeCourse][activeSection] = [
          ...newData[activeTab][activeCourse][activeSection], 
          newItem
        ];
        return newData;
      });
    } else if (currentModal.type === "edit") {
      // Update existing assessment
      setMarksData(prevData => {
        const newData = { ...prevData };
        const itemIndex = newData[activeTab][activeCourse][activeSection]
          .findIndex(item => item.id === formData.id);

        if (itemIndex !== -1) {
          newData[activeTab][activeCourse][activeSection][itemIndex] = formData;
        }

        return newData;
      });
    }
    
    setCurrentModal({ type: null, data: null });
  };

  // Handle CSV import
  const handleImportCSV = (parsedData) => {
    // Integrate imported data with current data
    if (parsedData && parsedData.length > 0) {
      // Create a new assessment from CSV data
      const newAssessment = {
        id: Date.now(),
        serial: parsedData[0].serial || 1,
        weightage: parsedData[0].weightage || 0,
        totalMarks: parsedData[0].totalMarks || 0,
        uploadDate: new Date().toISOString().split('T')[0],
        published: false,
        studentMarks: parsedData.map((row, index) => ({
          id: index + 1,
          name: row.studentName || `Student ${index + 1}`,
          marks: parseFloat(row.marks) || 0
        }))
      };

      // Calculate statistics
      const validMarks = newAssessment.studentMarks.map(s => s.marks).filter(m => !isNaN(m));
      newAssessment.average = +(validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length).toFixed(2);
      newAssessment.min = Math.min(...validMarks);
      newAssessment.max = Math.max(...validMarks);
      
      // Calculate standard deviation
      const mean = newAssessment.average;
      const sumSquareDiffs = validMarks.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0);
      newAssessment.stdDev = +Math.sqrt(sumSquareDiffs / validMarks.length).toFixed(2);

      // Update data
      setMarksData(prevData => {
        const newData = { ...prevData };
        newData[activeTab][activeCourse][activeSection] = [
          ...newData[activeTab][activeCourse][activeSection],
          newAssessment
        ];
        return newData;
      });
      
      alert("CSV data imported successfully!");
    }
  };

  // Get data for CSV export
  const getExportData = () => {
    const currentData = marksData?.[activeTab]?.[activeCourse]?.[activeSection] || [];
    if (currentData.length === 0) return [];
    
    // Flatten student marks for export
    let exportData = [];
    currentData.forEach(assessment => {
      assessment.studentMarks.forEach(student => {
        exportData.push({
          assessmentSerial: assessment.serial,
          assessmentType: activeTab.slice(0, -1),
          weightage: assessment.weightage,
          totalMarks: assessment.totalMarks,
          studentId: student.id,
          studentName: student.name,
          marks: student.marks
        });
      });
    });
    
    return exportData;
  };

  if (loading) {
    return <div className="loading-container">Loading teacher portal...</div>;
  }

  const activeCategoryData = marksData?.[activeTab]?.[activeCourse]?.[activeSection] || [];

  return (
    <div className="teacher-marks-container">
      {/* Header with quick actions */}
      <div className="page-header">
        <h1>Teacher Marks Management</h1>
        <div className="teacher-actions">
          <CSVImportExport 
            onImport={handleImportCSV} 
            exportData={getExportData()}
            filename={`${activeCourse}-${activeSection}-${activeTab}`}
          />
          <button
            className="add-marks-btn"
            onClick={() => setCurrentModal({
              type: "add",
              data: {
                serial: '',
                weightage: '',
                totalMarks: '',
                published: false,
                studentMarks: Array.from({ length: 10 }, (_, i) => ({ 
                  id: i + 1, 
                  name: `Student ${i + 1}`, 
                  marks: "" 
                }))
              }
            })}
          >
            + Add {activeTab.slice(0, -1).replace(/^\w/, c => c.toUpperCase())}
          </button>
        </div>
      </div>

      {/* Navigator tabs - simplified with flex layout */}
      <div className="tabs-container">
        <div className="course-tabs">
          {marksData.courses.map(course => (
            <button
              key={course.id}
              className={`course-tab ${activeCourse === course.id ? 'active' : ''}`}
              onClick={() => setActiveCourse(course.id)}
            >
              {course.name}
            </button>
          ))}
        </div>

        <div className="section-tabs">
          {marksData.courses.find(course => course.id === activeCourse)?.sections.map(section => (
            <button
              key={section}
              className={`section-tab ${activeSection === section ? 'active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </div>

        <div className="assessment-tabs">
          {["quizzes", "assignments", "midterms", "finals"].map(tab => (
            <button
              key={tab}
              className={`assessment-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Marks Table - Simplified with responsive design */}
      <div className="marks-table-container">
        <table className="marks-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Weightage</th>
              <th>Total</th>
              <th>Avg</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeCategoryData.length > 0 ? (
              activeCategoryData.map((item) => (
                <tr key={item.id}>
                  <td>{item.serial}</td>
                  <td>{item.weightage}</td>
                  <td>{item.totalMarks}</td>
                  <td>{item.average?.toFixed(1) || "-"}</td>
                  <td>
                    <span className={`status-badge ${item.published ? 'published' : 'draft'}`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                      <button
                        className={`publish-btn ${item.published ? 'unpublish' : 'publish'}`}
                        onClick={() => handlePublishToggle(item.id)}
                      >
                        {item.published ? 'unpublish' : 'publish'}
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(item.id)}>×</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data">No assessments added yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Unified Modal Component for all forms */}
      {currentModal.type && (
        <AssessmentModal
          type={currentModal.type}
          assessment={currentModal.data}
          onClose={() => setCurrentModal({ type: null, data: null })}
          onSave={handleSaveForm}
          assessmentType={activeTab.slice(0, -1)}
        />
      )}
    </div>
  );
};

// Modal Component for Assessment management
const AssessmentModal = ({ type, assessment, onClose, onSave, assessmentType }) => {
  const [formData, setFormData] = useState(assessment);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStudentMarksChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      studentMarks: prev.studentMarks.map(student =>
        student.id === id ? { ...student, marks: value } : student
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate statistics if this is a new or edited assessment
    if (type === "add" || type === "edit") {
      const validMarks = formData.studentMarks
        .map(s => parseFloat(s.marks))
        .filter(m => !isNaN(m));
      
      if (validMarks.length) {
        const average = validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length;
        const min = Math.min(...validMarks);
        const max = Math.max(...validMarks);
        
        // Calculate standard deviation
        const mean = average;
        const sumSquareDiffs = validMarks.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0);
        const stdDev = Math.sqrt(sumSquareDiffs / validMarks.length);
        
        const updatedFormData = {
          ...formData,
          average: parseFloat(average.toFixed(2)),
          stdDev: parseFloat(stdDev.toFixed(2)),
          min: parseFloat(min.toFixed(2)),
          max: parseFloat(max.toFixed(2)),
        };
        
        onSave(updatedFormData);
      } else {
        onSave(formData);
      }
    } else {
      onSave(formData);
    }
  };

  const modalTitle = {
    add: `Add New ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}`,
    edit: `Edit ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} #${formData?.serial}`,
    view: `Student Marks for ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} #${formData?.serial}`
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{modalTitle[type]}</h2>
          <button className="close-modal" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Assessment Details - Only show in Add/Edit modes */}
          {(type === "add" || type === "edit") && (
            <div className="assessment-details">
              <div className="form-row">
                <div className="form-group">
                  <label>Serial #:</label>
                  <input
                    type="number"
                    name="serial"
                    value={formData.serial}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Weightage:</label>
                  <input
                    type="number"
                    name="weightage"
                    value={formData.weightage}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Marks:</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Student Marks Table - Always show */}
          <div className="student-marks-section">
            <h3>Student Marks</h3>
            <table className="student-marks-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {formData.studentMarks.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>
                      <input
                        type="number"
                        value={student.marks}
                        onChange={(e) => handleStudentMarksChange(student.id, e.target.value)}
                        min="0"
                        max={formData.totalMarks}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn">
              {type === "add" ? "Create" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherGrading;

// Sample data structure - kept very minimal for demonstration
const sampleData = {
  courses: [
    { id: "discrete", name: "Discrete Mathematics", sections: ["sectionA", "sectionB"] },
    { id: "pspf", name: "Programming Fundamentals", sections: ["sectionA"] },
    { id: "calculus", name: "Calculus", sections: ["sectionA", "sectionB", "sectionC"] }
  ],
  quizzes: {
    discrete: {
      sectionA: [
        { 
          id: 1, 
          serial: 1, 
          weightage: 15, 
          totalMarks: 15, 
          average: 12.9, 
          stdDev: 1.1, 
          min: 8, 
          max: 14.5, 
          uploadDate: "2025-02-15", 
          published: true, 
          studentMarks: Array.from({ length: 10 }, (_, i) => ({ 
            id: i + 1, 
            name: `Student ${i + 1}`, 
            marks: Math.floor(Math.random() * 15) 
          }))
        },
      ],
      sectionB: []
    },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] }
  },
  assignments: {
    discrete: { sectionA: [], sectionB: [] },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] }
  },
  midterms: {
    discrete: { sectionA: [], sectionB: [] },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] }
  },
  finals: {
    discrete: { sectionA: [], sectionB: [] },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] }
  }
};