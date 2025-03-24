import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import MainLayout from './Pages/MainLayout/MainLayout';
import Signup from './Pages/LoginSignUp/Signup';
import ComingSoon from './Pages/ComingSoon/comingsoon'; 
import TeacherGrading from './Pages/TeacherMarks/StudentMarksView';
import TeacherMarksManagement from './Pages/TeacherMarks/manageTeacherMarks';

// Create a ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  // Check if user is authenticated
  const token = sessionStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Signup Page (Public) */}
          <Route path="/" element={<Signup />} />
          
          {/* Main Layout with Protected Nested Routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Protected nested routes */}
            <Route path="marks" element={<TeacherMarksManagement />} />
            <Route path="coming-soon" element={<ComingSoon />} />
            <Route path="teacher-grading" element={<TeacherGrading />} />
            
            {/* Add more protected routes as needed */}
          </Route>

          {/* Optional: Catch-all route to redirect to login or 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;