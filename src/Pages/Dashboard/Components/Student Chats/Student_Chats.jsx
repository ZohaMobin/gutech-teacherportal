import React from "react";
import "./Student_Chats.css"; 

const Student_Chats = () => {

  const chat1 = {
    name: "M. Bilal Azfar",
    message: "Sir I'm asking about Xyz topics as you disc...",
    time: "10:12 AM",
    avatar: <img style={{height: '63px'}} src='chat-avatar-1.jpg' alt='Image not found'/>
  };
  const chat2 = {
    name: "Amaz",
    message: "Sir I'm asking about Xyz topics as you disc...",
    time: "9:34 AM",
    avatar: <img style={{height: '63px'}} src='chat-avatar-2.jpg' alt='Image not found'/>
  };
  const chat3 = {
    name: "Abu Bakar",
    message: "Sir I'm asking about Xyz topics as you disc...",
    time: "Yesterday",
    avatar: <img style={{height: '63px'}} src='chat-avatar-3.jpg' alt='Image not found'/>
  };

  return (
    <div className="main-chat-div">
      <div className="title-and-chatCount">
        <p style={{fontFamily: "Poppins-Medium", fontSize: 20}}>Student Chats</p>
        <p className="chat-count">5</p>
      </div>

      <div className="chats-list">
        <div className="chat-div"> {/* Chat 01 */}
          <div className="chat-img">{chat1.avatar}</div>
          <div className="main-text-div">
            <div className="chatName-and-chatTime">
              <p style={{fontSize: 18, fontFamily: "Poppins-Medium"}}>{chat1.name}</p>
              <p style={{fontSize: 12, color: "#777878"}}>{chat1.time}</p>
            </div>
            <p>{chat1.message}</p>
          </div>
        </div>
        <div className="chat-div"> {/* Chat 01 */}
          <div className="chat-img">{chat2.avatar}</div>
          <div className="main-text-div">
            <div className="chatName-and-chatTime">
              <p style={{fontSize: 18, fontFamily: "Poppins-Medium"}}>{chat2.name}</p>
              <p style={{fontSize: 12, color: "#777878"}}>{chat2.time}</p>
            </div>
            <p>{chat2.message}</p>
          </div>
        </div>
        <div className="chat-div"> {/* Chat 01 */}
          <div className="chat-img">{chat3.avatar}</div>
          <div className="main-text-div">
            <div className="chatName-and-chatTime">
              <p style={{fontSize: 18, fontFamily: "Poppins-Medium"}}>{chat3.name}</p>
              <p style={{fontSize: 12, color: "#777878"}}>{chat3.time}</p>
            </div>
            <p>{chat1.message}</p>
          </div>
        </div>
      </div>
      
      <div className="view-all-button">
        View All
        <img src='right-arrow.svg' alt="Image not found"/>
      </div>
    </div>
  );
};

export default Student_Chats;