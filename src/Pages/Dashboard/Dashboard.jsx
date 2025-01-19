import React from "react";
import '../Dashboard/Dashboard.css';
import Student_Performance from "./Components/Student Performance/Student_Performance";
import Announcement from "./Components/Announcements/Announcements";
import ChatList from "./Components/Student Chats/Student_Chats";


function Dashboard () {
    return (
        <div className="components-div">
            <Student_Performance />
            {/*  <ChatList />  */}
            {/*  <Announcement />  */}
        </div>
    );
}

export default Dashboard;