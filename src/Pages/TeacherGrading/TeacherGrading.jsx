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
    data: null,
  });
  const [modifiedAssessments, setModifiedAssessments] = useState(new Set());
  const [isPublishing, setIsPublishing] = useState(false); // Loading state for publish/unpublish

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
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
      data: { ...item },
    });
  };

  // Handler for toggling publish status
  const handlePublishToggle = async (id) => {
    if (isPublishing) return; // Prevent multiple clicks
    setIsPublishing(true);

    try {
      const currentItem = marksData[activeTab][activeCourse][activeSection].find(
        (item) => item.id === id
      );
      if (!currentItem) return;

      const newPublishStatus = !currentItem.published;

      // If publishing, submit all student grades
      if (newPublishStatus) {
        const gradePromises = currentItem.studentMarks
          .filter((student) => student.marks && !isNaN(student.marks))
          .map((student) =>
            fetch("http://localhost:5000/api/grade", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId: student.id,
                courseId: activeCourse,
                sectionId: activeSection,
                type: activeTab.slice(0, -1),
                title: currentItem.serial.toString(),
                maxMarks: parseInt(currentItem.totalMarks),
                obtainedMarks: parseInt(student.marks),
                weightage: parseInt(currentItem.weightage),
                date: new Date().toISOString(),
                feedback: "Good work",
              }),
            })
          );

        await Promise.all(gradePromises);
      }

      // Update publish status via API
      const publishResponse = await fetch(
        `http://localhost:5000/api/assessment/${id}/publish`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: newPublishStatus }),
        }
      );

      if (!publishResponse.ok) {
        throw new Error("Failed to update publish status");
      }

      // Update local state
      setMarksData((prevData) => ({
        ...prevData,
        [activeTab]: {
          ...prevData[activeTab],
          [activeCourse]: {
            ...prevData[activeTab][activeCourse],
            [activeSection]: prevData[activeTab][activeCourse][activeSection].map(
              (item) =>
                item.id === id ? { ...item, published: newPublishStatus } : item
            ),
          },
        },
      }));

      // Remove from modified set when published
      if (newPublishStatus) {
        setModifiedAssessments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }

      alert(
        `Assessment ${newPublishStatus ? "published" : "unpublished"} successfully!`
      );
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Failed to update publish status");
    } finally {
      setIsPublishing(false);
    }
  };

  // Handler for deleting an item
  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this assessment? This action cannot be undone."
      )
    ) {
      setMarksData((prevData) => {
        const newData = { ...prevData };
        newData[activeTab][activeCourse][activeSection] =
          newData[activeTab][activeCourse][activeSection].filter(
            (item) => item.id !== id
          );
        return newData;
      });

      // Remove from modified set if it exists
      setModifiedAssessments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };


  // Submit data to API
  const submitGradeToAPI = async (studentData, assessment) => {
    try {
      const typeMap = {
        quizzes: "quiz",
        assignments: "assignment",
        midterms: "midterm",
        finals: "final",
      };

      const payload = {
        studentId: studentData.id.toString(),
        courseId: "67dc9354909fb3f482456802",
        type: typeMap[activeTab] || "quiz",
        title: assessment.serial.toString(),
        maxMarks: parseInt(assessment.totalMarks),
        obtainedMarks: parseInt(studentData.marks),
        weightage: parseInt(assessment.weightage),
        date: new Date().toISOString(),
        feedback: "Good work",
      };

      const response = await fetch("http://localhost:5000/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error submitting grade:", error);
      return null;
    }
  };

  // Handler for saving form data (both new and edit)
  const handleSaveForm = async (formData) => {
    try {
      if (currentModal.type === "add") {
        // Add new assessment
        const newItem = {
          id: Date.now(),
          ...formData,
          uploadDate: new Date().toISOString().split("T")[0],
        };

        // Submit each student's grade to the API
        if (newItem.studentMarks && newItem.studentMarks.length > 0) {
          for (const student of newItem.studentMarks) {
            if (student.marks && !isNaN(student.marks)) {
              await submitGradeToAPI(student, newItem);
            }
          }
        }

        setMarksData((prevData) => {
          const newData = { ...prevData };
          newData[activeTab][activeCourse][activeSection] = [
            ...newData[activeTab][activeCourse][activeSection],
            newItem,
          ];
          return newData;
        });
      } else if (currentModal.type === "edit") {
        // Update existing assessment
        const existingItem = marksData[activeTab][activeCourse][activeSection].find(
          (item) => item.id === formData.id
        );

        // Submit updated student grades to API
        if (formData.studentMarks && formData.studentMarks.length > 0) {
          for (const student of formData.studentMarks) {
            const existingStudent = existingItem.studentMarks.find(
              (s) => s.id === student.id
            );
            if (!existingStudent || existingStudent.marks !== student.marks) {
              await submitGradeToAPI(student, formData);
            }
          }
        }

        setMarksData((prevData) => {
          const newData = { ...prevData };
          const itemIndex = newData[activeTab][activeCourse][activeSection].findIndex(
            (item) => item.id === formData.id
          );

          if (itemIndex !== -1) {
            newData[activeTab][activeCourse][activeSection][itemIndex] = formData;
          }

          return newData;
        });

        // Mark as modified if it was an edit and already published
        if (currentModal.type === "edit" && existingItem.published) {
          setModifiedAssessments((prev) => {
            const newSet = new Set(prev);
            newSet.add(formData.id);
            return newSet;
          });
        }
      }

      setCurrentModal({ type: null, data: null });
    } catch (error) {
      console.error("Error saving form data:", error);
      alert("Failed to save assessment data");
    }
  };

  // Handler for importing CSV data
  const handleImportCSV = async (parsedData) => {
    console.log("CSV Import - Received data:", parsedData);

    if (!parsedData || parsedData.length === 0) {
      alert("No data found in CSV file");
      return;
    }

    const serial = parseInt(parsedData[0].serial) || Date.now();

    const existingAssessmentIndex = marksData[activeTab][activeCourse][
      activeSection
    ].findIndex((item) => item.serial === serial);

    if (existingAssessmentIndex !== -1) {
      alert(
        `An assessment with serial #${serial} already exists. Please use a different serial number.`
      );
      return;
    }

    const studentsMap = new Map();

    parsedData.forEach((row, index) => {
      const studentId = row.studentId || index + 1;

      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          id: studentId,
          name: row.studentName || `Student ${studentId}`,
          marks: parseFloat(row.marks) || 0,
        });
      }
    });

    const studentMarks = Array.from(studentsMap.values());

    const assessment = {
      id: Date.now(),
      serial: serial,
      weightage: parseFloat(parsedData[0].weightage) || 0,
      totalMarks: parseFloat(parsedData[0].totalMarks) || 100,
      uploadDate: new Date().toISOString().split("T")[0],
      published: false,
      studentMarks: studentMarks,
    };

    const validMarks = assessment.studentMarks
      .map((s) => s.marks)
      .filter((m) => !isNaN(m) && m !== null);

    if (validMarks.length > 0) {
      assessment.average = +(
        validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length
      ).toFixed(2);
      assessment.min = Math.min(...validMarks);
      assessment.max = Math.max(...validMarks);

      const mean = assessment.average;
      const sumSquareDiffs = validMarks.reduce(
        (sum, value) => sum + Math.pow(value - mean, 2),
        0
      );
      assessment.stdDev = +Math.sqrt(sumSquareDiffs / validMarks.length).toFixed(2);
    }

    setMarksData((prevData) => {
      const newData = { ...prevData };
      newData[activeTab][activeCourse][activeSection] = [
        ...newData[activeTab][activeCourse][activeSection],
        assessment,
      ];
      return newData;
    });

    setTimeout(async () => {
      try {
        for (const student of assessment.studentMarks) {
          await submitGradeToAPI(student, assessment);
        }
        alert("CSV data imported successfully!");
      } catch (error) {
        console.error("Error submitting grades to API:", error);
        alert("CSV imported but there was an error submitting some grades to the API.");
      }
    }, 0);
  };

  // Get data for CSV export
  const getExportData = () => {
    const currentData = marksData?.[activeTab]?.[activeCourse]?.[activeSection] || [];
    if (currentData.length === 0) return [];

    let exportData = [];
    currentData.forEach((assessment) => {
      assessment.studentMarks.forEach((student) => {
        exportData.push({
          serial: assessment.serial,
          assessmentType: activeTab.slice(0, -1),
          weightage: assessment.weightage,
          totalMarks: assessment.totalMarks,
          studentId: student.id,
          studentName: student.name,
          marks: student.marks,
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
      <div className="page-header">
        <h1>Teacher Marks Management</h1>
        <div className="teacher-actions">
          <button
            className="add-marks-btn"
            onClick={() =>
              setCurrentModal({
                type: "add",
                data: {
                  serial: "",
                  weightage: "",
                  totalMarks: "",
                  published: false,
                  studentMarks: Array.from({ length: 10 }, (_, i) => ({
                    id: i + 1,
                    name: `Student ${i + 1}`,
                    marks: "",
                  })),
                },
              })
            }
          >
            + Add {activeTab.slice(0, -1).replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <div className="course-tabs">
          {marksData.courses.map((course) => (
            <button
              key={course.id}
              className={`course-tab ${activeCourse === course.id ? "active" : ""}`}
              onClick={() => setActiveCourse(course.id)}
            >
              {course.name}
            </button>
          ))}
        </div>

        <div className="section-tabs">
          {marksData.courses
            .find((course) => course.id === activeCourse)
            ?.sections.map((section) => (
              <button
                key={section}
                className={`section-tab ${activeSection === section ? "active" : ""}`}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </button>
            ))}
        </div>
        <div className=".csv-actions" />
        <CSVImportExport
          onImport={(data) => {
            console.log("onImport called with data:", data.length);
            handleImportCSV(data);
          }}
          exportData={getExportData()}
          filename={`${activeCourse}-${activeSection}-${activeTab}`}
        />

        <div className="assessment-tabs">
          {["quizzes", "assignments", "midterms", "finals"].map((tab) => (
            <button
              key={tab}
              className={`assessment-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
                <tr
                  key={item.id}
                  className={modifiedAssessments.has(item.id) ? "modified-row" : ""}
                >
                  <td>{item.serial}</td>
                  <td>{item.weightage}</td>
                  <td>{item.totalMarks}</td>
                  <td>{item.average?.toFixed(1) || "-"}</td>
                  <td>
                    <span
                      className={`status-badge ${item.published ? "published" : "draft"}`}
                    >
                      {item.published ? "Published" : "Draft"}
                    </span>
                    {modifiedAssessments.has(item.id) && (
                      <span className="modified-badge">Modified</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <button className="edit-btn" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      {modifiedAssessments.has(item.id) || !item.published ? (
                        <button
                          className="publish-btn highlight-publish"
                          onClick={() => handlePublishToggle(item.id)}
                          disabled={isPublishing}
                        >
                          {isPublishing ? "Publishing..." : "Publish"}
                        </button>
                      ) : (
                        <button
                          className="publish-btn unpublish"
                          onClick={() => handlePublishToggle(item.id)}
                          disabled={isPublishing}
                        >
                          {isPublishing ? "Unpublishing..." : "Unpublish"}
                        </button>
                      )}
                      <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data">
                  No assessments added yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStudentMarksChange = (id, value) => {
    setFormData((prev) => ({
      ...prev,
      studentMarks: prev.studentMarks.map((student) =>
        student.id === id ? { ...student, marks: value } : student
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (type === "add" || type === "edit") {
      const validMarks = formData.studentMarks
        .map((s) => parseFloat(s.marks))
        .filter((m) => !isNaN(m));

      if (validMarks.length) {
        const average = validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length;
        const min = Math.min(...validMarks);
        const max = Math.max(...validMarks);

        const mean = average;
        const sumSquareDiffs = validMarks.reduce(
          (sum, value) => sum + Math.pow(value - mean, 2),
          0
        );
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
    edit: `Edit ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} #${
      formData?.serial
    }`,
    view: `Student Marks for ${assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)} #${
      formData?.serial
    }`,
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === "modal-overlay" && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{modalTitle[type]}</h2>
          <button className="close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
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
                {formData.studentMarks.map((student) => (
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
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
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

// Sample data structure
const sampleData = {
  courses: [
    { id: "discrete", name: "Discrete Mathematics", sections: ["sectionA", "sectionB"] },
    { id: "pspf", name: "Programming Fundamentals", sections: ["sectionA"] },
    { id: "calculus", name: "Calculus", sections: ["sectionA", "sectionB", "sectionC"] },
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
            marks: Math.floor(Math.random() * 15),
          })),
        },
      ],
      sectionB: [],
    },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] },
  },
  assignments: {
    discrete: { sectionA: [], sectionB: [] },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] },
  },
  midterms: {
    discrete: { sectionA: [], sectionB: [] },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] },
  },
  finals: {
    discrete: { sectionA: [], sectionB: [] },
    pspf: { sectionA: [] },
    calculus: { sectionA: [], sectionB: [], sectionC: [] },
  },
};