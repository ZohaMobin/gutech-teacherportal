import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainLayout from './Pages/MainLayout/MainLayout'; // Fixed import path
import Signup from './Pages/LoginSignUp/Signup';
import TeacherMarksManagement from './Pages/TeacherMarks/manageTeacherMarks'; // Fixed import path
import Marks2 from './Pages/Marks2/Marks2'; // Import the new Marks2 component
import './styles/global.css';  // Single global CSS file



function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Signup Page */}
          <Route path="/" element={<Signup />} />
          
          {/* Main Layout with Nested Routes */}
          <Route path="/*" element={<MainLayout />}>
            <Route path="marks" element={<TeacherMarksManagement/>} />
            <Route path="marks2" element={<Marks2/>} /> {/* Add the new Marks2 route */}
            {/* Add more routes if needed */}
          </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
