import React, { useState, useEffect } from "react";
import "./TeacherGrading.css";

const TeacherGrading = () => {
  const [activeTab, setActiveTab] = useState("quizzes");
  const [activeCourse, setActiveCourse] = useState("discrete");
  const [marksData, setMarksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditing, setCurrentEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const [newAssessment, setNewAssessment] = useState({
    serial: '',
    weightage: '',
    totalMarks: ''
  });
  const [studentMarks, setStudentMarks] = useState([
    { id: 1, name: "Student 1", marks: "" },
    { id: 2, name: "Student 2", marks: "" },
    { id: 3, name: "Student 3", marks: "" },
    { id: 4, name: "Student 4", marks: "" },
    { id: 5, name: "Student 5", marks: "" },
  ]);

  // Sample data structure - this would be replaced with your API data
  const sampleData = {
    courses: [
      { id: "discrete", name: "Discrete Mathematics" },
      { id: "pspf", name: "Programming Fundamentals" },
      { id: "calculus", name: "Calculus" }
    ],
    quizzes: {
      discrete: [
        { id: 1, serial: 1, weightage: 15, totalMarks: 15, average: 12.97, stdDev: 1.1, min: 8, max: 14.5, uploadDate: "2025-02-15", published: true },
        { id: 2, serial: 2, weightage: 15, totalMarks: 15, average: 13.4, stdDev: 1.3, min: 9, max: 15, uploadDate: "2025-03-01", published: false },
      ],
      pspf: [
        { id: 3, serial: 1, weightage: 15, totalMarks: 15, average: 11.3, stdDev: 1.8, min: 7, max: 15, uploadDate: "2025-02-20", published: true },
      ],
      calculus: [
        { id: 4, serial: 1, weightage: 20, totalMarks: 20, average: 16.63, stdDev: 1.4, min: 12.5, max: 19, uploadDate: "2025-03-05", published: true }
      ]
    },
    assignments: {
      discrete: [
        { id: 5, serial: 1, weightage: 25, totalMarks: 25, average: 21.2, stdDev: 1.8, min: 17, max: 24, uploadDate: "2025-01-25", published: true },
      ],
      pspf: [
        { id: 6, serial: 1, weightage: 25, totalMarks: 25, average: 18.77, stdDev: 2.1, min: 15, max: 23.5, uploadDate: "2025-02-10", published: true }
      ],
      calculus: []
    },
    midterms: {
      discrete: [
        { id: 7, serial: 1, weightage: 30, totalMarks: 30, average: 25.2, stdDev: 2.2, min: 19, max: 29, uploadDate: "2025-02-28", published: true }
      ],
      pspf: [],
      calculus: []
    },
    finals: {
      discrete: [
        { id: 8, serial: 1, weightage: 50, totalMarks: 50, average: 41.6, stdDev: 3.4, min: 32, max: 48, uploadDate: "2025-03-15", published: false }
      ],
      pspf: [],
      calculus: []
    }
  };

  // Simulating API data fetch
  useEffect(() => {
    // Replace this with your actual API call
    setTimeout(() => {
      setMarksData(sampleData);
      setLoading(false);
    }, 500);
  }, []);

  const handleEditClick = (item) => {
    setIsEditing(true);
    setCurrentEditing(item.id);
    setEditValues({
      serial: item.serial,
      weightage: item.weightage,
      totalMarks: item.totalMarks,
      published: item.published
    });
  };

  const handleSaveEdit = () => {
    // Replace with your API call to save changes
    setMarksData(prevData => {
      const newData = {...prevData};
      const itemIndex = newData[activeTab][activeCourse].findIndex(item => item.id === currentEditing);
      
      if (itemIndex !== -1) {
        newData[activeTab][activeCourse][itemIndex] = {
          ...newData[activeTab][activeCourse][itemIndex],
          ...editValues
        };
      }
      
      return newData;
    });
    
    setIsEditing(false);
    setCurrentEditing(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentEditing(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePublishToggle = (id) => {
    // Replace with your API call to toggle published status
    setMarksData(prevData => {
      const newData = {...prevData};
      const itemIndex = newData[activeTab][activeCourse].findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        newData[activeTab][activeCourse][itemIndex] = {
          ...newData[activeTab][activeCourse][itemIndex],
          published: !newData[activeTab][activeCourse][itemIndex].published
        };
      }
      
      return newData;
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this assessment? This action cannot be undone.")) {
      // Replace with your API call to delete the assessment
      setMarksData(prevData => {
        const newData = {...prevData};
        newData[activeTab][activeCourse] = newData[activeTab][activeCourse].filter(item => item.id !== id);
        return newData;
      });
    }
  };

  const handleUploadClick = (type) => {
    setUploadType(type);
    setShowUploadModal(true);
  };

  const handleNewAssessmentChange = (e) => {
    const { name, value } = e.target;
    setNewAssessment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentMarksChange = (id, value) => {
    setStudentMarks(prev => 
      prev.map(student => 
        student.id === id ? {...student, marks: value} : student
      )
    );
  };

  const handleSubmitNewAssessment = () => {
    // Calculate stats from student marks
    const validMarks = studentMarks
      .map(s => parseFloat(s.marks))
      .filter(m => !isNaN(m));
    
    const average = validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length;
    const min = Math.min(...validMarks);
    const max = Math.max(...validMarks);
    
    // Calculate standard deviation
    const mean = average;
    const squareDiffs = validMarks.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    // Create new assessment
    const newItem = {
      id: Date.now(), // Simple id generation for demo
      serial: parseInt(newAssessment.serial),
      weightage: parseFloat(newAssessment.weightage),
      totalMarks: parseFloat(newAssessment.totalMarks),
      average: parseFloat(average.toFixed(2)),
      stdDev: parseFloat(stdDev.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      uploadDate: new Date().toISOString().split('T')[0],
      published: false
    };
    
    // Update state with new assessment
    setMarksData(prevData => {
      const newData = {...prevData};
      newData[activeTab][activeCourse] = [...newData[activeTab][activeCourse], newItem];
      return newData;
    });
    
    // Reset form and close modal
    setNewAssessment({
      serial: '',
      weightage: '',
      totalMarks: ''
    });
    
    setStudentMarks(prev => 
      prev.map(student => ({...student, marks: ""}))
    );
    
    setShowUploadModal(false);
  };

  if (loading) {
    return <div className="loading-container">Loading teacher portal...</div>;
  }

  const activeCategoryData = marksData[activeTab][activeCourse];

  return (
    <div className="teacher-marks-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>Teacher Marks Management</h1>
        <div className="teacher-actions">
          <button 
            className="add-marks-btn" 
            onClick={() => handleUploadClick(activeTab)}
          >
            + Add New {activeTab.slice(0, -1)[0].toUpperCase() + activeTab.slice(0, -1).substring(1)}
          </button>
        </div>
      </div>
      
      {/* Course Tabs */}
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
      
      {/* Assessment Type Tabs */}
      <div className="assessment-tabs">
        <button
          className={`assessment-tab ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          Quizzes
        </button>
        <button
          className={`assessment-tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button
          className={`assessment-tab ${activeTab === 'midterms' ? 'active' : ''}`}
          onClick={() => setActiveTab('midterms')}
        >
          Midterms
        </button>
        <button
          className={`assessment-tab ${activeTab === 'finals' ? 'active' : ''}`}
          onClick={() => setActiveTab('finals')}
        >
          Finals
        </button>
      </div>
      
      {/* Marks Table */}
      <div className="marks-table-container">
        <table className="marks-table">
          <thead>
            <tr>
              <th>Serial #</th>
              <th>Weightage</th>
              <th>Total Marks</th>
              <th>Average</th>
              <th>Min</th>
              <th>Max</th>
              <th>Upload Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeCategoryData && activeCategoryData.length > 0 ? (
              activeCategoryData.map((item) => (
                <tr key={item.id} className={isEditing && currentEditing === item.id ? 'editing-row' : ''}>
                  <td>
                    {isEditing && currentEditing === item.id ? (
                      <input 
                        type="number" 
                        name="serial"
                        value={editValues.serial} 
                        onChange={handleInputChange}
                        className="edit-input"
                        min="1"
                      />
                    ) : item.serial}
                  </td>
                  <td>
                    {isEditing && currentEditing === item.id ? (
                      <input 
                        type="number" 
                        name="weightage"
                        value={editValues.weightage} 
                        onChange={handleInputChange}
                        className="edit-input"
                        min="0"
                      />
                    ) : item.weightage}
                  </td>
                  <td>
                    {isEditing && currentEditing === item.id ? (
                      <input 
                        type="number" 
                        name="totalMarks"
                        value={editValues.totalMarks} 
                        onChange={handleInputChange}
                        className="edit-input"
                        min="0"
                      />
                    ) : item.totalMarks}
                  </td>
                  <td>{item.average}</td>
                  <td>{item.min}</td>
                  <td>{item.max}</td>
                  <td>{item.uploadDate}</td>
                  <td>
                    {isEditing && currentEditing === item.id ? (
                      <label className="switch-container">
                        <input
                          type="checkbox"
                          name="published"
                          checked={editValues.published}
                          onChange={handleInputChange}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    ) : (
                      <span className={`status-badge ${item.published ? 'published' : 'draft'}`}>
                        {item.published ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    {isEditing && currentEditing === item.id ? (
                      <div className="edit-actions">
                        <button className="save-btn" onClick={handleSaveEdit}>Save</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <div className="row-actions">
                        <button className="edit-btn" onClick={() => handleEditClick(item)}>Edit</button>
                        <button 
                          className={`publish-btn ${item.published ? 'unpublish' : 'publish'}`}
                          onClick={() => handlePublishToggle(item.id)}
                        >
                          {item.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="no-data">No assessments added yet for this category</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Upload New {uploadType.slice(0, -1)[0].toUpperCase() + uploadType.slice(0, -1).substring(1)} Marks</h2>
              <button className="close-modal" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Serial Number:</label>
                  <input 
                    type="number" 
                    name="serial" 
                    value={newAssessment.serial} 
                    onChange={handleNewAssessmentChange}
                    min="1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Weightage:</label>
                  <input 
                    type="number" 
                    name="weightage" 
                    value={newAssessment.weightage} 
                    onChange={handleNewAssessmentChange}
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Total Marks:</label>
                  <input 
                    type="number" 
                    name="totalMarks" 
                    value={newAssessment.totalMarks} 
                    onChange={handleNewAssessmentChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              
              <div className="student-marks-section">
                <h3>Student Marks</h3>
                <table className="student-marks-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Obtained Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarks.map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>
                          <input 
                            type="number" 
                            value={student.marks} 
                            onChange={(e) => handleStudentMarksChange(student.id, e.target.value)}
                            min="0"
                            max={newAssessment.totalMarks}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={handleSubmitNewAssessment}>Upload Marks</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherGrading;