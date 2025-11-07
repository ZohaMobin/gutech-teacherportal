import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import "./Attendance.css";

const Attendance = () => {
  const apiUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

  // State management
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get auth token from session storage
  const getAuthToken = () => {
    return sessionStorage.getItem("token");
  };

  // Get teacher ID from session storage
  const getTeacherId = () => {
    const userData = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (!userData || !token) {
      console.error("Missing user data or token in session");
      return null;
    }

    try {
      const user = JSON.parse(userData);
      if (!user || !user.teacherId) {
        console.error("Invalid user data structure:", user);
        return null;
      }
      return user.teacherId;
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  };

  // Error handler
  const handleApiError = (error) => {
    if (error.response) {
      const message = error.response.data?.message || "An error occurred";
      toast.error(message);
      setError(message);
    } else if (error.request) {
      toast.error("Network error. Please check your connection.");
      setError("Network error. Please check your connection.");
    } else {
      toast.error("An unexpected error occurred. Please try again.");
      setError("An unexpected error occurred. Please try again.");
    }
    console.error("API Error:", error);
  };

  // Fetch sections for the teacher
  const fetchSections = async () => {
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
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data) {
        setSections(response.data);

        // Set the first section as active if available
        if (response.data.length > 0 && !activeSection) {
          const firstSection = response.data[0];
          setActiveSection(firstSection);
          fetchStudents(firstSection._id, firstSection);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for a section
  const fetchStudents = async (sectionId, section = null) => {
    if (!sectionId) return;

    setLoading(true);
    setError(null);
    // Clear attendance data and students when starting to fetch new section
    setAttendanceData({});
    setStudents([]);

    try {
      const response = await axios.get(`${apiUrl}/api/teacher-marks/section/${sectionId}/students`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      // Use the passed section parameter or fall back to activeSection
      const currentSection = section || activeSection;

      if (response.data) {
        // Handle empty array from API - no students enrolled
        if (Array.isArray(response.data) && response.data.length === 0) {
          setStudents([]);
          // Still fetch marked dates even if no students
          if (currentSection) {
            const sectionId = currentSection._id || currentSection.id;
            if (sectionId) {
              fetchMarkedDates(sectionId);
            }
          }
        } else {
          setStudents(response.data);

          // Fetch existing attendance for the selected date and marked dates
          if (currentSection) {
            const sectionId = currentSection._id || currentSection.id;
            if (sectionId) {
              // Fetch marked dates first
              fetchMarkedDates(sectionId);
              // Then fetch attendance for the selected date
              fetchExistingAttendance(sectionId, selectedDate);
            }
          }
        }

        setHasUnsavedChanges(false);
      } else {
        // If response.data is null or undefined, set empty array
        setStudents([]);
      }
    } catch (error) {
      handleApiError(error);
      // Ensure students and attendance are cleared on error
      setStudents([]);
      setAttendanceData({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch marked dates for calendar highlighting
  const fetchMarkedDates = async (sectionId) => {
    if (!sectionId) return;

    try {
      const response = await axios.get(`${apiUrl}/api/teachers/attendance?sectionId=${sectionId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data && response.data.attendance && Array.isArray(response.data.attendance)) {
        // Extract unique dates from attendance records
        const dates = new Set();
        response.data.attendance.forEach((sectionData) => {
          if (sectionData.dates) {
            Object.keys(sectionData.dates).forEach((dateStr) => {
              // Ensure date is in YYYY-MM-DD format
              if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dates.add(dateStr);
              }
            });
          }
        });

        // Dates are already in YYYY-MM-DD format from the API
        const datesArray = Array.from(dates).sort();
        setMarkedDates(datesArray);
        console.log("Marked dates set:", datesArray); // Debug log
      } else {
        setMarkedDates([]);
      }
    } catch (error) {
      console.error("Error fetching marked dates:", error);
    }
  };

  // Fetch existing attendance for a specific date
  const fetchExistingAttendance = async (sectionId, date) => {
    if (!sectionId || !date) {
      setAttendanceData({});
      return;
    }

    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await axios.get(`${apiUrl}/api/teachers/attendance?sectionId=${sectionId}&date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data && response.data.attendance && Array.isArray(response.data.attendance)) {
        const attendanceMap = {};

        // Find the section data for this sectionId
        const sectionData = response.data.attendance.find((item) => {
          const itemSectionId = item.sectionId?.toString() || item.sectionId;
          const searchSectionId = sectionId?.toString() || sectionId;
          return itemSectionId === searchSectionId;
        });

        if (sectionData && sectionData.dates && sectionData.dates[dateStr]) {
          // Map student attendance from the students array
          sectionData.dates[dateStr].students.forEach((record) => {
            // studentId is already a string/ObjectId from the API
            const studentId = record.studentId?.toString() || record.studentId;
            if (studentId) {
              // Normalize to string for consistent comparison
              attendanceMap[studentId.toString()] = record.status;
            }
          });
        }

        setAttendanceData(attendanceMap);
        setHasUnsavedChanges(false);
      } else {
        // If no attendance found for this date, clear the attendance data
        setAttendanceData({});
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error fetching existing attendance:", error);
      // Clear attendance data on error to show fresh state
      setAttendanceData({});
      setHasUnsavedChanges(false);
    }
  };

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchQuery("");
    setStudents([]); // Clear students list
    setAttendanceData({}); // Clear attendance data
    setHasUnsavedChanges(false);
    setMarkedDates([]); // Clear marked dates when switching sections
    setError(null); // Clear any errors
    // Pass the section directly to fetchStudents to avoid stale state issue
    fetchStudents(section._id, section);
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAttendanceData({});
    setHasUnsavedChanges(false);

    if (activeSection) {
      const sectionId = activeSection._id || activeSection.id;
      if (sectionId) {
        fetchExistingAttendance(sectionId, date);
      }
    }
  };

  // Handle attendance status change
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData((prev) => {
      const newData = { ...prev };
      // Normalize student ID to string for consistent comparison
      const normalizedId = studentId?.toString() || studentId;
      // Toggle if same status, otherwise set new status
      if (newData[normalizedId] === status) {
        delete newData[normalizedId];
      } else {
        newData[normalizedId] = status;
      }
      return newData;
    });
    setHasUnsavedChanges(true);
  };

  // Save attendance
  const saveAttendance = async () => {
    if (!activeSection) {
      toast.error("Please select a section first");
      return;
    }

    if (students.length === 0) {
      toast.error("No students found for this section");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Only include students that have been explicitly marked
      const attendanceDataArray = students
        .map((student) => {
          // Normalize student ID to string for consistent comparison
          const studentId = student.id?.toString() || student.id;
          const status = attendanceData[studentId] || attendanceData[student.id];

          // Only include if student has been marked (has a status)
          if (status) {
            return {
              studentId: studentId,
              status: status,
            };
          }
          return null;
        })
        .filter((item) => item !== null); // Remove null entries (unmarked students)

      // Check if at least one student is marked
      if (attendanceDataArray.length === 0) {
        toast.error("Please mark at least one student before saving");
        setSaving(false);
        return;
      }

      const dateStr = selectedDate.toISOString().split("T")[0];
      const sectionId = activeSection._id || activeSection.id;
      const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;

      const response = await axios.post(
        `${apiUrl}/api/teachers/attendance`,
        {
          sectionId: sectionId,
          courseId: courseId,
          date: dateStr,
          attendanceData: attendanceDataArray,
        },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        toast.success("Attendance saved successfully!");
        setHasUnsavedChanges(false);

        // Add the current date to marked dates if not already there
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        if (!markedDates.includes(formattedDate)) {
          setMarkedDates((prev) => [...prev, formattedDate]);
        }

        // Refresh marked dates from server to get all marked dates
        const sectionId = activeSection._id || activeSection.id;
        if (sectionId) {
          fetchMarkedDates(sectionId);
          // Re-fetch attendance for the current date to ensure it's displayed
          fetchExistingAttendance(sectionId, selectedDate);
        }
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  };

  // Quick actions
  const markAllPresent = () => {
    const newData = {};
    students.forEach((student) => {
      const studentId = student.id?.toString() || student.id;
      newData[studentId] = "present";
    });
    setAttendanceData(newData);
    setHasUnsavedChanges(true);
  };

  const markAllAbsent = () => {
    const newData = {};
    students.forEach((student) => {
      const studentId = student.id?.toString() || student.id;
      newData[studentId] = "absent";
    });
    setAttendanceData(newData);
    setHasUnsavedChanges(true);
  };

  const clearAll = () => {
    setAttendanceData({});
    setHasUnsavedChanges(true);
  };

  // Export to CSV
  const exportToCSV = async () => {
    if (!activeSection || students.length === 0) {
      toast.error("No attendance data to export");
      return;
    }

    try {
      // Fetch all attendance records for this course to get date range
      const sectionId = activeSection._id || activeSection.id;
      const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;
      const attendanceResponse = await axios.get(`${apiUrl}/api/teachers/attendance?sectionId=${sectionId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (!attendanceResponse.data || !attendanceResponse.data.attendance) {
        toast.error("No attendance data found to export");
        return;
      }

      const attendanceArray = attendanceResponse.data.attendance;
      const sectionData = attendanceArray.find((item) => item.sectionId === sectionId || item.sectionId?.toString() === sectionId.toString());

      if (!sectionData || !sectionData.dates) {
        toast.error("No attendance data found to export");
        return;
      }

      // Get all dates
      const allDates = Object.keys(sectionData.dates).sort();

      // Prepare data for CSV
      const csvData = [];

      // Header row: Student Info + Dates
      const header = ["Roll Number", "Name", ...allDates];
      csvData.push(header);

      // Data rows: Student info + attendance for each date
      students.forEach((student) => {
        const studentId = student.id?.toString() || student.id;
        const row = [
          student.rollNumber || "",
          student.name || "",
          ...allDates.map((date) => {
            // Find attendance record for this student and date
            const dateRecords = sectionData.dates[date]?.students || [];
            const record = dateRecords.find((r) => {
              const rStudentId = r.studentId?.toString() || r.studentId;
              return rStudentId === studentId;
            });

            if (record) {
              const status = record.status;
              if (status === "present") return "P";
              if (status === "absent") return "A";
              if (status === "late") return "L";
            }
            return "";
          }),
        ];
        csvData.push(row);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(csvData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Roll Number
        { wch: 30 }, // Name
        ...allDates.map(() => ({ wch: 8 })), // Date columns
      ];
      ws["!cols"] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      const courseName = activeSection.courseId?.name || "Course";
      const courseCode = activeSection.courseId?.code || "";
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");

      // Generate filename
      const filename = `Attendance_${courseCode}_${courseName}_${new Date().toISOString().split("T")[0]}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      toast.success("Attendance exported successfully!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export attendance. Please try again.");
    }
  };

  // Get attendance statistics
  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendanceData).filter((status) => status === "present").length;
    const absent = Object.values(attendanceData).filter((status) => status === "absent").length;
    const late = Object.values(attendanceData).filter((status) => status === "late").length;
    const unmarked = total - present - absent - late;

    return { total, present, absent, late, unmarked };
  };

  // Filter students by search query
  const filteredStudents = students.filter(
    (student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Highlight marked dates in calendar
  const dayClassName = (date) => {
    if (!date || !markedDates || markedDates.length === 0) {
      return "";
    }

    // Format date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Check if this date is in markedDates array
    const isMarked = markedDates.some((markedDate) => {
      // Handle both string and Date object formats
      const markedDateStr = typeof markedDate === "string" ? markedDate : markedDate.toISOString().split("T")[0];
      return markedDateStr === dateStr;
    });

    if (isMarked) {
      return "marked-date";
    }
    return "";
  };

  // Initialize
  useEffect(() => {
    fetchSections();
  }, []);

  // Fetch attendance when section or date changes
  useEffect(() => {
    if (activeSection && students.length > 0) {
      const sectionId = activeSection._id || activeSection.id;
      if (sectionId) {
        // Clear attendance data first to show loading state, then fetch new data
        setAttendanceData({});
        fetchExistingAttendance(sectionId, selectedDate);
      }
    } else if (activeSection && students.length === 0) {
      // If no students, clear attendance data
      setAttendanceData({});
    }
  }, [activeSection?._id, activeSection?.id, selectedDate, students.length]);

  const stats = getAttendanceStats();

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-content">
          <h1>Attendance</h1>
          <p>Mark and manage student attendance</p>
        </div>
        {activeSection && attendanceData && Object.keys(attendanceData).length > 0 && (
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={18} />
            Export to Excel
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      <div className="attendance-content">
        {/* Sidebar - Section Selection */}
        <div className="attendance-sidebar">
          <div className="section-selector">
            <h3>Select Section</h3>
            {loading && sections.length === 0 ? (
              <div className="loading-text">Loading sections...</div>
            ) : sections.length === 0 ? (
              <div className="empty-text">No sections available</div>
            ) : (
              <div className="section-list">
                {sections.map((section) => (
                  <div key={section._id} className={`section-item ${activeSection?._id === section._id ? "active" : ""}`} onClick={() => handleSectionChange(section)}>
                    <div className="section-info">
                      <div className="section-name">{section.courseId?.name || "Unknown Course"}</div>
                      <div className="section-code">
                        Section {section.section} - {section.courseId?.code || ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="attendance-main">
          {activeSection ? (
            <>
              {/* Attendance Controls */}
              <div className="attendance-controls">
                <div className="date-selector">
                  <label htmlFor="attendance-date">Select Date</label>
                  <DatePicker
                    id="attendance-date"
                    selected={selectedDate}
                    onChange={handleDateChange}
                    onSelect={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    className="date-input"
                    dayClassName={dayClassName}
                    highlightDates={markedDates.map((dateStr) => {
                      const [year, month, day] = dateStr.split("-");
                      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    })}
                    maxDate={new Date()}
                    filterDate={(date) => date <= new Date()}
                  />
                  <div className="date-legend">
                    <span className="legend-dot"></span>
                    <span className="legend-text">Dates with marked attendance</span>
                  </div>
                </div>

                <div className="quick-actions">
                  <span className="quick-actions-label">Quick Actions:</span>
                  <button className="btn-quick present" onClick={markAllPresent}>
                    Mark All Present
                  </button>
                  <button className="btn-quick absent" onClick={markAllAbsent}>
                    Mark All Absent
                  </button>
                  <button className="btn-quick clear" onClick={clearAll}>
                    Clear All
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="attendance-stats">
                <div className="stat-card total">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-card present">
                  <div className="stat-value">{stats.present}</div>
                  <div className="stat-label">Present</div>
                </div>
                <div className="stat-card absent">
                  <div className="stat-value">{stats.absent}</div>
                  <div className="stat-label">Absent</div>
                </div>
                <div className="stat-card late">
                  <div className="stat-value">{stats.late}</div>
                  <div className="stat-label">Late</div>
                </div>
                <div className="stat-card unmarked">
                  <div className="stat-value">{stats.unmarked}</div>
                  <div className="stat-label">Unmarked</div>
                </div>
              </div>

              {/* Search */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search students by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Students Table */}
              {loading ? (
                <div className="loading">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="empty-state">
                  <p>No students enrolled in this course</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <p>No students found matching your search</p>
                </div>
              ) : (
                <div className="students-table-container">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Name</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="roll-number">{student.rollNumber}</td>
                          <td className="student-name">{student.name}</td>
                          <td className="attendance-actions-cell">
                            <div className="attendance-actions">
                              <button
                                onClick={() => handleAttendanceChange(student.id, "present")}
                                className={`attendance-btn present ${(attendanceData[student.id] || attendanceData[student.id?.toString()]) === "present" ? "active" : ""}`}
                                title="Present"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.id, "absent")}
                                className={`attendance-btn absent ${(attendanceData[student.id] || attendanceData[student.id?.toString()]) === "absent" ? "active" : ""}`}
                                title="Absent"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.id, "late")}
                                className={`attendance-btn late ${(attendanceData[student.id] || attendanceData[student.id?.toString()]) === "late" ? "active" : ""}`}
                                title="Late"
                              >
                                Late
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Save Button */}
              <div className="attendance-footer">
                <button className="btn btn-primary save-btn" onClick={saveAttendance} disabled={saving || loading}>
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
                {hasUnsavedChanges && (
                  <div className="unsaved-indicator">
                    <span>You have unsaved changes</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Please select a section to mark attendance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
