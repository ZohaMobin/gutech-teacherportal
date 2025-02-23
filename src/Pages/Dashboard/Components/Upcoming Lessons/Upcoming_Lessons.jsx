import React from 'react';
import './Upcoming_Lessons.css';

function Upcoming_Lessons() {
  const lesson1 = {
    title: 'Programming Fundamentals',
    batch: 'BS:CS - Batch 01',
    date: '09-Jan-24',
    time: '09:00 AM',
  };
  const lesson2 = {
    title: 'Object-Oriented Programming',
    batch: 'BS:CS - Batch 02',
    date: '10-Jan-24',
    time: '11:00 AM',
  };
  const lesson3 = {
    title: 'Intro to Software Engineering',
    batch: 'BS:CS - Batch 04',
    date: '10-Jan-24',
    time: '11:00 AM',
  };


  return (
    <div className="upcoming-lessons-container">
        <p style={{fontFamily: "Poppins-Medium", fontSize: 20}}>Upcoming Lessons</p>
        <div className="lessons-list">
            <div style={{border: "1.5px solid #991D20"}} className='lesson-div'>
                <div className="lesson-title-batch">
                    <p style={{fontFamily: "Poppins-Semibold", color: "#991D20"}} className="lesson-title">{lesson1.title}</p>
                    <p className="lesson-batch">{lesson1.batch}</p>
                </div>
                <div className="lesson-date-time">
                    <p style={{fontFamily: "Poppins-Semibold"}} className="lesson-date">{lesson1.date}</p>
                    <p className="lesson-time">{lesson1.time}</p>
                </div>
            </div>
            <div className='lesson-div'>
                <div className="lesson-title-batch">
                    <p className="lesson-title">{lesson2.title}</p>
                    <p className="lesson-batch">{lesson2.batch}</p>
                </div>
                <div className="lesson-date-time">
                    <p className="lesson-date">{lesson2.date}</p>
                    <p className="lesson-time">{lesson2.time}</p>
                </div>
            </div>
            <div className='lesson-div'>
                <div className="lesson-title-batch">
                    <p className="lesson-title">{lesson2.title}</p>
                    <p className="lesson-batch">{lesson2.batch}</p>
                </div>
                <div className="lesson-date-time">
                    <p className="lesson-date">{lesson2.date}</p>
                    <p className="lesson-time">{lesson2.time}</p>
                </div>
            </div>
            </div>
        </div>
  );
};

export default Upcoming_Lessons;