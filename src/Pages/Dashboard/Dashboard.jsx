import React from "react";
import './Dashboard.css';
import Student_Performance from "./Components/Student Performance/Student_Performance";
import Announcement from "./Components/Announcements/Announcements";
import Student_Chats from "./Components/Student Chats/Student_Chats";
import Upcoming_Lessons from "./Components/Upcoming Lessons/Upcoming_Lessons";


function Dashboard () {
    return (
        <div className="components-div">
            <Student_Performance />
            <div className="upcomingLessons-studentChats">
                <span style={{transformOrigin: "top left", transform: "scale(1.21)", marginRight: 120}}> <Upcoming_Lessons /> </span>
                <Student_Chats />
            </div>
            
            <Announcement />
        </div>
    );
}

export default Dashboard;