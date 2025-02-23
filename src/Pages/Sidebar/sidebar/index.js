
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./index.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdown1Open, setIsDropdown1Open] = useState(false);
  const [isDropdown2Open, setIsDropdown2Open] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false); 

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);

    if (window.innerWidth < 1000) {
      document.body.style.overflow = isCollapsed ? "auto" : "hidden";
    }
  };

  const toggleDropdown1 = () => {
    setIsDropdown1Open(!isDropdown1Open);
  };

  const toggleDropdown2 = () => {
    setIsDropdown2Open(!isDropdown2Open);
  };

  const toggleMobileSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible); 
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 900) {
        setIsMobile(true);
      } else {
        setIsMobile(false); 
        setIsSidebarVisible(false); 
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>

      {isMobile && (
        <img
          onClick={toggleMobileSidebar}
          className=" toggleBtn"
          src="/Slider.svg"
          alt="Toggle Sidebar"
          style={{ position: "fixed", top: "10px", left: "10px", zIndex: 1000 }}
        />
      )}


      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobile && !isSidebarVisible ? "hidden" : ""
        }`}
        style={
          isMobile && isSidebarVisible
            ? { position: "fixed", top: 0.5, left: -8, zIndex: 999 }
            : {}
        }
      >
        <div className="sidebar-header">
          <img
            className={`logo ${isCollapsed ? "collapsed-logo" : ""}`}
            src="./gulogo.svg"
            alt="Logo"
          />
          <img
            onClick={toggleSidebar}
            className={`toggle-btn ${isCollapsed ? "" : "hidden"}`}
            src="/Slider.svg"
            alt="Toggle Sidebar"
          />
        </div>

        <ul className="nav-links">
          <Link to="/" className="sideBar-link">
            <li>
              <img
                src="/dashboard-inactive.svg"
                alt="Dashboard Icon"
                className="icon"
              />
              {!isCollapsed && "Dashboard"}
            </li>
          </Link>
          <Link to="/progress report" className="sideBar-link">
           <li>
             <img
               src="/resources-inactive.svg"
               alt="Resources Icon"
               className="icon "
             />
             {!isCollapsed && "Progress Report"}
           </li>
         </Link>

   

        

        <li className="moreOptions">
          <div className="dropdown-toggle" onClick={toggleDropdown1}>
            <img
              src="/calender-inactive.svg"
              alt="Schedules Icon"
              className="icon"
            />
            {!isCollapsed && "Schedules"}
            <span className="dropdown-icon">
              {isDropdown1Open ? "▲" : "▼"}
            </span>
          </div>
          {isDropdown1Open && (
            <ul className="dropdown-menu">
              <Link to="/schedules" className="sideBar-link">
                <li>{!isCollapsed ? "Schedules" : "Schedule"}</li>
              </Link>
              <Link to="/timetable" className="sideBar-link">
                <li>{!isCollapsed ? "Timetable" : "Time"}</li>
              </Link>
              <Link to="/calendar" className="sideBar-link">
                <li>{!isCollapsed ? "Event Calendar" : "Calendar"}</li>
              </Link>
            </ul>
          )}
        </li>


        <Link to="/downloads" className="sideBar-link">
           <li>
             <img
               src="/downloads-inactive.svg"
               alt="Downloads Icon"
               className="icon"
             />
             {!isCollapsed && "Downloads"}
           </li>
         </Link>

         <Link to="/classes" className="sideBar-link">
           <li>
             <img
               src="/classes-inactive.svg"
               alt="Classes Icon"
               className="icon-exlg "
             />
             {!isCollapsed && "Classes"}
           </li>
         </Link>

         <Link to="/notes" className="sideBar-link">
           <li>
             <img
               src="/resources-inactive.svg"
               alt="Resources Icon"
               className="icon "
             />
             {!isCollapsed && "Resources"}
           </li>
         </Link>

         <li className="moreOptions">
           <div className="dropdown-toggle " onClick={toggleDropdown2}>
             <img
               src="/clipboard-inactive.svg"
               alt="Grades Icon"
               className="icon icon-exlg "
             />
             {!isCollapsed && "Grades"}
             <span className="dropdown-icon">{isDropdown2Open ? "▲" : "▼"}</span>
           </div>
           {isDropdown2Open && (
             <ul className="dropdown-menu">
               <Link to="/Teacher_Gradings" className="sideBar-link">
                 <li>{!isCollapsed ? "Discrete" : "Discrete"}</li>
               </Link>
               <Link to="/web-development" className="sideBar-link">
                 <li>{!isCollapsed ? "Web Development" : "Web-Dev"}</li>
               </Link>
               <Link to="/programming-fundamentals" className="sideBar-link">
                 <li>{!isCollapsed ? "Programming Fundamentals" : "PF"}</li>
               </Link>
               <Link to="/design-thinking" className="sideBar-link">
                 <li>{!isCollapsed ? "Design Thinking" : "DT"}</li>
               </Link>
               <Link to="/english" className="sideBar-link">
                 <li>{!isCollapsed ? "English" : "Eng"}</li>
               </Link>
             </ul>
           )}
         </li>

         <Link to="/notes" className="sideBar-link">
           <li>
             <img src="/note-inactive.svg" alt="Notes Icon" className="icon" />
             {!isCollapsed && "Notes"}
           </li>
         </Link>

         <Link to="/recordings" className="sideBar-link">
           <li>
             <img
               src="/recordings-inactive.svg"
               alt="Recordings Icon"
               className="icon"
             />
             {!isCollapsed && "Recordings"}
           </li>
         </Link>

         <Link to="/courses" className="sideBar-link">
           <li>
             <img
               src="/courses-inactive.svg"
               alt="Courses Icon"
               className="icon icon-exlg "
             />
             {!isCollapsed && "Courses"}
           </li>
         </Link>

         <Link to="/discussions" className="sideBar-link">
           <li>
             <img
               src="/discussions-inactive.svg"
               alt="Discussions Icon"
               className="icon icon-exlg "
             />
             {!isCollapsed && "Discussions"}
           </li>
         </Link>

       
               <Link to="/fees" className="sideBar-link">
                 <li>
                   <img
                     src="/clipboard-inactive.svg"
                     alt="Fees Icon"
                     className="icon icon-exlg "
                   />
                   {isCollapsed ? "" : "Fees/Scholarship"}
                 </li>
               </Link>
               <Link to="/transcript" className="sideBar-link">
                 <li>
                   <img
                     src="/downloads-inactive.svg"
                     alt="Transcript Icon"
                     className="icon icon-exlg "
                   />
                   {isCollapsed ? "" : "Transcript"}
                 </li>
               </Link>
               <Link to="/job-opportunities" className="sideBar-link">
                 <li>
                   <img
                     src="/note-inactive.svg"
                     alt="Job Icon"
                     className="icon icon-exlg "
                   />
                   {isCollapsed ? "" : "Job-Opportunities"}
                 </li>
               </Link>
               <Link to="/settings" className="sideBar-link">
                 <li>
                   <img
                     src="/settings-inactive.svg"
                     alt="Settings Icon"
                     className="icon icon-exlg "
                   />
                   {isCollapsed ? "" : "Settings"}
                 </li>
               </Link>



        </ul>
      </div>
    </>
  );
};

export default Sidebar;