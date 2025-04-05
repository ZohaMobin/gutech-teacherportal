import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');
      console.log("Checking session storage: ", storedToken, storedUser);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setCurrentUser(parsedUser);
          setIsAuthenticated(true); // Set authenticated state
        } catch (err) {
          console.error("Error parsing stored user:", err);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      } else {
        setIsAuthenticated(false); // Ensure we mark as not authenticated if no token
      }
      setLoading(false);
    };

    loadAuthState();

    // Add event listener for storage changes (optional)
    window.addEventListener('storage', loadAuthState);
    return () => window.removeEventListener('storage', loadAuthState);
  }, []);

  // Login function
  const login = (user, authToken) => {
    if (!user || !authToken) {
      console.error('Invalid login data');
      return;
    }

    try {
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      setToken(authToken);
      setIsAuthenticated(true); // Mark as authenticated
    } catch (err) {
      console.error('Error storing auth data:', err);
    }
  };

  // Logout function
  const logout = () => {
    try {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      setCurrentUser(null);
      setToken(null);
      setIsAuthenticated(false); // Mark as not authenticated
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Context value
  const value = {
    currentUser,
    token,
    login,
    logout,
    isAuthenticated,
  };

  // Render only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};
