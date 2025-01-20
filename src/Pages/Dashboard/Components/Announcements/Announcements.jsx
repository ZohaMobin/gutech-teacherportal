import React from "react";
import './Announcements.css';

function Announcement() {
  const announcement1 = {
    subject: "Web Technologies Lab",
    description: "There will be a quiz conducted at the end of next class for 20 minutes on the topic of Router and its usability. Please come prepared. ",
    date: "14/01/25",
    time: "10:12 AM"
  };
  const announcement2 = {
    subject: "Asani Hackathon 2025 - Registration",
    description: "asani.io is conducting a Hackathon event for students and professionals alike. The event registration is open till 15th January. Link is given on Google Classroom. All students are encouraged to participate.",
    date: "15/01/25",
    time: "02:33 PM"
  };


  return (
    <div className="main-announcement-div">
      <p style={{fontFamily: "Poppins-Medium", fontSize: 20}}>Latest Announcements</p>
      <div className="announcement-divs">
        
        <div className="announcement">
          <div className="left-text">
            <p style={{fontFamily: "Poppins-SemiBold", fontSize: 16}}>{announcement1.subject}</p>
            <p>{announcement1.description}</p>
          </div>
          <p className="right-text">{announcement1.date} {announcement1.time}</p>
        </div>

        <div className="announcement">
          <div className="left-text">
            <p style={{fontFamily: "Poppins-SemiBold", fontSize: 16}}>{announcement2.subject}</p>
            <p>{announcement2.description}</p>
          </div>
          <p className="right-text">{announcement2.date} {announcement2.time}</p>
        </div>  
      </div>

      <div className="view-all-button">
        View All
        <img src='right-arrow.svg' alt="Image not found"/>
      </div>
    </div>
  );
}

export default Announcement;