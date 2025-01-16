import React from "react";
import './Announcements.css';

function Announcement() {
  return (
    
    <div className="announcement">
        <h1>Announcements</h1>
            <div className="box1">
                <div className="div1">
                    <div className="div2">
        <h4>Web Technologies Quiz</h4>
        <p>14/01/25 09:12 PM</p> 
        </div>
        <p>There will be a quiz conducted at the end of next class for 20 minutes on the topic of Router and its usability. Please come prepared. </p>
                </div>
                </div>
                <div className="box2">
                   <div className="div1">
                <div className="div2">          
        <h4>Asani Hackathon 2025 - Registration</h4>
        <p>14/01/25 09:12 PM</p> 
        </div>
        <p>asani.io is conducting a Hackathon event for students and professionals alike. The event registration is open till 15th January. Link is given on Google Classroom. All students are encouraged to participate.</p>
            </div>
            </div>
            <div className="box3">
        <button>View all</button>
        </div>
        
    </div>
  );
}

export default Announcement;