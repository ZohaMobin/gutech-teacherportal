
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from "../src/Pages/Sidebar/sidebar/index";

import Dashboard from './Pages/dashboard/Dashboard';
import { Topbar } from './Pages/topbar/topbar';
import GradingPage from './Pages/Teacher_Grading/Teacher_Gradings';

import React from "react";

import { RecordingsPage, RecordingLinksPage } from "./Pages/dashboard/Components/Recordings/Recordings"; // Import components
import InsideRecording from "./Pages/dashboard/Components/Recordings/InsideRecording"; // If this exists


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
        </Routes>
        </div>
        </div>
      </div>
    </Router>
  );}

export default App;





