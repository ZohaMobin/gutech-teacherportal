import React from "react";
import './Components/Attendance Summary/Attendance_Summary';
import Attendance_Summary from "./Components/Attendance Summary/Attendance_Summary";
import Announcement from "./Components/Announcements/Announcements";
import ChatList from "./Components/Student Chats/Student_Chats";
import Calender from "./Components/Calendar/Calendar";


function Dashboard () {
    return (
        <div>
            <Announcement />
            <ChatList />
            <Attendance_Summary />
            <Calender />
        </div>
    );
}

export default Dashboard;