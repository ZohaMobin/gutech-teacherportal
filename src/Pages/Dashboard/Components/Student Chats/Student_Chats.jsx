import React from "react";
import "./ChatList.css"; 

const ChatList = () => {

  const students = [
    { id: 1, name: "M. Bilal Azfar", time: "10:56 AM", message: "Sir I'm asking about Xyz topics as you disc..." },
    { id: 2, name: "M. Amaz", time: "10:56 AM", message: "Sir I'm asking about Xyz topics as you disc..." },
    { id: 3, name: "Abu Bakar Siddiqui", time: "10:56 AM", message: "Sir I'm asking about Xyz topics as you disc..." },
    { id: 3, name: "Hafiz.M.Huzaifa Khan", time: "10:56 AM", message: "Sir I'm asking about Xyz topics as you disc..." },
  ];

  return (
    <div className="chat-container">
      <h3>Student Chats <span className="badge">5</span></h3>
      <div className="batch-dropdown">Batch 01 ▼</div>
      <ul className="chat-list">
        {students.map((student) => (
          <li key={student.id} className="chat-item">
            <div className="chat-avatar">
              <div className="avatar-placeholder"></div>
            </div>
            <div className="chat-details">
              <p className="chat-name">{student.name}</p>
              <p className="chat-message">{student.message}</p>
            </div>
            <div className="chat-time">{student.time}</div>
          </li>
        ))}
      </ul>
      <div className="view-all">View all →</div>
    </div>
  );
};

export default ChatList;
