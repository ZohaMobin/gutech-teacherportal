import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import { showToast, TOAST_TYPES } from '../../Components/Toast/Toast';
import './ClassSchedule.css';

const ClassSchedule = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sectionColors, setSectionColors] = useState({});
  const MAX_RETRIES = 3;

  const apiUrl = process.env.REACT_APP_BACKEND_URL;

  // Generate a consistent color for each section
  const generateSectionColor = (sectionId) => {
    // Predefined very light pastel colors
    const distinctColors = [
      'hsl(0, 60%, 95%)',     // Very light red
      'hsl(120, 60%, 95%)',   // Very light green
      'hsl(240, 60%, 95%)',   // Very light blue
      'hsl(60, 60%, 95%)',    // Very light yellow
      'hsl(300, 60%, 95%)',   // Very light purple
      'hsl(180, 60%, 95%)',   // Very light cyan
      'hsl(30, 60%, 95%)',    // Very light orange
      'hsl(270, 60%, 95%)',   // Very light indigo
      'hsl(150, 60%, 95%)',   // Very light teal
      'hsl(330, 60%, 95%)',   // Very light pink
      'hsl(90, 60%, 95%)',    // Very light lime
      'hsl(210, 60%, 95%)',   // Very light sky blue
      'hsl(0, 50%, 90%)',     // Extra light red
      'hsl(120, 50%, 90%)',   // Extra light green
      'hsl(240, 50%, 90%)',   // Extra light blue
    ];
    
    // Use a hash of the section ID to select a color
    const hash = sectionId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Select a color from the predefined palette
    const colorIndex = Math.abs(hash) % distinctColors.length;
    return distinctColors[colorIndex];
  };

  // Get section color for a schedule
  const getSectionColor = (schedule) => {
    if (!schedule || !schedule.sectionId) return '#f8f9fa';
    
    const sectionId = typeof schedule.sectionId === 'string' 
      ? schedule.sectionId 
      : schedule.sectionId._id;
      
    return sectionColors[sectionId] || '#f8f9fa';
  };

  const fetchSchedule = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem('user'));
      if (!userData || !userData.teacherId) {
        throw new Error('Teacher ID not found');
      }

      const response = await axios.get(`${apiUrl}/api/section-schedules/teacher/${userData.teacherId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
      });

      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Generate colors for sections
      const newSectionColors = {...sectionColors};
      Object.values(response.data).forEach(daySchedules => {
        daySchedules.forEach(schedule => {
          const sectionId = schedule.sectionId._id;
          if (!newSectionColors[sectionId]) {
            newSectionColors[sectionId] = generateSectionColor(sectionId);
          }
        });
      });
      setSectionColors(newSectionColors);

      setSchedule(response.data);
      setLoading(false);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message || 'Failed to fetch schedule');
      setLoading(false);

      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setLoading(true);
          fetchSchedule();
        }, delay);
      } else {
        showToast('Failed to load schedule after multiple attempts. Please try again later.', TOAST_TYPES.ERROR);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadSchedule = async () => {
      if (mounted) {
        await fetchSchedule();
      }
    };

    loadSchedule();

    return () => {
      mounted = false;
    };
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Define time slots with start and end times
  const timeSlots = [
    { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
    { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
    { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
    { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
    { start: '17:00', end: '18:00', label: '5:00 PM - 6:00 PM' }
  ];

  // Function to format time in 12-hour format
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your schedule{retryCount > 0 ? ` (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})` : ''}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <p>{error}</p>
          <button 
            onClick={() => {
              setRetryCount(0);
              setLoading(true);
              fetchSchedule();
            }}
            disabled={retryCount >= MAX_RETRIES}
            className={retryCount >= MAX_RETRIES ? 'disabled' : ''}
          >
            {retryCount >= MAX_RETRIES ? 'Max retries reached' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Check if there are any schedules
  const hasSchedules = Object.values(schedule).some(daySchedules => daySchedules && daySchedules.length > 0);
  if (!hasSchedules) {
    return (
      <div className="no-schedule-message">
        <p>No classes scheduled yet</p>
        <p className="subtext">Your class schedule will appear here once it's available</p>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <h2 className="heading">My Class Schedule</h2>
      <div className="table-responsive">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Time</th>
              {days.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, index) => (
              <tr key={timeSlot.start}>
                <td className="time-cell">
                  <div className="time-slot-label">{timeSlot.label}</div>
                </td>
                {days.map(day => {
                  const daySchedules = schedule[day] || [];
                  const scheduleForTime = daySchedules.find(s => 
                    s.timeSlot.startTime === timeSlot.start || 
                    (index > 0 && s.timeSlot.startTime === timeSlots[index - 1].start)
                  );

                  // Calculate rowspan for multi-hour classes
                  const rowSpan = scheduleForTime && scheduleForTime.timeSlot.startTime === timeSlot.start ? 
                    timeSlots.filter((ts, i) => 
                      i >= index && 
                      ts.start >= timeSlot.start && 
                      ts.end <= scheduleForTime.timeSlot.endTime
                    ).length : 1;

                  // Skip rendering if this cell is part of a longer class
                  if (index > 0 && scheduleForTime && 
                      scheduleForTime.timeSlot.startTime === timeSlots[index - 1].start) {
                    return null;
                  }

                  return (
                    <td 
                      key={`${day}-${timeSlot.start}`} 
                      className="schedule-cell"
                      rowSpan={rowSpan}
                    >
                      {scheduleForTime && scheduleForTime.timeSlot.startTime === timeSlot.start && (
                        <div 
                          className="class-item"
                          style={{ backgroundColor: getSectionColor(scheduleForTime) }}
                        >
                          <div className="course-info">
                            <span className="course-code">{scheduleForTime.courseId.code}</span>
                            <span className="course-name">{scheduleForTime.courseId.name}</span>
                          </div>
                          <div className="schedule-details">
                            <div className="room-info">
                              Room: {scheduleForTime.timeSlot.room}
                            </div>
                            <div className="section-info">
                              Section {scheduleForTime.sectionId.section}
                            </div>
                            <div className="time-info">
                              {formatTime(scheduleForTime.timeSlot.startTime)} - {formatTime(scheduleForTime.timeSlot.endTime)}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassSchedule; 