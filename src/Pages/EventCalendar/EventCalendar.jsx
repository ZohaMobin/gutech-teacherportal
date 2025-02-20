import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import axios from 'axios';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css';

const localizer = momentLocalizer(moment);

function TeacherEventCalendar() {
  const [myEvents, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('month'); // Track selected view

  const BASE_URL = 'https://student-portal-backend-sgik.onrender.com/api/calendar';

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) return;

    axios.get(`${BASE_URL}/admin/event`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      const fetchedEvents = response.data.map(event => ({
        title: event.title,
        start: moment(event.start).toDate(),
        end: moment(event.end).toDate(),
        color: event.color || '#991D20'
      }));
      setEvents(fetchedEvents);
    })
    .catch(error => setError(error.message));
  }, []);

  if (error) return <p>Error: {error}</p>;

  return (
    <div className="calendar-container">
      <h2 className="calendar-heading">Event Calendar</h2>
      <Calendar
        localizer={localizer}
        events={myEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={currentView} // Bind to state
        defaultView="month" // Explicitly set default view
        views={['month', 'week', 'day']}
        onView={(view) => setCurrentView(view)} // Update state when view changes
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.color,
            color: 'white',
            borderRadius: '5px',
            padding: '5px',
          },
        })}
      />
    </div>
  );
}

export default TeacherEventCalendar;
