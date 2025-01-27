import React, { useState } from 'react';
import { Search } from 'lucide-react';
import './Attendance.css';

const Attendance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [studentData, setStudentData] = useState([
    {
      id: 1,
      name: 'Shamraiz',
      semester: 'SE-25',
      enrolled: 'July 25, 2024',
      totalDaysPresent: 14,
      totalDays: 47,
      status: 'Progress',
      attendance: null
    },
    {
      id: 2,
      name: 'Khan',
      semester: 'Competitive Analysis in...',
      enrolled: 'July 25, 2024',
      totalDaysPresent: 12,
      totalDays: 47,
      status: 'Progress',
      attendance: null
    },
    {
      id: 3,
      name: 'Bradley',
      semester: 'Usability Testing and E...',
      enrolled: 'August 22, 2024',
      totalDaysPresent: 8,
      totalDays: 47,
      status: 'Pending',
      attendance: null
    },
    {
      id: 4,
      name: 'Josef gill',
      semester: 'Visual Design and Bra...',
      enrolled: 'August 20, 2024',
      totalDaysPresent: 10,
      totalDays: 47,
      status: 'Pending',
      attendance: null
    },
    {
      id: 5,
      name: 'Graham king',
      semester: 'Design Systems and C...',
      enrolled: 'September 5, 2024',
      totalDaysPresent: 15,
      totalDays: 47,
      status: 'Pending',
      attendance: null
    }
  ]);

  const handleAttendanceChange = (id, attendanceStatus) => {
    const updatedStudents = studentData.map(student => {
      if (student.id === id) {
        return {
          ...student,
          attendance: student.attendance === attendanceStatus ? null : attendanceStatus
        };
      }
      return student;
    });
    setStudentData(updatedStudents);
  };

  const filteredStudents = studentData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.semester.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-content">
          <h1>Attendance</h1>
          <p>View attendance of every student</p>
        </div>
        
        <div className="search-container">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Filter by date"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Semester</th>
              <th>Enrolled</th>
              <th>Total Days Present</th>
              <th>Total Days</th>
              <th>Status</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <div className="name-cell">
                    {student.emoji && <span className="student-emoji">{student.emoji}</span>}
                    <span>{student.name}</span>
                  </div>
                </td>
                <td>{student.semester}</td>
                <td>{student.enrolled}</td>
                <td>{student.totalDaysPresent} days</td>
                <td>{student.totalDays} days</td>
                <td>
                  <span className={`status-badge ${student.status.toLowerCase()}`}>
                    {student.status}
                  </span>
                </td>
                <td>
                  <div className="attendance-actions">
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'present')}
                      className={`attendance-btn present ${student.attendance === 'present' ? 'active' : ''}`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'absent')}
                      className={`attendance-btn absent ${student.attendance === 'absent' ? 'active' : ''}`}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student.id, 'on-leave')}
                      className={`attendance-btn on-leave ${student.attendance === 'on-leave' ? 'active' : ''}`}
                    >
                      On Leave
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <select defaultValue={10} className="rows-select">
          <option value={10}>10 rows</option>
        </select>
        <div className="pagination-buttons">
          <button className="pagination-btn active">1</button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;