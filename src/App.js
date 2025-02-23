

import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from "../src/Pages/Sidebar/sidebar/index";

import Attendance from './Pages/Attendance/Attendance';


import Dashboard from './Pages/dashboard/Dashboard';
import { Topbar } from './Pages/topbar/topbar';
import GradingPage from './Pages/Teacher_Grading/Teacher_Gradings';
import {ProgressReport } from "./Pages/Progress Report/Progress Report" ; 
import React from "react";
import Chat from  "./Pages/Chat/chat" ; 
import { RecordingsPage, RecordingLinksPage } from "./Components/Recordings/Recordings"; // Import components
import InsideRecording from "./Components/Recordings/InsideRecording"; // If this exists

import './App.css';
import TeacherEventCalendar from './Pages/EventCalendar/EventCalendar'; // 

function App() {
  return (
    <Router>

            <div className="App">
        <Sidebar />
        <div className='mainContent '>
  <Topbar/>
  <div className='content'>
        <Routes >

          <Route path="/" element={<Dashboard/>} /> 

      <Route path="/Teacher_Gradings" element={<GradingPage/>}/>
      <Route path="/Recordings" element={<RecordingsPage />} /> {/* Default route */}
        <Route path="/recording-links" element={<RecordingLinksPage />} /> {/* Route for RecordingLinksPage */}
        <Route path="/inside-recording" element={<InsideRecording />} /> {/* Route for InsideRecording */}
        <Route path="/Progress Report" element={< ProgressReport/>} />
        <Route path="/calendar" element={<TeacherEventCalendar />} />
<Route path="/chat" element={      <Chat />} />
          <Route path="/attendance" element={<Attendance />} />
      

        </Routes>
        </div>
        </div>
      </div>
    </Router>
  );}


export default App;





