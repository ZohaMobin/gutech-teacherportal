import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './Pages/LoginSignUp/Authorisation';  // Import AuthProvider here
import Signup from './Pages/LoginSignUp/Signup.js';
import MainLayout from './Pages/MainLayout/MainLayout';

function App() {
  return (
    <AuthProvider> {/* Wrap your app with AuthProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<Signup />} />
          {/* Other routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
