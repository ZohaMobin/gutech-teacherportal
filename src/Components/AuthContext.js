import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateSession = () => {
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Set the auth state
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          // Clear invalid session data
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    validateSession();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Set default authorization header for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
