import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './topbar.css';
import { useAuth } from '../../Components/AuthContext';

const Topbar = ({ toggleSidebar, isSidebarOpen }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const user = JSON.parse(sessionStorage.getItem('user'));
  
  // Extract first letter of name for avatar
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'GU';
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const goToPassword = () => {
    setIsProfileMenuOpen(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();                           // clears the session AND tells the app, so no signed-in page is left on screen
    navigate('/', { replace: true });   // Back must not return to a page of the ended session
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Mobile hamburger menu */}
        <div className="header-mobile-toggle">
          <button className="hamburger-button" onClick={toggleSidebar}>
            <span className={`hamburger-icon ${isSidebarOpen ? 'active' : ''}`}></span>
          </button>
        </div>

        {/* Logo for mobile */}
        <div className="header-logo-mobile">
          <div className="logo">
            <img src={`${process.env.PUBLIC_URL}/gulogo.svg`} alt="GUtech Logo" className="gulogo" />
          </div>
        </div>

        {/* Right navigation */}
        <nav className="header-nav">
          {/* User profile */}
          <div className="user-profile">
            <div className="user-avatar" onClick={toggleProfileMenu}>
              <span>{getInitial()}</span>
            </div>
            
            {/* Profile dropdown menu */}
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <span className="profile-name">{user?.name}</span>
                  <span className="profile-email">{user?.email}</span>
                </div>
                  <button type="button" className="profile-menu-item" onClick={goToPassword}>
                    Change password
                  </button>
                  <button type="button" className="profile-menu-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Topbar;
