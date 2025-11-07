import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import './Attendance.css'; 

const Attendance = () => {
  const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
  
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Error handler
  const handleApiError = (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      toast.error(message);
      setError(message);
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
      setError('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred. Please try again.');
      setError('An unexpected error occurred. Please try again.');
    }
    console.error('API Error:', error);
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
    if (!sectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/api/teacher-marks/section/${sectionId}/students`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data) {
        setStudents(response.data);
        
        // Fetch existing attendance for the selected date and marked dates
        if (activeSection) {
          const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;
          if (courseId) {
            // Fetch marked dates first
            fetchMarkedDates(courseId);
            // Then fetch attendance for the selected date
            fetchExistingAttendance(courseId, selectedDate);
          }
        }
        
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch marked dates for calendar highlighting
  const fetchMarkedDates = async (courseId) => {
    if (!courseId) return;
    
    try {
      const response = await axios.get(`${apiUrl}/api/teachers/attendance?courseId=${courseId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data && response.data.attendance && Array.isArray(response.data.attendance)) {
        // Extract unique dates from attendance records
        const dates = new Set();
        response.data.attendance.forEach(courseData => {
          if (courseData.dates) {
            Object.keys(courseData.dates).forEach(dateStr => {
              dates.add(dateStr);
            });
          }
        });
        
        // Dates are already in YYYY-MM-DD format from the API
        setMarkedDates(Array.from(dates));
      }
    } catch (error) {
      console.error('Error fetching marked dates:', error);
    }
  };

  // Fetch existing attendance for a specific date
  const fetchExistingAttendance = async (courseId, date) => {
    if (!courseId || !date) return;
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/api/teachers/attendance?courseId=${courseId}&date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (response.data && response.data.attendance && Array.isArray(response.data.attendance)) {
        const attendanceMap = {};
        
        // Find the course data for this courseId
        const courseData = response.data.attendance.find(
          item => item.courseId === courseId || item.courseId?.toString() === courseId.toString()
        );
        
        if (courseData && courseData.dates && courseData.dates[dateStr]) {
          // Map student attendance from the students array
          courseData.dates[dateStr].students.forEach(record => {
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
      console.error('Error fetching existing attendance:', error);
      // Don't clear attendance data on error, just log it
    }
  };

  // Handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSearchQuery('');
    setAttendanceData({});
    setHasUnsavedChanges(false);
    fetchStudents(section._id);
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAttendanceData({});
    setHasUnsavedChanges(false);
    
    if (activeSection) {
      const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;
      if (courseId) {
        fetchExistingAttendance(courseId, date);
      }
    }
  };

  // Handle attendance status change
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => {
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
      toast.error('Please select a section first');
      return;
    }

    if (students.length === 0) {
      toast.error('No students found for this section');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const attendanceDataArray = students.map(student => {
        // Normalize student ID to string for consistent comparison
        const studentId = student.id?.toString() || student.id;
        return {
          studentId: studentId,
          status: attendanceData[studentId] || attendanceData[student.id] || 'absent'
        };
      });

      const dateStr = selectedDate.toISOString().split('T')[0];
      const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;
      
      const response = await axios.post(
        `${apiUrl}/api/teachers/attendance`,
        {
          courseId: courseId,
          date: dateStr,
          attendanceData: attendanceDataArray
        },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        toast.success('Attendance saved successfully!');
        setHasUnsavedChanges(false);
        
        // Add the current date to marked dates if not already there
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        if (!markedDates.includes(formattedDate)) {
          setMarkedDates(prev => [...prev, formattedDate]);
        }
        
        // Refresh marked dates from server to get all marked dates
        fetchMarkedDates(courseId);
        
        // Re-fetch attendance for the current date to ensure it's displayed
        fetchExistingAttendance(courseId, selectedDate);
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
    students.forEach(student => {
      const studentId = student.id?.toString() || student.id;
      newData[studentId] = 'present';
    });
    setAttendanceData(newData);
    setHasUnsavedChanges(true);
  };

  const markAllAbsent = () => {
    const newData = {};
    students.forEach(student => {
      const studentId = student.id?.toString() || student.id;
      newData[studentId] = 'absent';
    });
    setAttendanceData(newData);
    setHasUnsavedChanges(true);
  };

  const clearAll = () => {
    setAttendanceData({});
    setHasUnsavedChanges(true);
  };

  // Get attendance statistics
  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendanceData).filter(status => status === 'present').length;
    const absent = Object.values(attendanceData).filter(status => status === 'absent').length;
    const late = Object.values(attendanceData).filter(status => status === 'late').length;
    const unmarked = total - present - absent - late;

    return { total, present, absent, late, unmarked };
  };

  // Filter students by search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Highlight marked dates in calendar
  const dayClassName = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (markedDates.includes(dateStr)) {
      return 'marked-date';
    }
    return '';
  };

  // Initialize
  useEffect(() => {
    fetchSections();
  }, []);

  // Fetch attendance when section or date changes
  useEffect(() => {
    if (activeSection) {
      const courseId = activeSection.courseId?._id || activeSection.courseId?.id || activeSection.courseId;
      if (courseId && students.length > 0) {
        fetchExistingAttendance(courseId, selectedDate);
      }
    }
  }, [activeSection, selectedDate, students.length]);

  const stats = getAttendanceStats();

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-content">
          <h1>Attendance</h1>
          <p>Mark and manage student attendance</p>
        </div>
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
                  <div
                    key={section._id}
                    className={`section-item ${activeSection?._id === section._id ? 'active' : ''}`}
                    onClick={() => handleSectionChange(section)}
                  >
                    <div className="section-info">
                      <div className="section-name">{section.courseId?.name || 'Unknown Course'}</div>
                      <div className="section-code">Section {section.section} - {section.courseId?.code || ''}</div>
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
                    dateFormat="yyyy-MM-dd"
                    className="date-input"
                    dayClassName={dayClassName}
                    maxDate={new Date()}
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
              ) : filteredStudents.length === 0 ? (
                <div className="empty-state">
                  <p>No students found</p>
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
                                onClick={() => handleAttendanceChange(student.id, 'present')}
                                className={`attendance-btn present ${(attendanceData[student.id] || attendanceData[student.id?.toString()]) === 'present' ? 'active' : ''}`}
                                title="Present"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.id, 'absent')}
                                className={`attendance-btn absent ${(attendanceData[student.id] || attendanceData[student.id?.toString()]) === 'absent' ? 'active' : ''}`}
                                title="Absent"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.id, 'late')}
                                className={`attendance-btn late ${(attendanceData[student.id] || attendanceData[student.id?.toString()]) === 'late' ? 'active' : ''}`}
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
                <button
                  className="btn btn-primary save-btn"
                  onClick={saveAttendance}
                  disabled={saving || loading}
                >
                  {saving ? 'Saving...' : 'Save Attendance'}
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
