import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import "./Teacher_Gradings.css";

const GradingPage = () => {
  const [activeTab, setActiveTab] = useState("quizzes");
  const [program, setProgram] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchId, setSearchId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    totalMarks: "",
    weightage: "",
  });

  // Sample data
  const quizzes = [
    {
      stdName: "Ahsan",
      stdId: "F21-123",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
      average: "92%",
    },
  ];
  const assignments = [
    {
      stdName: "Ahsan",
      stdId: "F21-123",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
  ];
  const mids = [
    {
      stdName: "Ahsan",
      stdId: "F21-123",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
  ];
  const finals = [
    {
      stdName: "Ahsan",
      stdId: "F21-123",
      course: "Discrete",
      batch: "fall-25",
      quizNo: 1,
      marks: "8/10",
      weightage: "92%",
    },
  ];

  const assessmentTypes = {
    quizzes: { title: "Quizzes", data: quizzes },
    assignments: { title: "Assignments", data: assignments },
    mids: { title: "Mids", data: mids },
    finals: { title: "Finals", data: finals },
  };

  const handleAddAssessment = () => {
    // Add assessment logic here
    setShowAddModal(false);
  };

  const handleUploadExcel = () => {
    // Upload Excel logic here
    alert("Upload Excel button clicked");
  };

  return (
    <div className="portal-container">
      <div className="filters-section">
        <div className="filters-grid">
          <select
            className="form-input"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="">Select Program</option>
            <option value="bscs">BSCS</option>
            <option value="bba">BBA</option>
            <option value="ba">BA</option>
          </select>

          <select
            className="form-input"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            <option value="discrete">Discrete</option>
            <option value="pspf">PSPF</option>
            <option value="calculus">Calculus</option>
          </select>

          <select
            className="form-input"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            <option value="">Select Batch</option>
            <option value="fall-25">Fall-25</option>
            <option value="spring-26">Spring-26</option>
          </select>

          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name"
              className="search-input"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by ID"
              className="search-input"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="tab-container fade-in">
        <div className="tab-header">
          {Object.keys(assessmentTypes).map((type) => (
            <button
              key={type}
              className={`tab-button ${activeTab === type ? "active" : ""}`}
              onClick={() => setActiveTab(type)}
            >
              {assessmentTypes[type].title}
            </button>
          ))}
        </div>

        <div className="table-section">
          <div className="table-header">
            <h2>{assessmentTypes[activeTab].title}</h2>
            <button
              className="add-button"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} />
              Add {assessmentTypes[activeTab].title.slice(0, -1)}
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Assessment No.</th>
                <th>Marks</th>
                <th>Weightage</th>
              </tr>
            </thead>
            <tbody>
              {assessmentTypes[activeTab].data.map((item, index) => (
                <tr key={index}>
                  <td>{item.stdName}</td>
                  <td>{item.stdId}</td>
                  <td>{item.course}</td>
                  <td>{item[`${activeTab.slice(0, -1)}No`]}</td>
                  <td>{item.marks}</td>
                  <td>{item.weightage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal fade-in">
          <div className="modal-header">
            <h3 className="modal-title">
              Add New {assessmentTypes[activeTab].title.slice(0, -1)}
            </h3>
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Title"
              className="form-input"
              value={newAssessment.title}
              onChange={(e) =>
                setNewAssessment({ ...newAssessment, title: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Total Marks"
              className="form-input"
              value={newAssessment.totalMarks}
              onChange={(e) =>
                setNewAssessment({
                  ...newAssessment,
                  totalMarks: e.target.value,
                })
              }
            />
            <input
              type="number"
              placeholder="Weightage (%)"
              className="form-input"
              value={newAssessment.weightage}
              onChange={(e) =>
                setNewAssessment({
                  ...newAssessment,
                  weightage: e.target.value,
                })
              }
            />
          </div>
          <div className="flex gap-4">
            <button className="add-button" onClick={handleAddAssessment}>
              Create
            </button>
            <button
              className="add-button"
              style={{ backgroundColor: "#4CAF50" }}
              onClick={handleUploadExcel}
            >
              Upload Excel
            </button>
            <button
              className="add-button"
              style={{ backgroundColor: "#64748b" }}
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradingPage;
