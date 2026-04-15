import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import "./Attendance.css";

const Attendance = () => {
  const apiUrl = process.env.REACT_APP_BACKEND_URL;

  // State management
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlotNumber, setSelectedSlotNumber] = useState(1);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(75);
  const [slotsForSelectedDate, setSlotsForSelectedDate] = useState([]);
  const [localSlotNumbers, setLocalSlotNumbers] = useState([]);
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

  const getDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
              // Then fetch attendance for the selected date and slot
              loadDateAttendance(sectionId, selectedDate, selectedSlotNumber);
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
              // Handle both YYYY-MM-DD format and ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
              let formattedDate = dateStr;
              
              // If date is in ISO format, extract just the date part
              if (dateStr && dateStr.includes('T')) {
                formattedDate = dateStr.split('T')[0];
              }
              
              // Ensure date is in YYYY-MM-DD format
              if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dates.add(formattedDate);
              }
            });
          }
        });

        // Dates are now in YYYY-MM-DD format
        const datesArray = Array.from(dates).sort();
        setMarkedDates(datesArray);
      } else {
        setMarkedDates([]);
      }
    } catch (error) {
      console.error("Error fetching marked dates:", error);
    }
  };

  // Fetch all slots for a specific date and prefill the selected slot
  const loadDateAttendance = async (sectionId, date, preferredSlot = selectedSlotNumber) => {
    if (!sectionId || !date) {
      setAttendanceData({});
      setSlotsForSelectedDate([]);
      return;
    }

    try {
      const dateStr = getDateKey(date);
      const response = await axios.get(`${apiUrl}/api/teachers/attendance?sectionId=${sectionId}&date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data && response.data.attendance && Array.isArray(response.data.attendance)) {
        const sectionData = response.data.attendance.find((item) => {
          const itemSectionId = item.sectionId?.toString() || item.sectionId;
          const searchSectionId = sectionId?.toString() || sectionId;
          return itemSectionId === searchSectionId;
        });

        const dateEntry = sectionData?.dates?.[dateStr];
        const availableSlots = dateEntry?.slots || [];
        setSlotsForSelectedDate(availableSlots);
        setLocalSlotNumbers(availableSlots.map((slot) => slot.slotNumber));

        if (availableSlots.length > 0) {
          const normalizedPreferred = Number(preferredSlot) || 1;
          const activeSlot = availableSlots.find((slot) => slot.slotNumber === normalizedPreferred) || availableSlots[0];
          const attendanceMap = {};
          activeSlot.students.forEach((record) => {
            const studentId = record.studentId?.toString() || record.studentId;
            if (studentId) attendanceMap[studentId.toString()] = record.status;
          });
          setSelectedSlotNumber(activeSlot.slotNumber);
          setSlotDurationMinutes(activeSlot.durationMinutes || 75);
          setAttendanceData(attendanceMap);
        } else if (dateEntry?.students) {
          // Backward compatibility for old API payload
          const attendanceMap = {};
          dateEntry.students.forEach((record) => {
            const studentId = record.studentId?.toString() || record.studentId;
            if (studentId) attendanceMap[studentId.toString()] = record.status;
          });
          setSelectedSlotNumber(Number(preferredSlot) || 1);
          setSlotDurationMinutes(75);
          setAttendanceData(attendanceMap);
          setLocalSlotNumbers([1]);
        } else {
          setAttendanceData({});
          setSlotDurationMinutes(75);
          setLocalSlotNumbers([]);
        }
        setHasUnsavedChanges(false);
      } else {
        setAttendanceData({});
        setSlotsForSelectedDate([]);
        setSlotDurationMinutes(75);
        setLocalSlotNumbers([]);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error fetching existing attendance:", error);
      setAttendanceData({});
      setSlotsForSelectedDate([]);
      setLocalSlotNumbers([]);
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
    setSelectedSlotNumber(1);
    setSlotDurationMinutes(75);
    setSlotsForSelectedDate([]);
    setLocalSlotNumbers([]);
    setError(null); // Clear any errors
    // Pass the section directly to fetchStudents to avoid stale state issue
    fetchStudents(section._id, section);
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAttendanceData({});
    setHasUnsavedChanges(false);
    setSelectedSlotNumber(1);
    setSlotDurationMinutes(75);
    setSlotsForSelectedDate([]);
    setLocalSlotNumbers([]);

    if (activeSection) {
      const sectionId = activeSection._id || activeSection.id;
      if (sectionId) {
        loadDateAttendance(sectionId, date, 1);
      }
    }
  };

  const handleSlotChange = (slotNumber) => {
    const targetSlot = slotsForSelectedDate.find((slot) => slot.slotNumber === slotNumber);
    const attendanceMap = {};
    if (targetSlot) {
      targetSlot.students.forEach((record) => {
        const studentId = record.studentId?.toString() || record.studentId;
        if (studentId) attendanceMap[studentId.toString()] = record.status;
      });
      setSlotDurationMinutes(targetSlot.durationMinutes || 75);
    } else {
      setSlotDurationMinutes(75);
    }
    setSelectedSlotNumber(slotNumber);
    setAttendanceData(attendanceMap);
    setHasUnsavedChanges(false);
  };

  const addNewSlot = () => {
    const allKnownSlots = [
      ...slotsForSelectedDate.map((slot) => slot.slotNumber),
      ...localSlotNumbers,
      selectedSlotNumber,
    ];
    const nextSlot = allKnownSlots.length > 0 ? Math.max(...allKnownSlots) + 1 : 1;
    setSelectedSlotNumber(nextSlot);
    setSlotDurationMinutes(75);
    setAttendanceData({});
    setHasUnsavedChanges(false);
    setLocalSlotNumbers((prev) => (prev.includes(nextSlot) ? prev : [...prev, nextSlot]));
  };

  const deleteSelectedSlot = async () => {
    if (!activeSection) return;
    const sectionId = activeSection._id || activeSection.id;
    const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;
    const dateStr = getDateKey(selectedDate);

    const isSavedSlot = slotsForSelectedDate.some((s) => s.slotNumber === selectedSlotNumber);
    const confirmText = isSavedSlot
      ? `Delete Slot ${selectedSlotNumber} for ${dateStr}? This will remove saved attendance records for this slot.`
      : `Remove Slot ${selectedSlotNumber}? (Not saved yet)`;

    // eslint-disable-next-line no-restricted-globals
    const ok = window.confirm(confirmText);
    if (!ok) return;

    // Unsaved: just remove locally
    if (!isSavedSlot) {
      setLocalSlotNumbers((prev) => prev.filter((n) => n !== selectedSlotNumber));
      const remaining = slotNumbersForDisplay.filter((n) => n !== selectedSlotNumber);
      const next = remaining.length > 0 ? remaining[0] : 1;
      setSelectedSlotNumber(next);
      setSlotDurationMinutes(75);
      setAttendanceData({});
      setHasUnsavedChanges(false);
      return;
    }

    try {
      await axios.delete(
        `${apiUrl}/api/teachers/attendance?sectionId=${sectionId}&courseId=${courseId}&date=${dateStr}&slotNumber=${selectedSlotNumber}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      toast.success(`Slot ${selectedSlotNumber} deleted`);
      loadDateAttendance(sectionId, selectedDate, 1);
    } catch (error) {
      handleApiError(error);
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

      const dateStr = getDateKey(selectedDate);
      const sectionId = activeSection._id || activeSection.id;
      const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;

      const response = await axios.post(
        `${apiUrl}/api/teachers/attendance`,
        {
          sectionId: sectionId,
          courseId: courseId,
          date: dateStr,
          slotNumber: selectedSlotNumber,
          durationMinutes: slotDurationMinutes,
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
        const formattedDate = getDateKey(selectedDate);

        if (!markedDates.includes(formattedDate)) {
          setMarkedDates((prev) => [...prev, formattedDate]);
        }

        // Refresh marked dates from server to get all marked dates
        const sectionId = activeSection._id || activeSection.id;
        if (sectionId) {
          fetchMarkedDates(sectionId);
          loadDateAttendance(sectionId, selectedDate, selectedSlotNumber);
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

      // Get all date-slot keys
      const allDateSlots = [];
      Object.keys(sectionData.dates)
        .sort()
        .forEach((dateKey) => {
          const dateEntry = sectionData.dates[dateKey];
          if (dateEntry?.slots && Array.isArray(dateEntry.slots)) {
            dateEntry.slots
              .slice()
              .sort((a, b) => a.slotNumber - b.slotNumber)
              .forEach((slot) => {
                allDateSlots.push({
                  key: `${dateKey}__slot-${slot.slotNumber}`,
                  date: dateKey,
                  slotNumber: slot.slotNumber,
                  students: slot.students || [],
                });
              });
          } else if (dateEntry?.students) {
            allDateSlots.push({
              key: `${dateKey}__slot-1`,
              date: dateKey,
              slotNumber: 1,
              students: dateEntry.students || [],
            });
          }
        });

      // Prepare data for CSV
      const csvData = [];

      // Header row: Student Info + Date/Slot columns
      const header = ["Roll Number", "Name", ...allDateSlots.map((entry) => `${entry.date} (S${entry.slotNumber})`)];
      csvData.push(header);

      // Data rows: Student info + attendance for each date
      students.forEach((student) => {
        const studentId = student.id?.toString() || student.id;
        const row = [
          student.rollNumber || "",
          student.name || "",
          ...allDateSlots.map((dateSlot) => {
            const dateRecords = dateSlot.students || [];
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
        ...allDateSlots.map(() => ({ wch: 14 })), // Date/Slot columns
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
        setAttendanceData({});
        loadDateAttendance(sectionId, selectedDate, selectedSlotNumber);
      }
    } else if (activeSection && students.length === 0) {
      // If no students, clear attendance data
      setAttendanceData({});
    }
  }, [activeSection?._id, activeSection?.id, selectedDate, students.length]);

  const stats = getAttendanceStats();
  const slotNumbersForDisplay = Array.from(
    new Set([
      ...slotsForSelectedDate.map((slot) => slot.slotNumber),
      ...localSlotNumbers,
      selectedSlotNumber,
    ])
  ).sort((a, b) => a - b);

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
              <div className="attendance-controls">
                <div className="quick-actions">
                  <span className="quick-actions-label">Session Slot:</span>
                  {slotNumbersForDisplay.map((slotNumber) => (
                    <button
                      key={slotNumber}
                      className={`btn-quick ${selectedSlotNumber === slotNumber ? "present" : "clear"}`}
                      onClick={() => handleSlotChange(slotNumber)}
                    >
                      Slot {slotNumber}
                    </button>
                  ))}
                  <button className="btn-quick clear" onClick={addNewSlot}>
                    + Add Slot
                  </button>
                  <button className="btn-quick absent" onClick={deleteSelectedSlot}>
                    Delete Slot
                  </button>
                </div>
                <div className="date-selector">
                  <label htmlFor="slot-duration">Duration (minutes)</label>
                  <input
                    id="slot-duration"
                    type="number"
                    min="1"
                    className="date-input"
                    value={slotDurationMinutes}
                    onChange={(e) => setSlotDurationMinutes(Number(e.target.value) || 75)}
                  />
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
