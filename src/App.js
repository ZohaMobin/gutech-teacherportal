import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainLayout from './Pages/MainLayout/MainLayout'; // Fixed import path
import Signup from './Pages/LoginSignUp/Signup';
import ComingSoon from './Pages/ComingSoon/comingsoon'; 
import TeacherMarksManagementContent from './Pages/TeacherMarks2/TeacherMarksManagement'; // Fixed import path



function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Signup Page */}
          <Route path="/" element={<Signup />} />
          
          {/* Main Layout with Nested Routes */}
          <Route path="/*" element={<MainLayout />}>
            <Route path="marks" element={<TeacherMarksManagementContent />} />
         

   
     
    
            {/* Add more routes if needed */}
          </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;
