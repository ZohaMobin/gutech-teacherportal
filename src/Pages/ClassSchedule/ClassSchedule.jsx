import Loading from '../../Components/Loading/Loading';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showToast, TOAST_TYPES } from '../../Components/Toast/Toast';
import './ClassSchedule.css';
import { buildPeriods, periodIndexOf, to12Hour } from '../../utils/timetablePeriods';
import { assignCardColors } from '../../utils/scheduleColors';

const ClassSchedule = () => {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sectionColors, setSectionColors] = useState({});
  const MAX_RETRIES = 3;

  const apiUrl = process.env.REACT_APP_BACKEND_URL;

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

      // One colour per section, handed out in order so no two sections on the timetable share one.
      const newSectionColors = assignCardColors(
        Object.values(response.data).flatMap(daySchedules => daySchedules.map(schedule => ({ key: schedule.sectionId?._id, code: schedule.courseId?.code })))
      );
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
  
  // The rows are this teacher's real class windows (8:30 - 9:55, ...), not whole hours.
  const formatTime = to12Hour;

  if (loading) {
    return (
      <div style={{ padding: '1.25rem' }}><Loading variant="table" rows={6} label={`Loading your schedule${retryCount > 0 ? ` (attempt ${retryCount + 1} of ${MAX_RETRIES + 1})` : ''}`} /></div>
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

  const periods = buildPeriods(days.flatMap(day => schedule[day] || []));

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
            {periods.map((period, rowIndex) => (
              <tr key={`${period.start}-${period.end}`}>
                <td className="time-cell">
                  <div className="time-slot-label">{`${formatTime(period.start)} - ${formatTime(period.end)}`}</div>
                </td>
                {days.map(day => {
                  // Every class of this day that belongs in this row, each showing its own times.
                  const classes = (schedule[day] || []).filter(item => periodIndexOf(item, periods) === rowIndex);

                  return (
                    <td key={`${day}-${period.start}`} className="schedule-cell">
                      {classes.map(item => (
                        <div
                          key={item._id}
                          className="class-item"
                          style={{ backgroundColor: getSectionColor(item) }}
                        >
                          <div className="course-info">
                            <span className="course-code">{item.courseId?.code}</span>
                            <span className="course-name">{item.courseId?.name}</span>
                          </div>
                          <div className="schedule-details">
                            <div className="room-info">
                              Room: {item.timeSlot.room}
                            </div>
                            <div className="section-info">
                              Section {item.sectionId?.section}
                            </div>
                            <div className="time-info">
                              {formatTime(item.timeSlot.startTime)} - {formatTime(item.timeSlot.endTime)}
                            </div>
                          </div>
                        </div>
                      ))}
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