import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './Components/AuthContext';
import PrivateRoute from './Components/PrivateRoute';

import MainLayout from './Pages/MainLayout/MainLayout';
import Signup from './Pages/LoginSignUp/Signup';
import Marks2 from './Pages/Marks2/Marks2';
import ClassSchedule from './Pages/ClassSchedule/ClassSchedule';
import ForgotPassword from './Pages/ForgotPassword/ForgotPassword';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/*" element={<MainLayout />}>
                <Route path="marks" element={<Marks2 />} />
                <Route path="timetable" element={<ClassSchedule />} />
                {/* Add more protected routes here */}
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
