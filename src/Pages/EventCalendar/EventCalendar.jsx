import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css';

const localizer = momentLocalizer(moment);

function EventCalendar() {
  const [myEvents, setEvents] = useState([]);
  const [currentView, setCurrentView] = useState('month');

  return (
    <div className="calendar-container">
      <h2 className="calendar-heading">Event Calendar</h2>
      <Calendar
        localizer={localizer}
        events={myEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        view={currentView}
        defaultView="month"
        views={['month', 'week', 'day']}
        onView={(view) => setCurrentView(view)}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.color || '#991D20',
            color: 'white',
            borderRadius: '5px',
            padding: '5px',
          },
        })}
      />
    </div>
  );
}

export default EventCalendar;